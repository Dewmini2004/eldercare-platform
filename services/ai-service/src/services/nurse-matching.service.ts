import { callGroqJSON } from '../utils/groq'
import type { NurseMatchingRequest, NurseMatchResult, Nurse } from '@eldercare/shared-types'

async function fetchCandidateNurses(req: NurseMatchingRequest): Promise<Nurse[]> {
  const params = new URLSearchParams({
    district: req.district,
    slncStatus: 'verified',
    availableFor: req.hiringType === 'home_visit' ? 'home_visits' : 'residential'
  })

  const res = await fetch(
    `${process.env.NURSE_SERVICE_URL}/api/nurses?${params}`
  )
  if (!res.ok) throw new Error('Failed to fetch nurses from nurse-service')
  const data = await res.json()
  return data.data as Nurse[]
}

/**
 * AI-powered nurse matching for elder care needs
 */
export async function matchNursesForElder(
  request: NurseMatchingRequest
): Promise<NurseMatchResult[]> {
  const nurses = await fetchCandidateNurses(request)
  if (nurses.length === 0) return []

  const nurseSummaries = nurses.map((n) => ({
    id: n.id,
    specializations: n.specializations,
    yearsOfExperience: n.yearsOfExperience,
    languages: n.languages,
    slncStatus: n.slncStatus,
    availableForHomeVisits: n.availableForHomeVisits,
    availableForResidential: n.availableForResidential,
    hourlyRate: n.hourlyRate,
    monthlyRate: n.monthlyRate,
    averageRating: n.averageRating,
    totalReviews: n.totalReviews,
    district: n.district
  }))

  const systemPrompt = `You are a healthcare staffing expert specializing in elder care in Sri Lanka.
Match nurses to elder care needs. Respond ONLY with valid JSON.`

  const userPrompt = `
Care Requirements:
- Elder Conditions: ${request.elderConditions.join(', ')}
- Required Specializations: ${request.requiredSpecializations.join(', ')}
- Preferred Languages: ${request.preferredLanguages.join(', ')}
- Budget: LKR ${request.budgetLkr.toLocaleString()} (${request.hiringType === 'home_visit' ? 'per hour' : 'per month'})
- Hiring Type: ${request.hiringType}
- District: ${request.district}
- Start Date: ${request.startDate}

Available SLNC-Verified Nurses:
${JSON.stringify(nurseSummaries, null, 2)}

Score each nurse 0-100. Prioritize:
1. Specialization match to elder conditions (critical)
2. SLNC verification (must be verified)
3. Language match
4. Budget compatibility
5. Experience level
6. Availability type match
7. Rating

Return JSON:
{
  "matches": [
    {
      "nurseId": "string",
      "matchScore": 90,
      "matchReasons": ["reason 1", "reason 2"],
      "aiExplanation": "2-3 sentence explanation for the family"
    }
  ]
}

Only nurses with score >= 50. Sort descending. Max 5.`

  const result = await callGroqJSON<{
    matches: Array<{
      nurseId: string
      matchScore: number
      matchReasons: string[]
      aiExplanation: string
    }>
  }>([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ], { temperature: 0.2, maxTokens: 2048 })

  const nurseMap = new Map(nurses.map((n) => [n.id, n]))

  return result.matches
    .filter((m) => nurseMap.has(m.nurseId))
    .map((m) => ({
      nurse: nurseMap.get(m.nurseId)!,
      matchScore: m.matchScore,
      matchReasons: m.matchReasons,
      aiExplanation: m.aiExplanation
    }))
}
