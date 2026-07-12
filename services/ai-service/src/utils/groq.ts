import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!
})

const MODEL = process.env.GROQ_MODEL || 'llama3-70b-8192'

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/**
 * Core function to call Groq API
 */
export async function callGroq(
  messages: GroqMessage[],
  options?: {
    temperature?: number
    maxTokens?: number
    responseFormat?: 'text' | 'json'
  }
): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages,
    temperature: options?.temperature ?? 0.3,
    max_tokens: options?.maxTokens ?? 1024,
    response_format: options?.responseFormat === 'json'
      ? { type: 'json_object' }
      : undefined
  })

  return completion.choices[0]?.message?.content ?? ''
}

/**
 * Call Groq and parse JSON response safely
 */
export async function callGroqJSON<T>(
  messages: GroqMessage[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<T> {
  const raw = await callGroq(messages, {
    ...options,
    responseFormat: 'json'
  })

  try {
    return JSON.parse(raw) as T
  } catch {
    // Fallback: try extracting JSON from markdown code blocks
    const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (match) return JSON.parse(match[1]) as T
    throw new Error(`Failed to parse Groq JSON response: ${raw}`)
  }
}
