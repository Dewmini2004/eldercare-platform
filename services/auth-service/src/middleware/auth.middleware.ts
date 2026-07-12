import type { FastifyRequest, FastifyReply } from 'fastify'
import { verifyAccessToken } from '../services/auth.service'

export async function authenticate(req: FastifyRequest, reply: FastifyReply) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return reply.status(401).send({ success: false, error: 'Missing token' })
  }
  try {
    const payload = verifyAccessToken(header.slice(7))
    ;(req as any).user = { id: payload.sub, role: payload.role }
  } catch {
    return reply.status(401).send({ success: false, error: 'Invalid token' })
  }
}

export function requireRole(...roles: string[]) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const user = (req as any).user
    if (!user || !roles.includes(user.role)) {
      return reply.status(403).send({ success: false, error: 'Forbidden' })
    }
  }
}
