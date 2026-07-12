import { callGroqJSON } from '../utils/groq'
import type { AlertSeverity } from '@eldercare/shared-types'

interface AlertAnalysisResult {
  summary: string
  severity: AlertSeverity
  suggestedActions: string[]
  requiresImmediateContact: boolean
  estimatedResponseTime: string
}

/**
 * AI summarizes a raw staff incident report into a family-friendly alert
 */
export async function analyzeIncidentReport(
  rawReport: string,
  elderName: string,
  elderAge: number,
  elderConditions: string[]
): Promise<AlertAnalysisResult> {
  const systemPrompt = `You are a compassionate medical communication assistant for an elder care platform in Sri Lanka.
Your job is to translate staff incident reports into clear, calm, actionable summaries for worried family members.
Write as if you are explaining to a non-medical family member who may be overseas.
Always be honest but calm. Never minimize genuine emergencies.
Respond ONLY with valid JSON.`

  const userPrompt = `
Elder Information:
- Name: ${elderName}
- Age: ${elderAge}
- Known Conditions: ${elderConditions.join(', ') || 'None on file'}

Staff Incident Report:
"${rawReport}"

Analyze this report and return JSON:
{
  "summary": "Clear, plain-English 2-3 sentence summary for the family. Start with the elder's name.",
  "severity": "info | attention | urgent | critical",
  "suggestedActions": [
    "Specific actionable step 1",
    "Specific actionable step 2"
  ],
  "requiresImmediateContact": true or false,
  "estimatedResponseTime": "e.g. Within 24 hours | Within 2 hours | Call immediately"
}

Severity guide:
- info: Routine update, no concern (e.g. ate well, had a good day)
- attention: Minor issue worth knowing about (e.g. mild cough, skipped a meal)
- urgent: Needs family response within hours (e.g. fall with no serious injury, fever)
- critical: Immediate family contact required (e.g. hospitalization, serious fall, severe episode)`

  return callGroqJSON<AlertAnalysisResult>([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ], { temperature: 0.1, maxTokens: 512 })
}
