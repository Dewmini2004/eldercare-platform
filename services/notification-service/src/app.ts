import Fastify from 'fastify'
import cors from '@fastify/cors'
import nodemailer from 'nodemailer'
import twilio from 'twilio'
import type { FastifyInstance } from 'fastify'

// ─── Clients ──────────────────────────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
  port:   Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
})

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string) {
  await transporter.sendMail({
    from: `"ElderCare Sri Lanka" <${process.env.SMTP_USER}>`,
    to, subject, html
  })
}

async function sendSMS(to: string, body: string) {
  await twilioClient.messages.create({
    body,
    from: process.env.TWILIO_PHONE,
    to
  })
}

function buildAlertEmail(elderName: string, summary: string, severity: string, actions: string[]) {
  const severityColors: Record<string, string> = {
    info: '#2980B9', attention: '#E67E22', urgent: '#E74C3C', critical: '#C0392B'
  }
  const color = severityColors[severity] || '#2980B9'

  return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: #1B4332; padding: 20px; border-radius: 8px 8px 0 0;">
      <h1 style="color: #fff; margin: 0; font-size: 20px;">ElderCare Sri Lanka</h1>
      <p style="color: #D8F3DC; margin: 4px 0 0; font-size: 13px;">Alert for ${elderName}</p>
    </div>
    <div style="background: #fff; padding: 24px; border: 1px solid #E0D9D0;">
      <div style="background: ${color}15; border-left: 4px solid ${color}; padding: 12px 16px; margin-bottom: 20px; border-radius: 0 6px 6px 0;">
        <span style="background: ${color}; color: #fff; padding: 2px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase;">${severity}</span>
      </div>
      <h2 style="color: #1B4332; font-size: 16px; margin-top: 0;">Update about ${elderName}</h2>
      <p style="color: #333; line-height: 1.6;">${summary}</p>
      ${actions.length > 0 ? `
      <h3 style="color: #1B4332; font-size: 14px;">Suggested next steps:</h3>
      <ul style="color: #333; line-height: 1.8; padding-left: 20px;">
        ${actions.map((a) => `<li>${a}</li>`).join('')}
      </ul>` : ''}
      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #E0D9D0;">
        <a href="${process.env.FRONTEND_URL}/dashboard/family/alerts"
           style="background: #1B4332; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">
          View full alert
        </a>
      </div>
    </div>
    <div style="background: #F8F4EF; padding: 12px 20px; border-radius: 0 0 8px 8px; font-size: 12px; color: #888;">
      ElderCare Sri Lanka · You're receiving this because you're a registered family member.
    </div>
  </div>`
}

// ─── Routes ──────────────────────────────────────────────────────────────────

async function notificationRoutes(app: FastifyInstance) {

  // POST /api/notifications/alert — send emergency alert to family
  app.post('/alert', async (req, reply) => {
    try {
      const { elderName, summary, severity, suggestedActions, familyEmails, familyPhones } = req.body as any

      const html = buildAlertEmail(elderName, summary, severity, suggestedActions || [])
      const subject = `[${severity.toUpperCase()}] Update about ${elderName} — ElderCare Sri Lanka`

      const emailPromises = (familyEmails || []).map((email: string) =>
        sendEmail(email, subject, html).catch((e) => console.error('Email failed:', e))
      )

      const smsBody = `ElderCare SL: ${elderName} — ${summary.slice(0, 140)} View details at eldercare.lk`
      const smsPromises = (familyPhones || []).map((phone: string) =>
        sendSMS(phone, smsBody).catch((e) => console.error('SMS failed:', e))
      )

      await Promise.all([...emailPromises, ...smsPromises])
      return reply.send({ success: true, sent: { emails: familyEmails?.length || 0, sms: familyPhones?.length || 0 } })
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message })
    }
  })

  // POST /api/notifications/email-verify — send verification email
  app.post('/email-verify', async (req, reply) => {
    try {
      const { email, fullName, token } = req.body as any
      const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`
      const html = `
        <div style="font-family: Arial; max-width: 500px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #1B4332;">Verify your email</h2>
          <p>Hi ${fullName}, welcome to ElderCare Sri Lanka!</p>
          <p>Click the button below to verify your email address:</p>
          <a href="${verifyUrl}" style="background: #1B4332; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; margin: 16px 0;">Verify email</a>
          <p style="color: #888; font-size: 13px;">This link expires in 24 hours.</p>
        </div>`
      await sendEmail(email, 'Verify your ElderCare Sri Lanka account', html)
      return reply.send({ success: true })
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message })
    }
  })

  // POST /api/notifications/booking-confirm
  app.post('/booking-confirm', async (req, reply) => {
    try {
      const { email, fullName, elderName, homeName, startDate, amountLkr } = req.body as any
      const html = `
        <div style="font-family: Arial; max-width: 500px; margin: 0 auto; padding: 24px;">
          <div style="background: #1B4332; padding: 16px; border-radius: 8px 8px 0 0;">
            <h2 style="color: #fff; margin: 0;">Booking confirmed</h2>
          </div>
          <div style="background: #fff; border: 1px solid #E0D9D0; padding: 20px;">
            <p>Hi ${fullName},</p>
            <p>Your booking for <strong>${elderName}</strong> at <strong>${homeName}</strong> has been confirmed.</p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
              <tr><td style="padding: 8px; color: #666; border-bottom: 1px solid #eee;">Start date</td><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">${startDate}</td></tr>
              <tr><td style="padding: 8px; color: #666;">Amount</td><td style="padding: 8px; font-weight: bold;">LKR ${Number(amountLkr).toLocaleString()}</td></tr>
            </table>
          </div>
        </div>`
      await sendEmail(email, `Booking confirmed — ${homeName}`, html)
      return reply.send({ success: true })
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message })
    }
  })
}

// ─── App ─────────────────────────────────────────────────────────────────────

const app = Fastify({
  logger: { transport: { target: 'pino-pretty', options: { colorize: true } } }
})

async function bootstrap() {
  await app.register(cors, { origin: true })
  await app.register(notificationRoutes, { prefix: '/api/notifications' })
  app.get('/health', async () => ({ status: 'ok', service: 'notification-service' }))
  const port = Number(process.env.PORT) || 3008
  await app.listen({ port, host: '0.0.0.0' })
  console.log(`📧 Notification Service running on port ${port}`)
}

bootstrap().catch((err) => { console.error(err); process.exit(1) })
