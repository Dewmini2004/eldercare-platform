import { callGroq } from '../utils/groq'
import type { GroqMessage } from '../utils/groq'
import { getRedisClient } from '../utils/redis'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const SYSTEM_PROMPT = `You are ElderCare Assistant, a helpful and compassionate AI for the ElderCare Sri Lanka platform.
You help families find the right elder care homes and nurses across Sri Lanka.

You have knowledge about:
- Elder care homes registered in Sri Lanka (government, private, NGO, religious)
- Hiring SLNC-verified nurses for elder care
- How to register an elder in a care home
- Emergency procedures and alert systems
- Payment options including PayHere (Sri Lanka's payment gateway)
- Districts and provinces in Sri Lanka

Guidelines:
- Always be warm and empathetic — families are often stressed
- Answer in English but acknowledge Sinhala/Tamil speakers warmly
- Be specific about Sri Lanka — don't give generic global advice
- If you don't know something specific, say so and suggest who to contact
- For medical emergencies, always advise calling 1990 (Suwa Seriya ambulance) immediately
- Keep responses concise — families are often on mobile devices

Never make up specific home names, prices, or contact details you aren't certain about.`

/**
 * Multi-turn chatbot with Redis session memory
 */
export async function processChatMessage(
  sessionId: string,
  userMessage: string,
  contextData?: {
    nearbyHomes?: Array<{ name: string; district: string; phone: string }>
  }
): Promise<string> {
  const redis = getRedisClient()
  const historyKey = `chat:${sessionId}`

  // Load conversation history from Redis
  let history: ChatMessage[] = []
  const stored = await redis.get(historyKey)
  if (stored) {
    history = JSON.parse(stored)
  }

  // Build context injection if we have location data
  let contextNote = ''
  if (contextData?.nearbyHomes?.length) {
    contextNote = `\n\n[Context: User's nearby elder homes: ${
      contextData.nearbyHomes
        .map((h) => `${h.name} (${h.district}, ${h.phone})`)
        .join('; ')
    }]`
  }

  // Build messages array for Groq
  const messages: GroqMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage + contextNote }
  ]

  const response = await callGroq(messages, {
    temperature: 0.5,
    maxTokens: 512
  })

  // Update history (keep last 10 turns to manage context window)
  history.push(
    { role: 'user', content: userMessage },
    { role: 'assistant', content: response }
  )
  if (history.length > 20) history = history.slice(-20)

  // Store back to Redis with 1-hour expiry
  await redis.set(historyKey, JSON.stringify(history), { EX: 3600 })

  return response
}

/**
 * Clear chat session
 */
export async function clearChatSession(sessionId: string): Promise<void> {
  const redis = getRedisClient()
  await redis.del(`chat:${sessionId}`)
}
