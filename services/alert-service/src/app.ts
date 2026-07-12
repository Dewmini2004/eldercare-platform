import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import {
  pgTable, uuid, text, boolean,
  timestamp, pgEnum, jsonb, index
} from 'drizzle-orm/pg-core'
import { eq, and, sql, desc } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'

// ─── Schema ──────────────────────────────────────────────────────────────────

const alertSeverityEnum = pgEnum('alert_severity', ['info', 'attention', 'urgent', 'critical'])

const alerts = pgTable('alerts', {
  id:                   uuid('id').primaryKey().defaultRandom(),
  homeId:               uuid('home_id').notNull(),
  elderId:              uuid('elder_id').notNull(),
  elderName:            text('elder_name').notNull(),
  reportedBy:           text('reported_by').notNull(),
  rawIncident:          text('raw_incident').notNull(),
  aiSummary:            text('ai_summary'),
  aiSeverity:           alertSeverityEnum('ai_severity').default('info'),
  aiSuggestedActions:   jsonb('ai_suggested_actions').$type<string[]>().default([]),
  requiresImmediateContact: boolean('requires_immediate_contact').default(false),
  familyUserIds:        jsonb('family_user_ids').$type<string[]>().default([]),
  notifiedFamilyAt:     timestamp('notified_family_at'),
  acknowledgedAt:       timestamp('acknowledged_at'),
  resolvedAt:           timestamp('resolved_at'),
  createdAt:            timestamp('created_at').defaultNow().notNull()
}, (t) => ({
  homeIdx:   index('alerts_home_idx').on(t.homeId),
  elderIdx:  index('alerts_elder_idx').on(t.elderId),
  severityIdx: index('alerts_severity_idx').on(t.aiSeverity)
}))

// ─── DB ──────────────────────────────────────────────────────────────────────

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const db = drizzle(pool, { schema: { alerts } })

// ─── AI Service call ─────────────────────────────────────────────────────────

async function analyzeWithAI(alertId: string, rawReport: string, elderName: string, elderAge: number, conditions: string[]) {
  try {
    const res = await fetch(`${process.env.AI_SERVICE_URL}/api/ai/alerts/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawReport, elderName, elderAge, elderConditions: conditions }),
      signal: AbortSignal.timeout(15000)
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.data
  } catch {
    return null
  }
}

// ─── Routes ──────────────────────────────────────────────────────────────────

async function alertRoutes(app: FastifyInstance) {

  // POST /api/alerts — home staff files an incident
  app.post('/', async (req, reply) => {
    try {
      const body = req.body as any

      // Create alert with raw report
      const [alert] = await db.insert(alerts).values({
        homeId:        body.homeId,
        elderId:       body.elderId,
        elderName:     body.elderName,
        reportedBy:    body.reportedBy || 'Staff',
        rawIncident:   body.rawIncident,
        familyUserIds: body.familyUserIds || []
      }).returning()

      // Analyze asynchronously — don't block response
      analyzeWithAI(
        alert.id,
        body.rawIncident,
        body.elderName,
        body.elderAge || 70,
        body.elderConditions || []
      ).then(async (analysis) => {
        if (!analysis) return
        await db.update(alerts).set({
          aiSummary:                analysis.summary,
          aiSeverity:               analysis.severity,
          aiSuggestedActions:       analysis.suggestedActions,
          requiresImmediateContact: analysis.requiresImmediateContact,
          notifiedFamilyAt:         new Date()
        }).where(eq(alerts.id, alert.id))
      })

      return reply.status(201).send({ success: true, data: alert })
    } catch (err: any) {
      return reply.status(400).send({ success: false, error: err.message })
    }
  })

  // GET /api/alerts/family/:userId — alerts for a family member
  app.get('/family/:userId', async (req, reply) => {
    try {
      const { userId } = req.params as any
      const data = await db.select().from(alerts)
        .where(sql`${alerts.familyUserIds} ? ${userId}`)
        .orderBy(desc(alerts.createdAt))
        .limit(50)
      return reply.send({ success: true, data })
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message })
    }
  })

  // GET /api/alerts/home/:homeId — all alerts for a home
  app.get('/home/:homeId', async (req, reply) => {
    try {
      const data = await db.select().from(alerts)
        .where(eq(alerts.homeId, (req.params as any).homeId))
        .orderBy(desc(alerts.createdAt))
        .limit(100)
      return reply.send({ success: true, data })
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message })
    }
  })

  // GET /api/alerts/mine (uses x-user-id header)
  app.get('/mine', async (req, reply) => {
    try {
      const userId = req.headers['x-user-id'] as string
      const data = await db.select().from(alerts)
        .where(sql`${alerts.familyUserIds} ? ${userId}`)
        .orderBy(desc(alerts.createdAt))
        .limit(50)
      return reply.send({ success: true, data })
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message })
    }
  })

  // PATCH /api/alerts/:id/acknowledge
  app.patch('/:id/acknowledge', async (req, reply) => {
    try {
      await db.update(alerts)
        .set({ acknowledgedAt: new Date() })
        .where(eq(alerts.id, (req.params as any).id))
      return reply.send({ success: true })
    } catch (err: any) {
      return reply.status(400).send({ success: false, error: err.message })
    }
  })

  // PATCH /api/alerts/:id/resolve
  app.patch('/:id/resolve', async (req, reply) => {
    try {
      await db.update(alerts)
        .set({ resolvedAt: new Date() })
        .where(eq(alerts.id, (req.params as any).id))
      return reply.send({ success: true })
    } catch (err: any) {
      return reply.status(400).send({ success: false, error: err.message })
    }
  })
}

// ─── App ─────────────────────────────────────────────────────────────────────

const app = Fastify({
  logger: { transport: { target: 'pino-pretty', options: { colorize: true } } }
})

async function bootstrap() {
  await app.register(cors, { origin: true })
  await app.register(helmet)
  await app.register(alertRoutes, { prefix: '/api/alerts' })
  app.get('/health', async () => ({ status: 'ok', service: 'alert-service' }))
  await db.execute(sql`SELECT 1`)
  const port = Number(process.env.PORT) || 3005
  await app.listen({ port, host: '0.0.0.0' })
  console.log(`🚨 Alert Service running on port ${port}`)
}

bootstrap().catch((err) => { console.error(err); process.exit(1) })
