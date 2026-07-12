import { eq, and, gte, lte, sql, ilike } from 'drizzle-orm'
import { db } from '../db'
import { elderHomes, homeReviews } from '../db/schema/homes.schema'
import type { NewElderHomeRow } from '../db/schema/homes.schema'

export interface HomeSearchQuery {
  district?: string
  province?: string
  maxMonthlyFee?: number
  minBeds?: number
  status?: string
  latitude?: number
  longitude?: number
  radiusKm?: number
  page?: number
  limit?: number
}

export async function searchHomes(query: HomeSearchQuery) {
  const page  = query.page  || 1
  const limit = query.limit || 20
  const offset = (page - 1) * limit

  const conditions = [eq(elderHomes.status, (query.status as any) || 'active')]

  if (query.district)      conditions.push(ilike(elderHomes.district, `%${query.district}%`))
  if (query.province)      conditions.push(ilike(elderHomes.province, `%${query.province}%`))
  if (query.maxMonthlyFee) conditions.push(lte(elderHomes.monthlyFeeMin, String(query.maxMonthlyFee)))
  if (query.minBeds)       conditions.push(gte(elderHomes.availableBeds, query.minBeds))

  let homes = await db
    .select()
    .from(elderHomes)
    .where(and(...conditions))
    .limit(limit)
    .offset(offset)

  // Location-based radius filter using Haversine if lat/lng provided
  if (query.latitude && query.longitude && query.radiusKm) {
    homes = homes.filter((h) => {
      const dist = haversineKm(query.latitude!, query.longitude!, h.latitude, h.longitude)
      return dist <= query.radiusKm!
    })
  }

  return { data: homes, page, limit }
}

export async function getHomeById(id: string) {
  const [home] = await db.select().from(elderHomes).where(eq(elderHomes.id, id)).limit(1)
  if (!home) throw new Error('Home not found')
  return home
}

export async function createHome(data: NewElderHomeRow) {
  const [home] = await db.insert(elderHomes).values(data).returning()
  return home
}

export async function updateHome(id: string, adminId: string, data: Partial<NewElderHomeRow>) {
  const [home] = await db
    .update(elderHomes)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(elderHomes.id, id), eq(elderHomes.adminId, adminId)))
    .returning()
  if (!home) throw new Error('Home not found or unauthorized')
  return home
}

export async function updateBeds(id: string, availableBeds: number) {
  await db.update(elderHomes).set({ availableBeds, updatedAt: new Date() }).where(eq(elderHomes.id, id))
}

export async function addReview(homeId: string, userId: string, rating: number, comment?: string) {
  await db.insert(homeReviews).values({ homeId, userId, rating, comment })

  // Recalculate average rating
  const result = await db
    .select({ avg: sql<number>`AVG(rating)`, count: sql<number>`COUNT(*)` })
    .from(homeReviews)
    .where(eq(homeReviews.homeId, homeId))

  await db.update(elderHomes).set({
    averageRating: Number(result[0].avg.toFixed(1)),
    totalReviews: Number(result[0].count),
    updatedAt: new Date()
  }).where(eq(elderHomes.id, homeId))
}

export async function approveHome(id: string) {
  await db.update(elderHomes).set({ status: 'active', updatedAt: new Date() }).where(eq(elderHomes.id, id))
}

// Haversine distance in km
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toRad(deg: number) { return deg * (Math.PI / 180) }
