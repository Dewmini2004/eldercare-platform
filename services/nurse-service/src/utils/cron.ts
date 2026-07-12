import { reVerifyAllNurses } from '../services/slnc-verification.service'

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

export function scheduleSlncReverification() {
  console.log('📅 SLNC re-verification cron scheduled (every 30 days)')
  setInterval(async () => {
    console.log('🔄 Running scheduled SLNC re-verification...')
    try {
      await reVerifyAllNurses()
    } catch (err) {
      console.error('Scheduled SLNC re-verification failed:', err)
    }
  }, THIRTY_DAYS_MS)
}
