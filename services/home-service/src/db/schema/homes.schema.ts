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

// ─── Enums ───────────────────────────────────────────────────────────────────

export const homeTypeEnum = pgEnum('home_type', [
  'government', 'private', 'ngo', 'religious'
])

export const homeStatusEnum = pgEnum('home_status', [
  'pending', 'active', 'suspended', 'rejected'
])

// ─── Tables ──────────────────────────────────────────────────────────────────

export const elderHomes = pgTable('elder_homes', {
  id:                  uuid('id').primaryKey().defaultRandom(),
  name:                text('name').notNull(),
  registrationNumber:  text('registration_number').notNull().unique(),
  type:                homeTypeEnum('type').notNull().default('private'),
  status:              homeStatusEnum('status').notNull().default('pending'),
  description:         text('description'),
  adminId:             uuid('admin_id').notNull(),   // FK to auth-service

  // Location
  address:             text('address').notNull(),
  city:                text('city').notNull(),
  district:            text('district').notNull(),
  province:            text('province').notNull(),
  latitude:            real('latitude').notNull(),
  longitude:           real('longitude').notNull(),
  googlePlaceId:       text('google_place_id'),

  // Capacity & Pricing
  totalCapacity:       integer('total_capacity').notNull().default(0),
  availableBeds:       integer('available_beds').notNull().default(0),
  monthlyFeeMin:       decimal('monthly_fee_min', { precision: 10, scale: 2 }).notNull(),
  monthlyFeeMax:       decimal('monthly_fee_max', { precision: 10, scale: 2 }).notNull(),

  // Facilities & Language (stored as JSON arrays)
  facilities:          jsonb('facilities').$type<string[]>().default([]),
  languages:           jsonb('languages').$type<string[]>().default([]),
  acceptsInsurance:    boolean('accepts_insurance').default(false),

  // Media
  photos:              jsonb('photos').$type<string[]>().default([]),
  coverPhoto:          text('cover_photo'),

  // Ratings (denormalized for performance)
  averageRating:       real('average_rating').default(0),
  totalReviews:        integer('total_reviews').default(0),

  // Contact
  phone:               text('phone').notNull(),
  email:               text('email'),
  website:             text('website'),

  // Verification
  isNseVerified:       boolean('is_nse_verified').default(false),
  nseRegistrationDate: timestamp('nse_registration_date'),

  createdAt:           timestamp('created_at').defaultNow().notNull(),
  updatedAt:           timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  districtIdx:   index('homes_district_idx').on(table.district),
  provinceIdx:   index('homes_province_idx').on(table.province),
  statusIdx:     index('homes_status_idx').on(table.status),
  locationIdx:   index('homes_location_idx').on(table.latitude, table.longitude),
  adminIdx:      index('homes_admin_idx').on(table.adminId)
}))

export const homeReviews = pgTable('home_reviews', {
  id:         uuid('id').primaryKey().defaultRandom(),
  homeId:     uuid('home_id').notNull().references(() => elderHomes.id, { onDelete: 'cascade' }),
  userId:     uuid('user_id').notNull(),
  rating:     integer('rating').notNull(),   // 1-5
  comment:    text('comment'),
  createdAt:  timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  homeIdx: index('reviews_home_idx').on(table.homeId)
}))

export const homeAmenities = pgTable('home_amenities', {
  id:       uuid('id').primaryKey().defaultRandom(),
  homeId:   uuid('home_id').notNull().references(() => elderHomes.id, { onDelete: 'cascade' }),
  category: text('category').notNull(),  // e.g. 'medical', 'recreational', 'safety'
  name:     text('name').notNull(),
  icon:     text('icon')
})

// ─── Types ───────────────────────────────────────────────────────────────────
export type ElderHomeRow    = typeof elderHomes.$inferSelect
export type NewElderHomeRow = typeof elderHomes.$inferInsert
export type HomeReviewRow   = typeof homeReviews.$inferSelect
