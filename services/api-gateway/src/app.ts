import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import proxy from '@fastify/http-proxy'
import jwt from 'jsonwebtoken'
import type { FastifyRequest, FastifyReply } from 'fastify'

const app = Fastify({
  logger: { transport: { target: 'pino-pretty', options: { colorize: true } } }
})

const SERVICES = {
  auth:         process.env.AUTH_SERVICE_URL         || 'http://localhost:3001',
  homes:        process.env.HOME_SERVICE_URL         || 'http://localhost:3002',
  nurses:       process.env.NURSE_SERVICE_URL        || 'http://localhost:3003',
  bookings:     process.env.BOOKING_SERVICE_URL      || 'http://localhost:3004',
  alerts:       process.env.ALERT_SERVICE_URL        || 'http://localhost:3005',
  payments:     process.env.PAYMENT_SERVICE_URL      || 'http://localhost:3006',
  ai:           process.env.AI_SERVICE_URL           || 'http://localhost:3007',
  notifications:process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3008'
}

const JWT_SECRET = process.env.JWT_SECRET!

// ─── Auth middleware ─────────────────────────────────────────────────────────

function extractUser(req: FastifyRequest): { id: string; role: string } | null {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return null
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET) as any
    return { id: payload.sub, role: payload.role }
  } catch {
    return null
  }
}

// Inject user info into proxied headers
function addUserHeaders(req: FastifyRequest) {
  const user = extractUser(req)
  if (user) {
    req.headers['x-user-id']   = user.id
    req.headers['x-user-role'] = user.role
  }
}

// Require auth middleware
async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  const user = extractUser(req)
  if (!user) return reply.status(401).send({ success: false, error: 'Authentication required' })
  req.headers['x-user-id']   = user.id
  req.headers['x-user-role'] = user.role
}

async function bootstrap() {
  await app.register(cors, {
    origin: [
      'http://localhost:3001',
      process.env.FRONTEND_URL || 'http://localhost:3001'
    ],
    credentials: true
  })

  await app.register(helmet)

  await app.register(rateLimit, {
    global: true,
    max: 200,
    timeWindow: '1 minute',
    keyGenerator: (req) => extractUser(req)?.id || req.ip
  })

  // ─── Public Routes (no auth) ─────────────────────────────────────────────

  // Auth
  await app.register(proxy, {
    upstream: SERVICES.auth,
    prefix: '/api/auth',
    rewritePrefix: '/api/auth',
    http2: false
  })

  // Public home search
  await app.register(proxy, {
    upstream: SERVICES.homes,
    prefix: '/api/homes',
    rewritePrefix: '/api/homes',
    http2: false,
    preHandler: (req, _reply, done) => { addUserHeaders(req); done() }
  })

  // Public nurse search
  await app.register(proxy, {
    upstream: SERVICES.nurses,
    prefix: '/api/nurses',
    rewritePrefix: '/api/nurses',
    http2: false,
    preHandler: (req, _reply, done) => { addUserHeaders(req); done() }
  })

  // ─── Protected Routes (auth required) ────────────────────────────────────

  await app.register(proxy, {
    upstream: SERVICES.bookings,
    prefix: '/api/bookings',
    rewritePrefix: '/api/bookings',
    http2: false,
    preHandler: requireAuth
  })

  await app.register(proxy, {
    upstream: SERVICES.alerts,
    prefix: '/api/alerts',
    rewritePrefix: '/api/alerts',
    http2: false,
    preHandler: requireAuth
  })

  await app.register(proxy, {
    upstream: SERVICES.payments,
    prefix: '/api/payments',
    rewritePrefix: '/api/payments',
    http2: false,
    preHandler: (req, _reply, done) => { addUserHeaders(req); done() }
  })

  await app.register(proxy, {
    upstream: SERVICES.ai,
    prefix: '/api/ai',
    rewritePrefix: '/api/ai',
    http2: false,
    preHandler: requireAuth
  })

  // ─── Health check ─────────────────────────────────────────────────────────

  app.get('/health', async () => {
    const checks = await Promise.allSettled(
      Object.entries(SERVICES).map(async ([name, url]) => {
        const res = await fetch(`${url}/health`, { signal: AbortSignal.timeout(2000) })
        return { name, status: res.ok ? 'ok' : 'error' }
      })
    )
    const services = checks.map((c) =>
      c.status === 'fulfilled' ? c.value : { name: 'unknown', status: 'error' }
    )
    return {
      status: 'ok',
      service: 'api-gateway',
      timestamp: new Date().toISOString(),
      services
    }
  })

  const port = Number(process.env.PORT) || 3000
  await app.listen({ port, host: '0.0.0.0' })
  console.log(`🚀 API Gateway running on port ${port}`)
}

bootstrap().catch((err) => { console.error(err); process.exit(1) })
