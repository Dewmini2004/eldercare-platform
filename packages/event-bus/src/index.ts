// All RabbitMQ event types used across services
// Import from '@eldercare/event-bus' in any service

export const EXCHANGES = {
  ELDER_CARE: 'eldercare.events'
} as const

export const QUEUES = {
  AUTH_EVENTS:         'auth.events',
  HOME_EVENTS:         'home.events',
  NURSE_EVENTS:        'nurse.events',
  BOOKING_EVENTS:      'booking.events',
  ALERT_EVENTS:        'alert.events',
  PAYMENT_EVENTS:      'payment.events',
  NOTIFICATION_EMAIL:  'notification.email',
  NOTIFICATION_SMS:    'notification.sms',
  AI_ANALYZE_ALERT:    'ai.analyze.alert'
} as const

export const ROUTING_KEYS = {
  // Auth
  USER_REGISTERED:        'user.registered',
  USER_VERIFIED:          'user.verified',

  // Homes
  HOME_REGISTERED:        'home.registered',
  HOME_APPROVED:          'home.approved',
  HOME_BED_UPDATED:       'home.bed.updated',

  // Nurses
  NURSE_REGISTERED:       'nurse.registered',
  NURSE_SLNC_VERIFIED:    'nurse.slnc.verified',
  NURSE_SLNC_FAILED:      'nurse.slnc.failed',

  // Bookings
  BOOKING_CREATED:        'booking.created',
  BOOKING_CONFIRMED:      'booking.confirmed',
  BOOKING_CANCELLED:      'booking.cancelled',
  BOOKING_COMPLETED:      'booking.completed',

  // Payments
  PAYMENT_SUCCESS:        'payment.success',
  PAYMENT_FAILED:         'payment.failed',
  PAYMENT_REFUNDED:       'payment.refunded',

  // Alerts (most important for families)
  ALERT_CREATED:          'alert.created',
  ALERT_ANALYZED:         'alert.analyzed',
  ALERT_CRITICAL:         'alert.critical',
  ALERT_ACKNOWLEDGED:     'alert.acknowledged'
} as const

// ─── Event Payloads ───────────────────────────────────────────────────────────

export interface AlertCreatedEvent {
  alertId: string
  homeId: string
  elderId: string
  elderName: string
  familyUserIds: string[]    // Who to notify
  rawReport: string
  timestamp: string
}

export interface AlertAnalyzedEvent {
  alertId: string
  elderName: string
  familyUserIds: string[]
  summary: string
  severity: 'info' | 'attention' | 'urgent' | 'critical'
  suggestedActions: string[]
  requiresImmediateContact: boolean
}

export interface BookingCreatedEvent {
  bookingId: string
  familyUserId: string
  homeId?: string
  nurseId?: string
  elderName: string
  bookingType: string
  totalAmountLkr: number
  startDate: string
}

export interface PaymentSuccessEvent {
  paymentId: string
  bookingId: string
  amountLkr: number
  userId: string
}

export interface NurseSlncVerifiedEvent {
  nurseId: string
  userId: string
  result: 'verified' | 'not_verified' | 'not_registered'
  slncNumber: string
}
