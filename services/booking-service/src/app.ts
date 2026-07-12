import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import {
  pgTable, uuid, text, integer, decimal,
  timestamp, pgEnum, jsonb, index
} from 'drizzle-orm/pg-core'
import { eq, and, sql } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'

// ─── Schema ──────────────────────────────────────────────────────────────────

const bookingTypeEnum   = pgEnum('booking_type',   ['residential', 'home_visit', 'nurse_hire'])
const bookingStatusEnum = pgEnum('booking_status',  ['pending', 'confirmed', 'active', 'completed', 'cancelled', 'refunded'])
const paymentStatusEnum = pgEnum('payment_status',  ['pending', 'paid', 'refunded'])

const bookings = pgTable('bookings', {
  id:              uuid('id').primaryKey().defaultRandom(),
  bookingType:     bookingTypeEnum('booking_type').notNull(),
  status:          bookingStatusEnum('status').notNull().default('pending'),
  familyUserId:    uuid('family_user_id').notNull(),
  homeId:          uuid('home_id'),
  nurseId:         uuid('nurse_id'),
  elderName:       text('elder_name').notNull(),
  elderAge:        integer('elder_age').notNull(),
  elderConditions: jsonb('elder_conditions').$type<string[]>().default([]),
  startDate:       timestamp('start_date').notNull(),
  endDate:         timestamp('end_date'),
  totalAmountLkr:  decimal('total_amount_lkr', { precision: 12, scale: 2 }).notNull(),
  paymentStatus:   paymentStatusEnum('payment_status').notNull().default('pending'),
  paymentId:       text('payment_id'),
  notes:           text('notes'),
  createdAt:       timestamp('created_at').defaultNow().notNull(),
  updatedAt:       timestamp('updated_at').defaultNow().notNull()
}, (t) => ({
  familyIdx: index('bookings_family_idx').on(t.familyUserId),
  homeIdx:   index('bookings_home_idx').on(t.homeId),
  nurseIdx:  index('bookings_nurse_idx').on(t.nurseId)
}))

// ─── DB ──────────────────────────────────────────────────────────────────────

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const db = drizzle(pool, { schema: { bookings } })

// ─── Routes ──────────────────────────────────────────────────────────────────

async function bookingRoutes(app: FastifyInstance) {

  // POST /api/bookings
  app.post('/', async (req, reply) => {
    try {
      const userId = req.headers['x-user-id'] as string
      const body = req.body as any
      const [booking] = await db.insert(bookings).values({
        ...body,
        familyUserId: userId,
        status: 'pending',
        paymentStatus: 'pending',
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : undefined
      }).returning()
      return reply.status(201).send({ success: true, data: booking })
    } catch (err: any) {
      return reply.status(400).send({ success: false, error: err.message })
    }
  })

  // GET /api/bookings/mine — family user's bookings
  app.get('/mine', async (req, reply) => {
    try {
      const userId = req.headers['x-user-id'] as string
      const data = await db.select().from(bookings)
        .where(eq(bookings.familyUserId, userId))
        .orderBy(sql`created_at DESC`)
      return reply.send({ success: true, data })
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message })
    }
  })

  // GET /api/bookings/home/:homeId — home admin view
  app.get('/home/:homeId', async (req, reply) => {
    try {
      const data = await db.select().from(bookings)
        .where(eq(bookings.homeId, (req.params as any).homeId))
        .orderBy(sql`created_at DESC`)
      return reply.send({ success: true, data })
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message })
    }
  })

  // GET /api/bookings/:id
  app.get('/:id', async (req, reply) => {
    try {
      const [booking] = await db.select().from(bookings)
        .where(eq(bookings.id, (req.params as any).id)).limit(1)
      if (!booking) return reply.status(404).send({ success: false, error: 'Booking not found' })
      return reply.send({ success: true, data: booking })
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message })
    }
  })

  // PATCH /api/bookings/:id/confirm
  app.patch('/:id/confirm', async (req, reply) => {
    try {
      const [booking] = await db.update(bookings)
        .set({ status: 'confirmed', updatedAt: new Date() })
        .where(eq(bookings.id, (req.params as any).id))
        .returning()
      return reply.send({ success: true, data: booking })
    } catch (err: any) {
      return reply.status(400).send({ success: false, error: err.message })
    }
  })

  // PATCH /api/bookings/:id/cancel
  app.patch('/:id/cancel', async (req, reply) => {
    try {
      const [booking] = await db.update(bookings)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(eq(bookings.id, (req.params as any).id))
        .returning()
      return reply.send({ success: true, data: booking })
    } catch (err: any) {
      return reply.status(400).send({ success: false, error: err.message })
    }
  })

  // PATCH /api/bookings/:id/payment — called by payment service after PayHere webhook
  app.patch('/:id/payment', async (req, reply) => {
    try {
      const { paymentId, status } = req.body as any
      const [booking] = await db.update(bookings)
        .set({
          paymentId,
          paymentStatus: status === 'success' ? 'paid' : 'pending',
          status: status === 'success' ? 'confirmed' : 'pending',
          updatedAt: new Date()
        })
        .where(eq(bookings.id, (req.params as any).id))
        .returning()
      return reply.send({ success: true, data: booking })
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
  await app.register(bookingRoutes, { prefix: '/api/bookings' })
  app.get('/health', async () => ({ status: 'ok', service: 'booking-service' }))
  await db.execute(sql`SELECT 1`)
  const port = Number(process.env.PORT) || 3004
  await app.listen({ port, host: '0.0.0.0' })
  console.log(`📅 Booking Service running on port ${port}`)
}

bootstrap().catch((err) => { console.error(err); process.exit(1) })
