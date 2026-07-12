// ─── User & Auth ─────────────────────────────────────────────────────────────

export type UserRole = 'family' | 'elder' | 'nurse' | 'home_admin' | 'admin'

export interface User {
  id: string
  email: string
  fullName: string
  phone?: string
  role: UserRole
  isVerified: boolean
  createdAt: Date
  updatedAt: Date
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

// ─── Elder Home ──────────────────────────────────────────────────────────────

export type HomeType = 'government' | 'private' | 'ngo' | 'religious'
export type HomeStatus = 'pending' | 'active' | 'suspended' | 'rejected'

export interface ElderHome {
  id: string
  name: string
  registrationNumber: string
  type: HomeType
  status: HomeStatus
  description: string
  adminId: string

  // Location
  address: string
  city: string
  district: string
  province: string
  latitude: number
  longitude: number
  googlePlaceId?: string

  // Capacity & Pricing
  totalCapacity: number
  availableBeds: number
  monthlyFeeMin: number   // LKR
  monthlyFeeMax: number   // LKR

  // Facilities
  facilities: string[]    // e.g. ['physiotherapy', 'dementia_care', 'doctor_visits']
  languages: string[]     // e.g. ['sinhala', 'tamil', 'english']
  acceptsInsurance: boolean

  // Media
  photos: string[]
  coverPhoto?: string

  // Ratings
  averageRating: number
  totalReviews: number

  // Contact
  phone: string
  email?: string
  website?: string

  isNseVerified: boolean
  nseRegistrationDate?: Date

  createdAt: Date
  updatedAt: Date
}

export interface HomeSearchFilters {
  latitude?: number
  longitude?: number
  radiusKm?: number
  district?: string
  province?: string
  homeType?: HomeType
  maxMonthlyFee?: number
  minBeds?: number
  facilities?: string[]
  languages?: string[]
  acceptsInsurance?: boolean
}

// ─── Nurse ───────────────────────────────────────────────────────────────────

export type NurseStatus = 'pending' | 'slnc_verified' | 'active' | 'suspended'
export type NurseSpecialization =
  | 'general'
  | 'dementia'
  | 'physiotherapy'
  | 'palliative'
  | 'post_surgery'
  | 'psychiatric'
  | 'pediatric_geriatric'

export interface Nurse {
  id: string
  userId: string
  fullName: string
  phone: string
  email: string

  // Certification
  slncRegistrationNumber: string
  slncStatus: 'verified' | 'not_verified' | 'not_registered' | 'pending'
  slncLastChecked?: Date
  certificateUrl?: string

  // Professional
  specializations: NurseSpecialization[]
  yearsOfExperience: number
  languages: string[]
  bio?: string

  // Location & Availability
  district: string
  province: string
  availableForHomeVisits: boolean
  availableForResidential: boolean
  hourlyRate?: number   // LKR
  monthlyRate?: number  // LKR

  // Ratings
  averageRating: number
  totalReviews: number

  status: NurseStatus
  profilePhoto?: string

  createdAt: Date
  updatedAt: Date
}

// ─── Booking ─────────────────────────────────────────────────────────────────

export type BookingType = 'residential' | 'home_visit' | 'nurse_hire'
export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'refunded'

export interface Booking {
  id: string
  bookingType: BookingType
  status: BookingStatus
  familyUserId: string

  // Either home or nurse
  homeId?: string
  nurseId?: string

  elderName: string
  elderAge: number
  elderConditions: string[]

  startDate: Date
  endDate?: Date

  totalAmountLkr: number
  paymentStatus: 'pending' | 'paid' | 'refunded'
  paymentId?: string

  notes?: string
  createdAt: Date
  updatedAt: Date
}

// ─── Alert ───────────────────────────────────────────────────────────────────

export type AlertSeverity = 'info' | 'attention' | 'urgent' | 'critical'

export interface Alert {
  id: string
  homeId: string
  elderId: string
  elderName: string
  reportedBy: string

  rawIncident: string              // Staff's original report
  aiSummary: string                // AI-simplified summary for family
  aiSeverity: AlertSeverity        // AI-assessed urgency
  aiSuggestedActions: string[]     // AI recommendations

  notifiedFamilyAt?: Date
  acknowledgedAt?: Date
  resolvedAt?: Date

  createdAt: Date
}

// ─── AI Matching ─────────────────────────────────────────────────────────────

export interface HomeMatchingRequest {
  elderAge: number
  conditions: string[]
  preferredLanguages: string[]
  budgetMinLkr: number
  budgetMaxLkr: number
  preferredDistrict?: string
  preferredProvince?: string
  specialRequirements?: string
  familyVisitFrequency?: 'daily' | 'weekly' | 'monthly' | 'rarely'
}

export interface HomeMatchResult {
  home: ElderHome
  matchScore: number        // 0-100
  matchReasons: string[]
  concerns: string[]
  aiExplanation: string
}

export interface NurseMatchingRequest {
  requiredSpecializations: NurseSpecialization[]
  elderConditions: string[]
  preferredLanguages: string[]
  budgetLkr: number
  district: string
  hiringType: 'home_visit' | 'residential'
  startDate: string
}

export interface NurseMatchResult {
  nurse: Nurse
  matchScore: number
  matchReasons: string[]
  aiExplanation: string
}

// ─── API Responses ───────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface PaginationQuery {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
