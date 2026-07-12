import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { users, refreshTokens, emailVerifications } from '../db/schema/auth.schema'
import { randomUUID } from 'crypto'

const JWT_SECRET         = process.env.JWT_SECRET!
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!
const JWT_EXPIRES_IN     = process.env.JWT_EXPIRES_IN || '15m'
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d'

export interface RegisterDto {
  email: string
  password: string
  fullName: string
  phone?: string
  role?: 'family' | 'nurse' | 'home_admin'
}

export interface LoginDto {
  email: string
  password: string
}

function signAccess(userId: string, role: string) {
  return jwt.sign({ sub: userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions)
}

function signRefresh(userId: string) {
  return jwt.sign({ sub: userId }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions)
}

export async function register(dto: RegisterDto) {
  const existing = await db.select().from(users).where(eq(users.email, dto.email)).limit(1)
  if (existing.length > 0) throw new Error('Email already registered')

  const passwordHash = await bcrypt.hash(dto.password, 12)
  const [user] = await db.insert(users).values({
    email: dto.email,
    passwordHash,
    fullName: dto.fullName,
    phone: dto.phone,
    role: dto.role || 'family'
  }).returning()

  // Create email verification token
  const token = randomUUID()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
  await db.insert(emailVerifications).values({ userId: user.id, token, expiresAt })

  return { user, verificationToken: token }
}

export async function login(dto: LoginDto) {
  const [user] = await db.select().from(users).where(eq(users.email, dto.email)).limit(1)
  if (!user) throw new Error('Invalid credentials')
  if (!user.isActive) throw new Error('Account suspended')

  const valid = await bcrypt.compare(dto.password, user.passwordHash)
  if (!valid) throw new Error('Invalid credentials')

  const accessToken  = signAccess(user.id, user.role)
  const refreshToken = signRefresh(user.id)

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  await db.insert(refreshTokens).values({ userId: user.id, token: refreshToken, expiresAt })

  const { passwordHash: _, ...safeUser } = user
  return { user: safeUser, accessToken, refreshToken }
}

export async function refresh(token: string) {
  let payload: jwt.JwtPayload
  try {
    payload = jwt.verify(token, JWT_REFRESH_SECRET) as jwt.JwtPayload
  } catch {
    throw new Error('Invalid refresh token')
  }

  const [stored] = await db.select().from(refreshTokens).where(eq(refreshTokens.token, token)).limit(1)
  if (!stored || stored.expiresAt < new Date()) throw new Error('Refresh token expired')

  const [user] = await db.select().from(users).where(eq(users.id, payload.sub!)).limit(1)
  if (!user || !user.isActive) throw new Error('User not found')

  // Rotate token
  await db.delete(refreshTokens).where(eq(refreshTokens.token, token))
  const newRefresh = signRefresh(user.id)
  const newAccess  = signAccess(user.id, user.role)
  const expiresAt  = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  await db.insert(refreshTokens).values({ userId: user.id, token: newRefresh, expiresAt })

  return { accessToken: newAccess, refreshToken: newRefresh }
}

export async function verifyEmail(token: string) {
  const [record] = await db.select().from(emailVerifications).where(eq(emailVerifications.token, token)).limit(1)
  if (!record) throw new Error('Invalid token')
  if (record.expiresAt < new Date()) throw new Error('Token expired')
  if (record.usedAt) throw new Error('Token already used')

  await db.update(users).set({ isVerified: true, updatedAt: new Date() }).where(eq(users.id, record.userId))
  await db.update(emailVerifications).set({ usedAt: new Date() }).where(eq(emailVerifications.token, token))
  return { success: true }
}

export async function getMe(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!user) throw new Error('User not found')
  const { passwordHash: _, ...safeUser } = user
  return safeUser
}

export async function logout(token: string) {
  await db.delete(refreshTokens).where(eq(refreshTokens.token, token))
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as jwt.JwtPayload
}
