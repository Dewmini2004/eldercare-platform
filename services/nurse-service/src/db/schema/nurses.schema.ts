import {
  pgTable,
  uuid,
  text,
  integer,
  decimal,
  boolean,
  timestamp,
  pgEnum,
  jsonb,
  index,
  real
} from 'drizzle-orm/pg-core'

export const nurseStatusEnum = pgEnum('nurse_status', [
  'pending', 'slnc_verified', 'active', 'suspended'
])

export const slncStatusEnum = pgEnum('slnc_status', [
  'pending', 'verified', 'not_verified', 'not_registered'
])

export const nurses = pgTable('nurses', {
  id:                      uuid('id').primaryKey().defaultRandom(),
  userId:                  uuid('user_id').notNull().unique(), // FK to auth-service
  fullName:                text('full_name').notNull(),
  phone:                   text('phone').notNull(),
  email:                   text('email').notNull(),

  // SLNC Certification
  slncRegistrationNumber:  text('slnc_registration_number').notNull().unique(),
  slncStatus:              slncStatusEnum('slnc_status').notNull().default('pending'),
  slncLastChecked:         timestamp('slnc_last_checked'),
  certificateUrl:          text('certificate_url'),

  // Professional Info
  specializations:         jsonb('specializations').$type<string[]>().default([]),
  yearsOfExperience:       integer('years_of_experience').notNull().default(0),
  languages:               jsonb('languages').$type<string[]>().default([]),
  bio:                     text('bio'),

  // Location & Availability
  district:                text('district').notNull(),
  province:                text('province').notNull(),
  availableForHomeVisits:  boolean('available_for_home_visits').default(true),
  availableForResidential: boolean('available_for_residential').default(false),
  hourlyRate:              decimal('hourly_rate', { precision: 10, scale: 2 }),
  monthlyRate:             decimal('monthly_rate', { precision: 10, scale: 2 }),

  // Ratings
  averageRating:           real('average_rating').default(0),
  totalReviews:            integer('total_reviews').default(0),

  status:                  nurseStatusEnum('status').notNull().default('pending'),
  profilePhoto:            text('profile_photo'),

  createdAt:               timestamp('created_at').defaultNow().notNull(),
  updatedAt:               timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  districtIdx:  index('nurses_district_idx').on(table.district),
  statusIdx:    index('nurses_status_idx').on(table.status),
  slncIdx:      index('nurses_slnc_idx').on(table.slncStatus),
  userIdx:      index('nurses_user_idx').on(table.userId)
}))

export const nurseReviews = pgTable('nurse_reviews', {
  id:        uuid('id').primaryKey().defaultRandom(),
  nurseId:   uuid('nurse_id').notNull().references(() => nurses.id, { onDelete: 'cascade' }),
  userId:    uuid('user_id').notNull(),
  rating:    integer('rating').notNull(),
  comment:   text('comment'),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  nurseIdx: index('nurse_reviews_nurse_idx').on(table.nurseId)
}))

export const slncVerificationLog = pgTable('slnc_verification_log', {
  id:           uuid('id').primaryKey().defaultRandom(),
  nurseId:      uuid('nurse_id').notNull().references(() => nurses.id),
  checkedAt:    timestamp('checked_at').defaultNow().notNull(),
  result:       slncStatusEnum('result').notNull(),
  responseRaw:  text('response_raw'),
  triggeredBy:  text('triggered_by').notNull().default('system')  // 'system' | 'admin' | 'nurse'
})

export type NurseRow    = typeof nurses.$inferSelect
export type NewNurseRow = typeof nurses.$inferInsert
