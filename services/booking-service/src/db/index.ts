import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema/bookings.schema'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
export const db = drizzle(pool, { schema })

pool.connect()
  .then(() => console.log('Booking DB connected'))
  .catch(err => { console.error('Booking DB failed:', err); process.exit(1) })
