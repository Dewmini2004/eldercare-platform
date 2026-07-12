import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import { authRoutes } from './routes/auth.routes'
import { db } from './db'
import { sql } from 'drizzle-orm'

const app = Fastify({ logger: { transport: { target: 'pino-pretty', options: { colorize: true } } } })

async function bootstrap() {
  await app.register(cors, { origin: true })
  await app.register(helmet)

  await app.register(authRoutes, { prefix: '/api/auth' })

  app.get('/health', async () => ({
    status: 'ok', service: 'auth-service', timestamp: new Date().toISOString()
  }))

  // Test DB connection
  await db.execute(sql`SELECT 1`)
  console.log('✅ Database connected')

  const port = Number(process.env.PORT) || 3001
  await app.listen({ port, host: '0.0.0.0' })
  console.log(`🔐 Auth Service running on port ${port}`)
}

bootstrap().catch((err) => { console.error(err); process.exit(1) })
