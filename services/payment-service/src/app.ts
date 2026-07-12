import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import crypto from 'crypto'
import type { FastifyInstance } from 'fastify'

const PAYHERE_MERCHANT_ID = process.env.PAYHERE_MERCHANT_ID!
const PAYHERE_SECRET       = process.env.PAYHERE_SECRET!
const PAYHERE_MODE         = process.env.PAYHERE_MODE || 'sandbox'

const PAYHERE_BASE = PAYHERE_MODE === 'live'
  ? 'https://www.payhere.lk'
  : 'https://sandbox.payhere.lk'

// ─── PayHere Hash Generation ──────────────────────────────────────────────────
// Formula: MD5( merchant_id + order_id + amount + currency + MD5(secret).toUpper() ).toUpper()

function generateHash(orderId: string, amount: string, currency: string = 'LKR'): string {
  const secretHash = crypto.createHash('md5').update(PAYHERE_SECRET).digest('hex').toUpperCase()
  const raw = `${PAYHERE_MERCHANT_ID}${orderId}${amount}${currency}${secretHash}`
  return crypto.createHash('md5').update(raw).digest('hex').toUpperCase()
}

function verifyNotifyHash(
  merchantId: string, orderId: string, payhereAmount: string,
  payhereCurrency: string, statusCode: string, md5sig: string
): boolean {
  const secretHash = crypto.createHash('md5').update(PAYHERE_SECRET).digest('hex').toUpperCase()
  const raw = `${merchantId}${orderId}${payhereAmount}${payhereCurrency}${statusCode}${secretHash}`
  const expected = crypto.createHash('md5').update(raw).digest('hex').toUpperCase()
  return expected === md5sig
}

// ─── Routes ──────────────────────────────────────────────────────────────────

async function paymentRoutes(app: FastifyInstance) {

  // POST /api/payments/initiate — get PayHere payment params
  app.post('/initiate', async (req, reply) => {
    try {
      const {
        bookingId, amountLkr, firstName, lastName,
        email, phone, address, city, description
      } = req.body as any

      const orderId = `EC-${bookingId}`
      const amount  = Number(amountLkr).toFixed(2)
      const hash    = generateHash(orderId, amount)

      return reply.send({
        success: true,
        data: {
          action:        `${PAYHERE_BASE}/pay/checkout`,
          merchant_id:   PAYHERE_MERCHANT_ID,
          return_url:    `${process.env.FRONTEND_URL}/payment/success`,
          cancel_url:    `${process.env.FRONTEND_URL}/payment/cancel`,
          notify_url:    `${process.env.PAYMENT_SERVICE_URL}/api/payments/notify`,
          order_id:      orderId,
          items:         description || 'Elder Care Booking',
          currency:      'LKR',
          amount,
          first_name:    firstName,
          last_name:     lastName,
          email,
          phone,
          address,
          city,
          country:       'Sri Lanka',
          hash
        }
      })
    } catch (err: any) {
      return reply.status(400).send({ success: false, error: err.message })
    }
  })

  // POST /api/payments/notify — PayHere webhook (server-to-server)
  app.post('/notify', async (req, reply) => {
    try {
      const {
        merchant_id, order_id, payhere_amount,
        payhere_currency, status_code, md5sig
      } = req.body as any

      const valid = verifyNotifyHash(
        merchant_id, order_id, payhere_amount,
        payhere_currency, status_code, md5sig
      )
      if (!valid) {
        return reply.status(400).send('Invalid signature')
      }

      // status_code: 2 = success, -1 = cancelled, -2 = failed, -3 = chargedback
      const bookingId = order_id.replace('EC-', '')
      const success   = status_code === '2'

      // Notify booking service
      await fetch(`${process.env.BOOKING_SERVICE_URL}/api/bookings/${bookingId}/payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: `PH-${Date.now()}`,
          status: success ? 'success' : 'failed'
        })
      })

      return reply.send('OK')
    } catch (err: any) {
      app.log.error(err)
      return reply.status(500).send('Error')
    }
  })

  // GET /api/payments/status/:bookingId
  app.get('/status/:bookingId', async (req, reply) => {
    const bookingId = (req.params as any).bookingId
    const res = await fetch(`${process.env.BOOKING_SERVICE_URL}/api/bookings/${bookingId}`)
    const booking = await res.json()
    return reply.send({
      success: true,
      data: {
        bookingId,
        paymentStatus: booking.data?.paymentStatus,
        bookingStatus: booking.data?.status
      }
    })
  })
}

// ─── App ─────────────────────────────────────────────────────────────────────

const app = Fastify({
  logger: { transport: { target: 'pino-pretty', options: { colorize: true } } }
})

async function bootstrap() {
  await app.register(cors, { origin: true })
  await app.register(helmet)
  await app.register(paymentRoutes, { prefix: '/api/payments' })
  app.get('/health', async () => ({ status: 'ok', service: 'payment-service' }))
  const port = Number(process.env.PORT) || 3006
  await app.listen({ port, host: '0.0.0.0' })
  console.log(`💳 Payment Service running on port ${port}`)
}

bootstrap().catch((err) => { console.error(err); process.exit(1) })
