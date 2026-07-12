import type { FastifyInstance } from 'fastify'
import { matchHomesForElder } from '../services/home-matching.service'
import { matchNursesForElder } from '../services/nurse-matching.service'
import type { HomeMatchingRequest, NurseMatchingRequest } from '@eldercare/shared-types'

export async function matchingRoutes(app: FastifyInstance) {
  /**
   * POST /api/ai/match/homes
   * AI-powered elder home recommendation
   */
  app.post<{ Body: HomeMatchingRequest }>('/homes', {
    schema: {
      body: {
        type: 'object',
        required: ['elderAge', 'budgetMinLkr', 'budgetMaxLkr'],
        properties: {
          elderAge:              { type: 'number', minimum: 50, maximum: 120 },
          conditions:            { type: 'array', items: { type: 'string' } },
          preferredLanguages:    { type: 'array', items: { type: 'string' } },
          budgetMinLkr:          { type: 'number', minimum: 0 },
          budgetMaxLkr:          { type: 'number', minimum: 1000 },
          preferredDistrict:     { type: 'string' },
          preferredProvince:     { type: 'string' },
          specialRequirements:   { type: 'string' },
          familyVisitFrequency:  { type: 'string', enum: ['daily', 'weekly', 'monthly', 'rarely'] }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const matches = await matchHomesForElder(request.body)
      return reply.send({
        success: true,
        data: matches,
        total: matches.length
      })
    } catch (err) {
      app.log.error(err, 'Home matching failed')
      return reply.status(500).send({
        success: false,
        error: 'AI matching service temporarily unavailable'
      })
    }
  })

  /**
   * POST /api/ai/match/nurses
   * AI-powered nurse recommendation
   */
  app.post<{ Body: NurseMatchingRequest }>('/nurses', {
    schema: {
      body: {
        type: 'object',
        required: ['elderConditions', 'budgetLkr', 'district', 'hiringType', 'startDate'],
        properties: {
          requiredSpecializations: { type: 'array', items: { type: 'string' } },
          elderConditions:         { type: 'array', items: { type: 'string' } },
          preferredLanguages:      { type: 'array', items: { type: 'string' } },
          budgetLkr:               { type: 'number', minimum: 0 },
          district:                { type: 'string' },
          hiringType:              { type: 'string', enum: ['home_visit', 'residential'] },
          startDate:               { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const matches = await matchNursesForElder(request.body)
      return reply.send({
        success: true,
        data: matches,
        total: matches.length
      })
    } catch (err) {
      app.log.error(err, 'Nurse matching failed')
      return reply.status(500).send({
        success: false,
        error: 'AI matching service temporarily unavailable'
      })
    }
  })
}
