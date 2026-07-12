'use client'
import { useState, useEffect } from 'react'
import { homesApi, aiApi } from '@/lib/api/client'

export default function HomesPage() {
  const [homes, setHomes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ district: '', maxMonthlyFee: '', minBeds: '' })
  const [aiMode, setAiMode] = useState(false)
  const [aiMatches, setAiMatches] = useState<any[]>([])
  const [aiForm, setAiForm] = useState({ elderAge: 70, conditions: '', budgetMinLkr: 50000, budgetMaxLkr: 150000, preferredDistrict: '', preferredLanguages: 'sinhala' })
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => {
    homesApi.search({ status: 'active', ...filters })
      .then(r => setHomes(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [filters])

  async function runAiMatch() {
    setAiLoading(true)
    try {
      const res = await aiApi.matchHomes({
        elderAge: aiForm.elderAge,
        conditions: aiForm.conditions.split(',').map(s => s.trim()).filter(Boolean),
        preferredLanguages: aiForm.preferredLanguages.split(',').map(s => s.trim()),
        budgetMinLkr: aiForm.budgetMinLkr,
        budgetMaxLkr: aiForm.budgetMaxLkr,
        preferredDistrict: aiForm.preferredDistrict
      })
      setAiMatches(res.data.data || [])
      setAiMode(true)
    } catch {
      alert('AI matching unavailable. Make sure the AI service is running.')
    } finally {
      setAiLoading(false)
    }
  }

  const displayHomes = aiMode ? aiMatches.map((m: any) => m.home) : homes

  return (
    <div style={{ padding: 28, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1B4332', margin: 0 }}>Elder care homes in Sri Lanka</h1>
          <p style={{ fontSize: 13, color: '#888', margin: '4px 0 0' }}>{homes.length} verified homes across all districts</p>
        </div>
        <button onClick={() => setAiMode(!aiMode)} style={{ background: aiMode ? '#D4A853' : '#1B4332', color: aiMode ? '#1a1a1a' : '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          {aiMode ? 'AI match ON' : 'AI match'}
        </button>
      </div>

      {aiMode && (
        <div style={{ background: '#fff', border: '1px solid #B7E4C7', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1B4332', margin: '0 0 16px' }}>Tell us about your elder</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>Elder age</label>
              <input type="number" value={aiForm.elderAge} onChange={e => setAiForm(f => ({ ...f, elderAge: Number(e.target.value) }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #E0D9D0', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>Medical conditions</label>
              <input value={aiForm.conditions} onChange={e => setAiForm(f => ({ ...f, conditions: e.target.value }))} placeholder="diabetes, dementia" style={{ width: '100%', padding: '8px 12px', border: '1px solid #E0D9D0', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>Budget min (LKR)</label>
              <input type="number" value={aiForm.budgetMinLkr} onChange={e => setAiForm(f => ({ ...f, budgetMinLkr: Number(e.target.value) }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #E0D9D0', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>Budget max (LKR)</label>
              <input type="number" value={aiForm.budgetMaxLkr} onChange={e => setAiForm(f => ({ ...f, budgetMaxLkr: Number(e.target.value) }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #E0D9D0', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>Preferred district</label>
              <input value={aiForm.preferredDistrict} onChange={e => setAiForm(f => ({ ...f, preferredDistrict: e.target.value }))} placeholder="Colombo" style={{ width: '100%', padding: '8px 12px', border: '1px solid #E0D9D0', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>Languages</label>
              <input value={aiForm.preferredLanguages} onChange={e => setAiForm(f => ({ ...f, preferredLanguages: e.target.value }))} placeholder="sinhala, english" style={{ width: '100%', padding: '8px 12px', border: '1px solid #E0D9D0', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
            </div>
          </div>
          <button onClick={runAiMatch} disabled={aiLoading} style={{ background: '#1B4332', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: aiLoading ? 'not-allowed' : 'pointer', opacity: aiLoading ? 0.6 : 1 }}>
            {aiLoading ? 'Finding best matches...' : 'Find best matches'}
          </button>
        </div>
      )}

      {!aiMode && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <input style={{ padding: '9px 14px', border: '1px solid #E0D9D0', borderRadius: 8, fontSize: 13, flex: 1 }} placeholder="District (e.g. Colombo)" value={filters.district} onChange={e => setFilters(f => ({ ...f, district: e.target.value }))} />
          <input style={{ padding: '9px 14px', border: '1px solid #E0D9D0', borderRadius: 8, fontSize: 13, flex: 1 }} type="number" placeholder="Max monthly fee (LKR)" value={filters.maxMonthlyFee} onChange={e => setFilters(f => ({ ...f, maxMonthlyFee: e.target.value }))} />
        </div>
      )}

      {loading ? (
        <p style={{ textAlign: 'center', color: '#888', padding: 40 }}>Loading homes...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {displayHomes.map((home: any, i: number) => {
            const match = aiMode ? aiMatches[i] : null
            return (
              <div key={home?.id || i} style={{ background: '#fff', border: '1px solid #E0D9D0', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ width: '100%', height: 140, background: '#D8F3DC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>🏡</div>
                <div style={{ padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1B4332' }}>{home?.name}</div>
                    {match && (
                      <div style={{ background: match.matchScore >= 80 ? '#D8F3DC' : '#FEF9E7', color: match.matchScore >= 80 ? '#1B4332' : '#A67C35', borderRadius: 10, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                        {match.matchScore}% match
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>{home?.city}, {home?.district}</div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#555', marginBottom: 8 }}>
                    <span>{home?.availableBeds} beds</span>
                    <span>LKR {Number(home?.monthlyFeeMin || 0).toLocaleString()}/mo</span>
                  </div>
                  {home?.isNseVerified && (
                    <span style={{ background: '#D8F3DC', color: '#1B4332', borderRadius: 10, padding: '2px 8px', fontSize: 11, fontWeight: 600, display: 'inline-block', marginBottom: 8 }}>NSE Verified</span>
                  )}
                  {match?.aiExplanation && (
                    <p style={{ fontSize: 12, color: '#555', margin: '8px 0', lineHeight: 1.5, fontStyle: 'italic' }}>{match.aiExplanation}</p>
                  )}
                  <a href={'/homes/' + home?.id} style={{ display: 'block', background: '#1B4332', color: '#fff', textAlign: 'center', padding: 9, borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
                    View and book
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {!loading && displayHomes.length === 0 && (
        <p style={{ textAlign: 'center', color: '#888', padding: 40 }}>No homes found. Try adjusting your filters.</p>
      )}
    </div>
  )
}