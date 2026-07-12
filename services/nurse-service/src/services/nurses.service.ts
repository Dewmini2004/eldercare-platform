import { eq, and, ilike, sql } from 'drizzle-orm'
import { db } from '../db'
import { nurses, nurseReviews } from '../db/schema/nurses.schema'
import type { NewNurseRow } from '../db/schema/nurses.schema'

export interface NurseSearchQuery {
  district?: string
  province?: string
  slncStatus?: string
  availableFor?: 'home_visits' | 'residential'
  specialization?: string
  maxHourlyRate?: number
  maxMonthlyRate?: number
  page?: number
  limit?: number
}

export async function searchNurses(query: NurseSearchQuery) {
  const page   = query.page  || 1
  const limit  = query.limit || 20
  const offset = (page - 1) * limit

  const conditions: any[] = [eq(nurses.status, 'active')]

  if (query.district)    conditions.push(ilike(nurses.district, `%${query.district}%`))
  if (query.province)    conditions.push(ilike(nurses.province, `%${query.province}%`))
  if (query.slncStatus)  conditions.push(eq(nurses.slncStatus, query.slncStatus as any))
  if (query.availableFor === 'home_visits')  conditions.push(eq(nurses.availableForHomeVisits, true))
  if (query.availableFor === 'residential')  conditions.push(eq(nurses.availableForResidential, true))

  const data = await db
    .select()
    .from(nurses)
    .where(and(...conditions))
    .limit(limit)
    .offset(offset)

  return { data, page, limit }
}

export async function getNurseById(id: string) {
  const [nurse] = await db.select().from(nurses).where(eq(nurses.id, id)).limit(1)
  if (!nurse) throw new Error('Nurse not found')
  return nurse
}

export async function getNurseByUserId(userId: string) {
  const [nurse] = await db.select().from(nurses).where(eq(nurses.userId, userId)).limit(1)
  if (!nurse) throw new Error('Nurse profile not found')
  return nurse
}

export async function createNurseProfile(data: NewNurseRow) {
  const [nurse] = await db.insert(nurses).values(data).returning()
  return nurse
}

export async function updateNurseProfile(id: string, userId: string, data: Partial<NewNurseRow>) {
  const [nurse] = await db
    .update(nurses)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(nurses.id, id), eq(nurses.userId, userId)))
    .returning()
  if (!nurse) throw new Error('Nurse profile not found or unauthorized')
  return nurse
}

export async function addNurseReview(nurseId: string, userId: string, rating: number, comment?: string) {
  await db.insert(nurseReviews).values({ nurseId, userId, rating, comment })

  const result = await db
    .select({ avg: sql<number>`AVG(rating)`, count: sql<number>`COUNT(*)` })
    .from(nurseReviews)
    .where(eq(nurseReviews.nurseId, nurseId))

  await db.update(nurses).set({
    averageRating: Number(result[0].avg.toFixed(1)),
    totalReviews: Number(result[0].count),
    updatedAt: new Date()
  }).where(eq(nurses.id, nurseId))
}

export async function setNurseActive(id: string) {
  await db.update(nurses).set({ status: 'active', updatedAt: new Date() }).where(eq(nurses.id, id))
}
