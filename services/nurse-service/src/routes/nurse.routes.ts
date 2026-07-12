import type { FastifyInstance } from 'fastify'
import {
  searchNurses, getNurseById, getNurseByUserId,
  createNurseProfile, updateNurseProfile, addNurseReview
} from '../services/nurses.service'
import { verifyAndUpdateNurse } from '../services/slnc-verification.service'

export async function nurseRoutes(app: FastifyInstance) {

  // GET /api/nurses
  app.get('/', async (req, reply) => {
    try {
      const q = req.query as any
      const result = await searchNurses({
        district:       q.district,
        province:       q.province,
        slncStatus:     q.slncStatus,
        availableFor:   q.availableFor,
        specialization: q.specialization,
        maxHourlyRate:  q.maxHourlyRate ? Number(q.maxHourlyRate) : undefined,
        maxMonthlyRate: q.maxMonthlyRate ? Number(q.maxMonthlyRate) : undefined,
        page:           q.page  ? Number(q.page)  : 1,
        limit:          q.limit ? Number(q.limit) : 20
      })
      return reply.send({ success: true, ...result })
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message })
    }
  })

  // GET /api/nurses/:id
  app.get('/:id', async (req, reply) => {
    try {
      const nurse = await getNurseById((req.params as any).id)
      return reply.send({ success: true, data: nurse })
    } catch (err: any) {
      return reply.status(404).send({ success: false, error: err.message })
    }
  })

  // GET /api/nurses/me/profile
  app.get('/me/profile', async (req, reply) => {
    try {
      const userId = req.headers['x-user-id'] as string
      const nurse = await getNurseByUserId(userId)
      return reply.send({ success: true, data: nurse })
    } catch (err: any) {
      return reply.status(404).send({ success: false, error: err.message })
    }
  })

  // POST /api/nurses — create nurse profile
  app.post('/', async (req, reply) => {
    try {
      const userId = req.headers['x-user-id'] as string
      const body = req.body as any
      const nurse = await createNurseProfile({ ...body, userId, status: 'pending' })
      return reply.status(201).send({ success: true, data: nurse })
    } catch (err: any) {
      return reply.status(400).send({ success: false, error: err.message })
    }
  })

  // PUT /api/nurses/:id — update profile
  app.put('/:id', async (req, reply) => {
    try {
      const userId = req.headers['x-user-id'] as string
      const nurse = await updateNurseProfile((req.params as any).id, userId, req.body as any)
      return reply.send({ success: true, data: nurse })
    } catch (err: any) {
      return reply.status(400).send({ success: false, error: err.message })
    }
  })

  // POST /api/nurses/:id/verify-slnc — trigger SLNC check
  app.post('/:id/verify-slnc', async (req, reply) => {
    try {
      const result = await verifyAndUpdateNurse((req.params as any).id, 'nurse')
      return reply.send({ success: true, data: { slncStatus: result } })
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message })
    }
  })

  // POST /api/nurses/:id/reviews
  app.post('/:id/reviews', async (req, reply) => {
    try {
      const userId = req.headers['x-user-id'] as string
      const { rating, comment } = req.body as any
      await addNurseReview((req.params as any).id, userId, rating, comment)
      return reply.status(201).send({ success: true })
    } catch (err: any) {
      return reply.status(400).send({ success: false, error: err.message })
    }
  })
}
