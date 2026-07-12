import type { FastifyInstance } from 'fastify'
import { analyzeIncidentReport } from '../services/alert-analyzer.service'

export async function alertRoutes(app: FastifyInstance) {
  /**
   * POST /api/ai/alerts/analyze
   * Analyze a staff incident report and return family-friendly summary
   */
  app.post<{
    Body: {
      rawReport: string
      elderName: string
      elderAge: number
      elderConditions: string[]
    }
  }>('/analyze', {
    schema: {
      body: {
        type: 'object',
        required: ['rawReport', 'elderName', 'elderAge'],
        properties: {
          rawReport:       { type: 'string', minLength: 10 },
          elderName:       { type: 'string' },
          elderAge:        { type: 'number' },
          elderConditions: { type: 'array', items: { type: 'string' } }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { rawReport, elderName, elderAge, elderConditions } = request.body

      const analysis = await analyzeIncidentReport(
        rawReport,
        elderName,
        elderAge,
        elderConditions || []
      )

      return reply.send({
        success: true,
        data: analysis
      })
    } catch (err) {
      app.log.error(err, 'Alert analysis failed')
      return reply.status(500).send({
        success: false,
        error: 'Failed to analyze incident report'
      })
    }
  })
}
