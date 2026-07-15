import { pgTable, uuid, text, integer, decimal, timestamp, pgEnum, jsonb, index } from 'drizzle-orm/pg-core'

export const bookingTypeEnum = pgEnum('booking_type', ['residential', 'home_visit', 'nurse_hire'])
export const bookingStatusEnum = pgEnum('booking_status', ['pending', 'confirmed', 'active', 'completed', 'cancelled'])
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid', 'refunded'])

export const bookings = pgTable('bookings', {
  id:              uuid('id').primaryKey().defaultRandom(),
  bookingType:     bookingTypeEnum('booking_type').notNull().default('residential'),
  status:          bookingStatusEnum('status').notNull().default('pending'),
  familyUserId:    uuid('family_user_id').notNull(),
  homeId:          uuid('home_id'),
  nurseId:         uuid('nurse_id'),
  elderName:       text('elder_name').notNull(),
  elderAge:        integer('elder_age').notNull(),
  elderConditions: jsonb('elder_conditions').default([]),
  startDate:       timestamp('start_date').notNull(),
  endDate:         timestamp('end_date'),
  totalAmountLkr:  decimal('total_amount_lkr', { precision: 10, scale: 2 }).default('0'),
  paymentStatus:   paymentStatusEnum('payment_status').notNull().default('pending'),
  paymentId:       text('payment_id'),
  notes:           text('notes'),
  createdAt:       timestamp('created_at').defaultNow().notNull(),
  updatedAt:       timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  familyIdx: index('bookings_family_idx').on(table.familyUserId),
  homeIdx:   index('bookings_home_idx').on(table.homeId),
  statusIdx: index('bookings_status_idx').on(table.status)
}))
