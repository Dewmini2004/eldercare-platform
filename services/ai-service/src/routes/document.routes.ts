import type { FastifyInstance } from 'fastify'
import { callGroqJSON } from '../utils/groq'

interface CertificateExtraction {
  nurseFullName: string | null
  slncRegistrationNumber: string | null
  issueDate: string | null
  expiryDate: string | null
  qualificationType: string | null
  issuingAuthority: string | null
  isSuspicious: boolean
  suspicionReasons: string[]
  confidence: 'high' | 'medium' | 'low'
}

export async function documentRoutes(app: FastifyInstance) {
  /**
   * POST /api/ai/documents/extract-certificate
   * Extract key info from a nursing certificate image (base64)
   * Uses Groq vision capabilities
   */
  app.post<{
    Body: {
      documentText: string   // OCR text from certificate
      nurseSubmittedName?: string
      nurseSubmittedSlncNumber?: string
    }
  }>('/extract-certificate', {
    schema: {
      body: {
        type: 'object',
        required: ['documentText'],
        properties: {
          documentText:             { type: 'string', minLength: 20 },
          nurseSubmittedName:       { type: 'string' },
          nurseSubmittedSlncNumber: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { documentText, nurseSubmittedName, nurseSubmittedSlncNumber } = request.body

    const systemPrompt = `You are a document verification specialist for nursing certificates in Sri Lanka.
Extract key information from OCR text of nursing certificates.
Flag any inconsistencies that might indicate tampering.
Respond ONLY with valid JSON.`

    const userPrompt = `
OCR Text from Certificate:
"${documentText}"

Nurse Submitted Details:
- Name: ${nurseSubmittedName || 'Not provided'}
- SLNC Number: ${nurseSubmittedSlncNumber || 'Not provided'}

Extract and validate. Return JSON:
{
  "nurseFullName": "extracted name or null",
  "slncRegistrationNumber": "extracted SLNC number or null",
  "issueDate": "YYYY-MM-DD or null",
  "expiryDate": "YYYY-MM-DD or null",
  "qualificationType": "e.g. Registered Nurse, Enrolled Nurse, or null",
  "issuingAuthority": "e.g. Sri Lanka Nursing Council or null",
  "isSuspicious": false,
  "suspicionReasons": [],
  "confidence": "high | medium | low"
}

Flag as suspicious if:
- Submitted name doesn't match extracted name
- Submitted SLNC number doesn't match extracted number
- Dates seem inconsistent or in the future for issue date
- Document appears to be missing standard SLNC elements`

    try {
      const extraction = await callGroqJSON<CertificateExtraction>([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], { temperature: 0.1, maxTokens: 512 })

      return reply.send({
        success: true,
        data: extraction
      })
    } catch (err) {
      app.log.error(err, 'Certificate extraction failed')
      return reply.status(500).send({
        success: false,
        error: 'Document processing failed'
      })
    }
  })
}
