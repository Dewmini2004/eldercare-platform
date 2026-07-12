import axios from 'axios'

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3001'
const HOME_URL = process.env.NEXT_PUBLIC_HOME_URL || 'http://localhost:3002'
const NURSE_URL = process.env.NEXT_PUBLIC_NURSE_URL || 'http://localhost:3003'
const BOOKING_URL = process.env.NEXT_PUBLIC_BOOKING_URL || 'http://localhost:3004'
const ALERT_URL = process.env.NEXT_PUBLIC_ALERT_URL || 'http://localhost:3005'
const AI_URL = process.env.NEXT_PUBLIC_AI_URL || 'http://localhost:3007'

function authHeader() {
  if (typeof window === 'undefined') return {}
  const token = localStorage.getItem('eldercare_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const authClient    = axios.create({ baseURL: `${AUTH_URL}/api`,    timeout: 15_000, headers: { 'Content-Type': 'application/json' } })
const homeClient    = axios.create({ baseURL: `${HOME_URL}/api`,    timeout: 15_000, headers: { 'Content-Type': 'application/json' } })
const nurseClient   = axios.create({ baseURL: `${NURSE_URL}/api`,   timeout: 15_000, headers: { 'Content-Type': 'application/json' } })
const bookingClient = axios.create({ baseURL: `${BOOKING_URL}/api`, timeout: 15_000, headers: { 'Content-Type': 'application/json' } })
const alertClient   = axios.create({ baseURL: `${ALERT_URL}/api`,   timeout: 15_000, headers: { 'Content-Type': 'application/json' } })
const aiClient      = axios.create({ baseURL: `${AI_URL}/api`,      timeout: 30_000, headers: { 'Content-Type': 'application/json' } })

;[authClient, homeClient, nurseClient, bookingClient, alertClient, aiClient].forEach(client => {
  client.interceptors.request.use((config) => {
    Object.assign(config.headers, authHeader())
    return config
  })
})

export const homesApi = {
  search: (filters: Record<string, unknown>) =>
    homeClient.get('/homes', { params: filters }),
  getById: (id: string) =>
    homeClient.get(`/homes/${id}`),
  register: (data: unknown) =>
    homeClient.post('/homes', data),
  update: (id: string, data: unknown) =>
    homeClient.put(`/homes/${id}`, data)
}

export const nursesApi = {
  search: (filters: Record<string, unknown>) =>
    nurseClient.get('/nurses', { params: filters }),
  getById: (id: string) =>
    nurseClient.get(`/nurses/${id}`),
  register: (data: unknown) =>
    nurseClient.post('/nurses', data),
  triggerSlncVerify: (id: string) =>
    nurseClient.post(`/nurses/${id}/verify-slnc`)
}

export const aiApi = {
  matchHomes: (request: unknown) =>
    aiClient.post('/ai/match/homes', request),
  matchNurses: (request: unknown) =>
    aiClient.post('/ai/match/nurses', request),
  analyzeAlert: (data: unknown) =>
    aiClient.post('/ai/alerts/analyze', data),
  chat: (sessionId: string | null, message: string, context?: unknown) =>
    aiClient.post('/ai/chat/message', { sessionId, message, context })
}

export const bookingsApi = {
  create: (data: unknown) =>
    bookingClient.post('/bookings', data),
  getMyBookings: () =>
    bookingClient.get('/bookings/mine'),
  getById: (id: string) =>
    bookingClient.get(`/bookings/${id}`),
  cancel: (id: string) =>
    bookingClient.patch(`/bookings/${id}/cancel`)
}

export const alertsApi = {
  getMyAlerts: () =>
    alertClient.get('/alerts/mine'),
  acknowledge: (id: string) =>
    alertClient.patch(`/alerts/${id}/acknowledge`),
  create: (data: unknown) =>
    alertClient.post('/alerts', data)
}

export const authApi = {
  login: (email: string, password: string) =>
    authClient.post('/auth/login', { email, password }),
  register: (data: unknown) =>
    authClient.post('/auth/register', data),
  logout: () =>
    authClient.post('/auth/logout'),
  me: () =>
    authClient.get('/auth/me'),
  verifyEmail: (token: string) =>
    authClient.post('/auth/verify-email', { token })
}

export const apiClient = authClient