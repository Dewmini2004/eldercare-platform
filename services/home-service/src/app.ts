import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import multipart from '@fastify/multipart'
import { homeRoutes } from './routes/home.routes'
import { db } from './db'
import { sql } from 'drizzle-orm'

const app = Fastify({
  logger: {
    transport: { target: 'pino-pretty', options: { colorize: true } }
  }
})

async function bootstrap() {
  await app.register(cors, { origin: true })
  await app.register(helmet)
  await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } })

  await app.register(homeRoutes, { prefix: '/api/homes' })

  app.get('/health', async () => ({
    status: 'ok', service: 'home-service', timestamp: new Date().toISOString()
  }))

  await db.execute(sql`SELECT 1`)
  console.log('✅ Home service DB connected')

  const port = Number(process.env.PORT) || 3002
  await app.listen({ port, host: '0.0.0.0' })
  console.log(`🏠 Home Service running on port ${port}`)
}

bootstrap().catch((err) => { console.error(err); process.exit(1) })
