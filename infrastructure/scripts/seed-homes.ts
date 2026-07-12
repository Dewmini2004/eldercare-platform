/**
 * Seed script — adds sample Sri Lankan elder homes to the database
 * Run: npx tsx infrastructure/scripts/seed-homes.ts
 */
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/eldercare_homes' })

const sampleHomes = [
  { name: 'Sewa Elders Home', district: 'Colombo', city: 'Colombo 07', province: 'Western', address: '45 Bullers Lane, Colombo 07', phone: '0112345678', latitude: 6.9022, longitude: 79.8658, monthlyFeeMin: 70000, monthlyFeeMax: 100000, totalCapacity: 40, availableBeds: 8, type: 'private', registrationNumber: 'SEWA-2019-001' },
  { name: 'Sahana Udaya Elders Retreat', district: 'Colombo', city: 'Dehiwala', province: 'Western', address: '12 Station Road, Dehiwala', phone: '0112871234', latitude: 6.8489, longitude: 79.8712, monthlyFeeMin: 55000, monthlyFeeMax: 85000, totalCapacity: 30, availableBeds: 5, type: 'ngo', registrationNumber: 'SAHANA-2018-002' },
  { name: 'Kandy Elder Care Centre', district: 'Kandy', city: 'Kandy', province: 'Central', address: '78 Peradeniya Road, Kandy', phone: '0812345678', latitude: 7.2906, longitude: 80.6337, monthlyFeeMin: 45000, monthlyFeeMax: 75000, totalCapacity: 25, availableBeds: 3, type: 'government', registrationNumber: 'KECC-2017-003' }
]

async function seed() {
  for (const home of sampleHomes) {
    await pool.query(`
      INSERT INTO elder_homes (name, district, city, province, address, phone, latitude, longitude,
        monthly_fee_min, monthly_fee_max, total_capacity, available_beds, type, status,
        registration_number, admin_id, is_nse_verified)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'active',$14,
        '00000000-0000-0000-0000-000000000001', true)
      ON CONFLICT (registration_number) DO NOTHING
    `, [home.name, home.district, home.city, home.province, home.address, home.phone,
        home.latitude, home.longitude, home.monthlyFeeMin, home.monthlyFeeMax,
        home.totalCapacity, home.availableBeds, home.type, home.registrationNumber])
    console.log(`✅ Seeded: ${home.name}`)
  }
  await pool.end()
  console.log('🌱 Seeding complete')
}

seed().catch(console.error)
