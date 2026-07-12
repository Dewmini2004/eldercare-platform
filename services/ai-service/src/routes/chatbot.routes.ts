import type { FastifyInstance } from 'fastify'
import { processChatMessage, clearChatSession } from '../services/chatbot.service'
import { randomUUID } from 'crypto'

export async function chatbotRoutes(app: FastifyInstance) {
  /**
   * POST /api/ai/chat/message
   * Send a message to the ElderCare AI assistant
   */
  app.post<{
    Body: {
      sessionId?: string
      message: string
      context?: {
        nearbyHomes?: Array<{ name: string; district: string; phone: string }>
      }
    }
  }>('/message', {
    schema: {
      body: {
        type: 'object',
        required: ['message'],
        properties: {
          sessionId: { type: 'string' },
          message:   { type: 'string', minLength: 1, maxLength: 1000 },
          context:   { type: 'object' }
        }
      }
    }
  }, async (request, reply) => {
    const sessionId = request.body.sessionId || randomUUID()

    try {
      const response = await processChatMessage(
        sessionId,
        request.body.message,
        request.body.context
      )

      return reply.send({
        success: true,
        data: {
          sessionId,
          message: response,
          timestamp: new Date().toISOString()
        }
      })
    } catch (err) {
      app.log.error(err, 'Chatbot failed')
      return reply.status(500).send({
        success: false,
        error: 'Assistant temporarily unavailable. Please try again.'
      })
    }
  })

  /**
   * DELETE /api/ai/chat/:sessionId
   * Clear a chat session
   */
  app.delete<{ Params: { sessionId: string } }>(
    '/:sessionId',
    async (request, reply) => {
      await clearChatSession(request.params.sessionId)
      return reply.send({ success: true })
    }
  )
}
