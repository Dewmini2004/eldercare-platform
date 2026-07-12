import * as cheerio from 'cheerio'
import { db } from '../db'
import { nurses, slncVerificationLog } from '../db/schema/nurses.schema'
import { eq } from 'drizzle-orm'

type SlncResult = 'verified' | 'not_verified' | 'not_registered'

/**
 * Checks nurse registration status against the SLNC public website
 * slnc.lk/registered_nurses.php has a search form that returns one of:
 * - "Registered Nurse" ✅
 * - "Not Verify Nurse" ⚠️
 * - "Not Registered Nurse" ❌
 */
export async function checkSlncRegistration(
  slncNumber: string
): Promise<SlncResult> {
  const url = process.env.SLNC_VERIFY_URL || 'https://www.slnc.lk/registered_nurses.php'

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'ElderCare-Platform/1.0 (Nurse Verification System)'
      },
      body: new URLSearchParams({
        reg_no: slncNumber,
        search: 'Search'
      }),
      signal: AbortSignal.timeout(10_000)  // 10s timeout
    })

    if (!response.ok) {
      throw new Error(`SLNC website returned ${response.status}`)
    }

    const html = await response.text()
    return parseSlncResponse(html)
  } catch (err) {
    console.error('SLNC verification request failed:', err)
    // Don't throw — fall back to pending status
    throw new Error('SLNC website unreachable')
  }
}

function parseSlncResponse(html: string): SlncResult {
  const $ = cheerio.load(html)

  // The SLNC site shows modal-style divs with these class indicators
  // Based on the page source at slnc.lk/registered_nurses.php
  const pageText = $.text().toLowerCase()

  if (pageText.includes('registered nurse') && !pageText.includes('not registered')) {
    return 'verified'
  }
  if (pageText.includes('not verify nurse')) {
    return 'not_verified'
  }
  if (pageText.includes('not registered nurse')) {
    return 'not_registered'
  }

  // Default — couldn't determine
  return 'not_verified'
}

/**
 * Verify a nurse and update their status in the DB
 */
export async function verifyAndUpdateNurse(
  nurseId: string,
  triggeredBy: 'system' | 'admin' | 'nurse' = 'system'
): Promise<SlncResult> {
  const [nurse] = await db
    .select({ slncRegistrationNumber: nurses.slncRegistrationNumber })
    .from(nurses)
    .where(eq(nurses.id, nurseId))
    .limit(1)

  if (!nurse) throw new Error(`Nurse ${nurseId} not found`)

  let result: SlncResult

  try {
    result = await checkSlncRegistration(nurse.slncRegistrationNumber)
  } catch {
    result = 'not_verified'
  }

  // Update nurse status
  await db
    .update(nurses)
    .set({
      slncStatus: result,
      slncLastChecked: new Date(),
      status: result === 'verified' ? 'slnc_verified' : 'pending',
      updatedAt: new Date()
    })
    .where(eq(nurses.id, nurseId))

  // Log the verification attempt
  await db.insert(slncVerificationLog).values({
    nurseId,
    result,
    triggeredBy,
    checkedAt: new Date()
  })

  return result
}

/**
 * Batch re-verify all nurses — run via cron every 30 days
 */
export async function reVerifyAllNurses(): Promise<void> {
  const verifiedNurses = await db
    .select({ id: nurses.id })
    .from(nurses)
    .where(eq(nurses.slncStatus, 'verified'))

  console.log(`Re-verifying ${verifiedNurses.length} SLNC-verified nurses...`)

  for (const nurse of verifiedNurses) {
    try {
      await verifyAndUpdateNurse(nurse.id, 'system')
      // Small delay to be polite to SLNC server
      await new Promise((r) => setTimeout(r, 1000))
    } catch (err) {
      console.error(`Re-verification failed for nurse ${nurse.id}:`, err)
    }
  }

  console.log('Batch re-verification complete')
}
