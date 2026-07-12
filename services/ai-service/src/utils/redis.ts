import { createClient } from 'redis'

let client: ReturnType<typeof createClient> | null = null

export async function connectRedis() {
  client = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' })
  client.on('error', (err) => console.error('Redis error:', err))
  await client.connect()
  console.log('✅ Redis connected')
}

export function getRedisClient() {
  if (!client) throw new Error('Redis not connected')
  return client
}
