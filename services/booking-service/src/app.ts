import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import { bookingRoutes } from './routes/booking.routes'

const app = Fastify({ logger: { level: 'info', transport: { target: 'pino-pretty', options: { colorize: true } } } })

async function bootstrap() {
  await app.register(cors, { origin: true })
  await app.register(helmet)
  await app.register(bookingRoutes, { prefix: '/api/bookings' })
  app.get('/health', async () => ({ status: 'ok', service: 'booking-service' }))
  const port = Number(process.env.PORT) || 3004
  await app.listen({ port, host: '0.0.0.0' })
  app.log.info('Booking Service running on port ' + port)
}

bootstrap().catch(err => { console.error(err); process.exit(1) })
