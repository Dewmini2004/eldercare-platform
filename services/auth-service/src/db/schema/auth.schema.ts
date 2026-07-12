import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  pgEnum,
  index
} from 'drizzle-orm/pg-core'

export const userRoleEnum = pgEnum('user_role', [
  'family', 'elder', 'nurse', 'home_admin', 'admin'
])

export const users = pgTable('users', {
  id:           uuid('id').primaryKey().defaultRandom(),
  email:        text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  fullName:     text('full_name').notNull(),
  phone:        text('phone'),
  role:         userRoleEnum('role').notNull().default('family'),
  isVerified:   boolean('is_verified').default(false),
  isActive:     boolean('is_active').default(true),
  createdAt:    timestamp('created_at').defaultNow().notNull(),
  updatedAt:    timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
  roleIdx:  index('users_role_idx').on(table.role)
}))

export const refreshTokens = pgTable('refresh_tokens', {
  id:        uuid('id').primaryKey().defaultRandom(),
  userId:    uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token:     text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  tokenIdx:  index('refresh_tokens_token_idx').on(table.token),
  userIdx:   index('refresh_tokens_user_idx').on(table.userId)
}))

export const emailVerifications = pgTable('email_verifications', {
  id:        uuid('id').primaryKey().defaultRandom(),
  userId:    uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token:     text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt:    timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

export type UserRow    = typeof users.$inferSelect
export type NewUserRow = typeof users.$inferInsert
