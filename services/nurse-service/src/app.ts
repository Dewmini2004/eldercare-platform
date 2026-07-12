import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import multipart from '@fastify/multipart'
import { nurseRoutes } from './routes/nurse.routes'
import { db } from './db'
import { sql } from 'drizzle-orm'
import { scheduleSlncReverification } from './utils/cron'

const app = Fastify({
  logger: { transport: { target: 'pino-pretty', options: { colorize: true } } }
})

async function bootstrap() {
  await app.register(cors, { origin: true })
  await app.register(helmet)
  await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } })

  await app.register(nurseRoutes, { prefix: '/api/nurses' })

  app.get('/health', async () => ({
    status: 'ok', service: 'nurse-service', timestamp: new Date().toISOString()
  }))

  await db.execute(sql`SELECT 1`)
  console.log('✅ Nurse service DB connected')

  // Schedule SLNC re-verification every 30 days
  scheduleSlncReverification()

  const port = Number(process.env.PORT) || 3003
  await app.listen({ port, host: '0.0.0.0' })
  console.log(`👩‍⚕️ Nurse Service running on port ${port}`)
}

bootstrap().catch((err) => { console.error(err); process.exit(1) })
