import type { FastifyInstance } from 'fastify'
import { db } from '../db'
import { bookings } from '../db/schema/bookings.schema'
import { eq } from 'drizzle-orm'

export async function bookingRoutes(app: FastifyInstance) {
  app.post('/', async (request, reply) => {
    try {
      const body = request.body as any
      const familyUserId = (request.headers['x-user-id'] as string) || '00000000-0000-0000-0000-000000000001'
      const [booking] = await db.insert(bookings).values({
        bookingType: body.bookingType || 'residential',
        familyUserId,
        homeId: body.homeId,
        nurseId: body.nurseId,
        elderName: body.elderName,
        elderAge: body.elderAge,
        elderConditions: body.elderConditions || [],
        startDate: new Date(body.startDate),
        notes: body.notes,
        totalAmountLkr: body.totalAmountLkr || '0'
      }).returning()
      return reply.status(201).send({ success: true, data: booking })
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({ success: false, error: 'Failed to create booking' })
    }
  })

  app.get('/mine', async (request, reply) => {
    const familyUserId = (request.headers['x-user-id'] as string) || '00000000-0000-0000-0000-000000000001'
    const result = await db.select().from(bookings).where(eq(bookings.familyUserId, familyUserId))
    return reply.send({ success: true, data: result })
  })

  app.get('/home/:homeId', async (request, reply) => {
    const { homeId } = request.params as { homeId: string }
    const result = await db.select().from(bookings).where(eq(bookings.homeId, homeId))
    return reply.send({ success: true, data: result })
  })

  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id))
    if (!booking) return reply.status(404).send({ success: false, error: 'Not found' })
    return reply.send({ success: true, data: booking })
  })

  app.patch('/:id/confirm', async (request, reply) => {
    const { id } = request.params as { id: string }
    const [booking] = await db.update(bookings).set({ status: 'confirmed', updatedAt: new Date() }).where(eq(bookings.id, id)).returning()
    return reply.send({ success: true, data: booking })
  })

  app.patch('/:id/cancel', async (request, reply) => {
    const { id } = request.params as { id: string }
    const [booking] = await db.update(bookings).set({ status: 'cancelled', updatedAt: new Date() }).where(eq(bookings.id, id)).returning()
    return reply.send({ success: true, data: booking })
  })
}
