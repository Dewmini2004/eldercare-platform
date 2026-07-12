import type { FastifyInstance } from 'fastify'
import {
  searchHomes, getHomeById, createHome,
  updateHome, addReview, approveHome, updateBeds
} from '../services/homes.service'

export async function homeRoutes(app: FastifyInstance) {

  // GET /api/homes — search with filters
  app.get('/', async (req, reply) => {
    try {
      const query = req.query as any
      const result = await searchHomes({
        district:      query.district,
        province:      query.province,
        maxMonthlyFee: query.maxMonthlyFee ? Number(query.maxMonthlyFee) : undefined,
        minBeds:       query.minBeds ? Number(query.minBeds) : undefined,
        status:        query.status || 'active',
        latitude:      query.lat ? Number(query.lat) : undefined,
        longitude:     query.lng ? Number(query.lng) : undefined,
        radiusKm:      query.radiusKm ? Number(query.radiusKm) : undefined,
        page:          query.page ? Number(query.page) : 1,
        limit:         query.limit ? Number(query.limit) : 20
      })
      return reply.send({ success: true, ...result })
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message })
    }
  })

  // GET /api/homes/:id
  app.get('/:id', async (req, reply) => {
    try {
      const home = await getHomeById((req.params as any).id)
      return reply.send({ success: true, data: home })
    } catch (err: any) {
      return reply.status(404).send({ success: false, error: err.message })
    }
  })

  // POST /api/homes — register a new home (home_admin)
  app.post('/', async (req, reply) => {
    try {
      const userId = (req.headers['x-user-id'] as string) || 'unknown'
      const body = req.body as any
      const home = await createHome({ ...body, adminId: userId, status: 'pending' })
      return reply.status(201).send({ success: true, data: home })
    } catch (err: any) {
      return reply.status(400).send({ success: false, error: err.message })
    }
  })

  // PUT /api/homes/:id — update home (home_admin)
  app.put('/:id', async (req, reply) => {
    try {
      const userId = req.headers['x-user-id'] as string
      const home = await updateHome((req.params as any).id, userId, req.body as any)
      return reply.send({ success: true, data: home })
    } catch (err: any) {
      return reply.status(400).send({ success: false, error: err.message })
    }
  })

  // PATCH /api/homes/:id/beds — update available beds
  app.patch('/:id/beds', async (req, reply) => {
    try {
      const { availableBeds } = req.body as any
      await updateBeds((req.params as any).id, availableBeds)
      return reply.send({ success: true })
    } catch (err: any) {
      return reply.status(400).send({ success: false, error: err.message })
    }
  })

  // POST /api/homes/:id/reviews — submit a review
  app.post('/:id/reviews', async (req, reply) => {
    try {
      const userId = req.headers['x-user-id'] as string
      const { rating, comment } = req.body as any
      await addReview((req.params as any).id, userId, rating, comment)
      return reply.status(201).send({ success: true })
    } catch (err: any) {
      return reply.status(400).send({ success: false, error: err.message })
    }
  })

  // PATCH /api/homes/:id/approve — admin approves a home
  app.patch('/:id/approve', async (req, reply) => {
    try {
      await approveHome((req.params as any).id)
      return reply.send({ success: true, message: 'Home approved' })
    } catch (err: any) {
      return reply.status(400).send({ success: false, error: err.message })
    }
  })
}
