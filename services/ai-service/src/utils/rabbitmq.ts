import amqplib, { type Channel, type Connection } from 'amqplib'

let connection: Connection | null = null
let channel: Channel | null = null

export async function connectRabbitMQ() {
  connection = await amqplib.connect(
    process.env.RABBITMQ_URL || 'amqp://eldercare:eldercare123@localhost:5672'
  )
  channel = await connection.createChannel()
  await channel.assertExchange('eldercare.events', 'topic', { durable: true })
  console.log('✅ RabbitMQ connected')
}

export function getChannel(): Channel {
  if (!channel) throw new Error('RabbitMQ channel not ready')
  return channel
}

export async function publishEvent(routingKey: string, payload: unknown) {
  const ch = getChannel()
  ch.publish(
    'eldercare.events',
    routingKey,
    Buffer.from(JSON.stringify(payload)),
    { persistent: true }
  )
}

export async function subscribeEvent(
  queue: string,
  routingKey: string,
  handler: (payload: unknown) => Promise<void>
) {
  const ch = getChannel()
  await ch.assertQueue(queue, { durable: true })
  await ch.bindQueue(queue, 'eldercare.events', routingKey)
  ch.consume(queue, async (msg) => {
    if (!msg) return
    try {
      const payload = JSON.parse(msg.content.toString())
      await handler(payload)
      ch.ack(msg)
    } catch (err) {
      console.error(`Error processing ${routingKey}:`, err)
      ch.nack(msg, false, false)
    }
  })
}
