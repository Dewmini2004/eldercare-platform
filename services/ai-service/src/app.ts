import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import { matchingRoutes } from './routes/matching.routes'
import { alertRoutes } from './routes/alert.routes'
import { chatbotRoutes } from './routes/chatbot.routes'
import { documentRoutes } from './routes/document.routes'
import { connectRedis } from './utils/redis'
import { connectRabbitMQ } from './utils/rabbitmq'

const app = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
    transport: {
      target: 'pino-pretty',
      options: { colorize: true }
    }
  }
})

async function bootstrap() {
  // Plugins
  await app.register(cors, { origin: true })
  await app.register(helmet)
  await app.register(rateLimit, {
    max: 50,
    timeWindow: '1 minute'
  })

  // Routes
  await app.register(matchingRoutes, { prefix: '/api/ai/match' })
  await app.register(alertRoutes,    { prefix: '/api/ai/alerts' })
  await app.register(chatbotRoutes,  { prefix: '/api/ai/chat' })
  await app.register(documentRoutes, { prefix: '/api/ai/documents' })

  // Health check
  app.get('/health', async () => ({
    status: 'ok',
    service: 'ai-service',
    timestamp: new Date().toISOString()
  }))

  // Infrastructure
  await connectRedis()
  await connectRabbitMQ()

  const port = Number(process.env.PORT) || 3007
  await app.listen({ port, host: '0.0.0.0' })
  app.log.info(`🤖 AI Service running on port ${port}`)
}

bootstrap().catch((err) => {
  console.error('Failed to start AI service:', err)
  process.exit(1)
})
