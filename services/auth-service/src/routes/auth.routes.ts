import type { FastifyInstance } from 'fastify'
import { register, login, refresh, verifyEmail, getMe, logout } from '../services/auth.service'
import { authenticate } from '../middleware/auth.middleware'

export async function authRoutes(app: FastifyInstance) {
  app.post('/register', async (req, reply) => {
    try {
      const { user, verificationToken } = await register(req.body as any)
      return reply.status(201).send({ success: true, data: { user, verificationToken } })
    } catch (err: any) {
      return reply.status(400).send({ success: false, error: err.message })
    }
  })

  app.post('/login', async (req, reply) => {
    try {
      const result = await login(req.body as any)
      return reply.send({ success: true, data: result })
    } catch (err: any) {
      return reply.status(401).send({ success: false, error: err.message })
    }
  })

  app.post('/refresh', async (req, reply) => {
    try {
      const { refreshToken } = req.body as any
      const tokens = await refresh(refreshToken)
      return reply.send({ success: true, data: tokens })
    } catch (err: any) {
      return reply.status(401).send({ success: false, error: err.message })
    }
  })

  app.post('/verify-email', async (req, reply) => {
    try {
      const { token } = req.body as any
      await verifyEmail(token)
      return reply.send({ success: true, message: 'Email verified' })
    } catch (err: any) {
      return reply.status(400).send({ success: false, error: err.message })
    }
  })

  app.get('/me', { preHandler: [authenticate] }, async (req, reply) => {
    try {
      const user = await getMe((req as any).user.id)
      return reply.send({ success: true, data: user })
    } catch (err: any) {
      return reply.status(404).send({ success: false, error: err.message })
    }
  })

  app.post('/logout', { preHandler: [authenticate] }, async (req, reply) => {
    try {
      const { refreshToken } = req.body as any
      await logout(refreshToken)
      return reply.send({ success: true, message: 'Logged out' })
    } catch (err: any) {
      return reply.status(400).send({ success: false, error: err.message })
    }
  })
}
