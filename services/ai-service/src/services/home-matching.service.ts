import { callGroqJSON } from '../utils/groq'
import type { HomeMatchingRequest, HomeMatchResult, ElderHome } from '@eldercare/shared-types'

/**
 * Fetches candidate homes from home-service filtered by basic criteria
 */
async function fetchCandidateHomes(req: HomeMatchingRequest): Promise<ElderHome[]> {
  const params = new URLSearchParams({
    district: req.preferredDistrict || '',
    province: req.preferredProvince || '',
    maxMonthlyFee: req.budgetMaxLkr.toString(),
    status: 'active'
  })

  const res = await fetch(
    `${process.env.HOME_SERVICE_URL}/api/homes?${params}`
  )

  if (!res.ok) throw new Error('Failed to fetch homes from home-service')
  const data = await res.json()
  return data.data as ElderHome[]
}

/**
 * AI-powered home matching — scores and ranks homes for a specific elder
 */
export async function matchHomesForElder(
  request: HomeMatchingRequest
): Promise<HomeMatchResult[]> {
  const homes = await fetchCandidateHomes(request)

  if (homes.length === 0) {
    return []
  }

  // Build a condensed homes list for the AI (avoid token waste)
  const homeSummaries = homes.map((h) => ({
    id: h.id,
    name: h.name,
    type: h.type,
    district: h.district,
    monthlyFeeMin: h.monthlyFeeMin,
    monthlyFeeMax: h.monthlyFeeMax,
    availableBeds: h.availableBeds,
    facilities: h.facilities,
    languages: h.languages,
    isNseVerified: h.isNseVerified,
    averageRating: h.averageRating,
    totalReviews: h.totalReviews,
    acceptsInsurance: h.acceptsInsurance
  }))

  const systemPrompt = `You are an expert elder care placement advisor in Sri Lanka. 
Your job is to match elderly persons with the most suitable elder care homes based on their needs.
You must respond ONLY with valid JSON — no explanation, no markdown.`

  const userPrompt = `
Elder Profile:
- Age: ${request.elderAge}
- Medical Conditions: ${request.conditions.join(', ') || 'None specified'}
- Preferred Languages: ${request.preferredLanguages.join(', ')}
- Monthly Budget: LKR ${request.budgetMinLkr.toLocaleString()} - ${request.budgetMaxLkr.toLocaleString()}
- Special Requirements: ${request.specialRequirements || 'None'}
- Family Visit Frequency: ${request.familyVisitFrequency || 'Not specified'}

Available Homes:
${JSON.stringify(homeSummaries, null, 2)}

Score each home from 0-100 based on fit. Consider:
1. Budget compatibility (critical)
2. Bed availability (critical)
3. Language match for elder & family
4. Relevant medical facilities for conditions
5. NSE verification status (trustworthiness)
6. Rating and review count
7. Home type suitability

Return JSON in exactly this format:
{
  "matches": [
    {
      "homeId": "string",
      "matchScore": 85,
      "matchReasons": ["reason 1", "reason 2"],
      "concerns": ["concern 1"],
      "aiExplanation": "2-3 sentence plain English explanation for the family"
    }
  ]
}

Only include homes with matchScore >= 40. Sort by matchScore descending. Max 5 results.`

  const result = await callGroqJSON<{
    matches: Array<{
      homeId: string
      matchScore: number
      matchReasons: string[]
      concerns: string[]
      aiExplanation: string
    }>
  }>([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ], { temperature: 0.2, maxTokens: 2048 })

  // Enrich with full home data
  const homeMap = new Map(homes.map((h) => [h.id, h]))

  return result.matches
    .filter((m) => homeMap.has(m.homeId))
    .map((m) => ({
      home: homeMap.get(m.homeId)!,
      matchScore: m.matchScore,
      matchReasons: m.matchReasons,
      concerns: m.concerns,
      aiExplanation: m.aiExplanation
    }))
}
