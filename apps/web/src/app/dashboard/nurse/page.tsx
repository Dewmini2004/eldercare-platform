'use client'
import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api/client'

export default function NurseDashboard() {
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    apiClient.get('/nurses/me/profile').then(r => setProfile(r.data.data)).catch(() => {})
  }, [])

  const slncColors: Record<string, { bg: string; color: string; label: string }> = {
    verified:     { bg: '#D8F3DC', color: '#1B4332', label: '✓ SLNC Verified' },
    not_verified: { bg: '#FEF9E7', color: '#A67C35', label: '⚠ Not yet verified' },
    not_registered:{ bg: '#FDEDEC', color: '#C0392B', label: '✗ Not registered' },
    pending:      { bg: '#EBF5FB', color: '#1A5276', label: '⏳ Pending check' }
  }
  const slnc = slncColors[profile?.slncStatus || 'pending']

  return (
    <div className="page">
      <div className="topbar">
        <div>
          <h1 className="page-title">Nurse dashboard</h1>
          <p className="page-sub">Manage your profile, jobs, and schedule.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {profile && (
            <span style={{ background: slnc.bg, color: slnc.color, padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
              {slnc.label}
            </span>
          )}
        </div>
      </div>

      {profile && (
        <div className="profile-card">
          <div className="profile-avatar">{profile.fullName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}</div>
          <div style={{ flex: 1 }}>
            <div className="profile-name">{profile.fullName}</div>
            <div className="profile-info">{profile.specializations?.join(', ')} · {profile.yearsOfExperience} yrs experience</div>
            <div className="profile-info">{profile.district}, {profile.province}</div>
            <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {profile.languages?.map((l: string) => (
                <span key={l} className="tag">{l}</span>
              ))}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            {profile.hourlyRate && <div className="rate">LKR {Number(profile.hourlyRate).toLocaleString()}<span style={{ fontSize: 11, color: '#888' }}>/hr</span></div>}
            {profile.monthlyRate && <div className="rate" style={{ fontSize: 14 }}>LKR {Number(profile.monthlyRate).toLocaleString()}<span style={{ fontSize: 11, color: '#888' }}>/mo</span></div>}
            <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>⭐ {profile.averageRating || '—'} ({profile.totalReviews || 0} reviews)</div>
          </div>
        </div>
      )}

      <div className="stats-grid">
        {[
          { label: 'SLNC status', value: profile?.slncStatus || 'Pending', color: slnc?.color || '#888' },
          { label: 'Job requests', value: '3', color: '#1B4332' },
          { label: 'Active assignments', value: '1', color: '#2D6A4F' },
          { label: 'This month earned', value: 'LKR 45,000', color: '#D4A853' }
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color, fontSize: s.value.length > 8 ? 15 : 20 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">SLNC certificate status</h2>
          </div>
          <div style={{ padding: '12px', background: slnc?.bg || '#f0f0f0', borderRadius: 8, marginBottom: 12 }}>
            <div style={{ fontWeight: 600, color: slnc?.color || '#888', fontSize: 14 }}>{slnc?.label || 'Checking...'}</div>
            {profile?.slncLastChecked && (
              <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                Last checked: {new Date(profile.slncLastChecked).toLocaleDateString()}
              </div>
            )}
          </div>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
            Your SLNC registration number <strong>{profile?.slncRegistrationNumber}</strong> is checked against the Sri Lanka Nursing Council registry every 30 days.
          </p>
          <button
            className="btn-primary"
            onClick={() => profile && apiClient.post(`/nurses/${profile.id}/verify-slnc`).then(() => window.location.reload())}
          >
            Re-check now
          </button>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Incoming job requests</h2>
            <a href="/dashboard/nurse/jobs" className="card-link">View all</a>
          </div>
          {[
            { name: 'Sewa Elders Home', type: 'Residential', district: 'Colombo', rate: 'LKR 75,000/mo', conditions: ['Dementia', 'Diabetes'] },
            { name: 'Karunasena Family', type: 'Home visit', district: 'Kandy', rate: 'LKR 2,500/hr', conditions: ['Post-surgery'] }
          ].map((job, i) => (
            <div className="job-row" key={i}>
              <div style={{ flex: 1 }}>
                <div className="job-name">{job.name}</div>
                <div className="job-info">{job.type} · {job.district} · {job.rate}</div>
                <div className="job-tags">{job.conditions.map(c => <span key={c} className="tag">{c}</span>)}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <button className="btn-sm-green">Accept</button>
                <button className="btn-sm-gray">Decline</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .page { padding: 28px; max-width: 1100px; }
        .topbar { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
        .page-title { font-size: 22px; font-weight: 600; color: #1B4332; margin: 0; }
        .page-sub { font-size: 13px; color: #666; margin: 4px 0 0; }
        .profile-card { background: #fff; border: 1px solid #E0D9D0; border-radius: 12px; padding: 18px; display: flex; gap: 16px; align-items: flex-start; margin-bottom: 20px; }
        .profile-avatar { width: 52px; height: 52px; border-radius: 50%; background: #D8F3DC; color: #1B4332; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; flex-shrink: 0; }
        .profile-name { font-size: 16px; font-weight: 600; color: #1B4332; }
        .profile-info { font-size: 12px; color: #666; margin-top: 3px; }
        .rate { font-size: 16px; font-weight: 700; color: #1B4332; }
        .tag { background: #F0F9F4; color: #2D6A4F; border: 1px solid #B7E4C7; border-radius: 10px; padding: 2px 8px; font-size: 11px; margin-right: 4px; display: inline-block; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
        .stat-card { background: #fff; border: 1px solid #E0D9D0; border-radius: 10px; padding: 14px 16px; }
        .stat-label { font-size: 12px; color: #888; margin-bottom: 6px; }
        .stat-value { font-size: 20px; font-weight: 600; }
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .card { background: #fff; border: 1px solid #E0D9D0; border-radius: 12px; padding: 18px; }
        .card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
        .card-title { font-size: 14px; font-weight: 600; color: #1B4332; margin: 0; }
        .card-link { font-size: 12px; color: #40916C; text-decoration: none; }
        .job-row { padding: 10px 0; border-bottom: 1px solid #f0ebe3; display: flex; gap: 12px; align-items: flex-start; }
        .job-row:last-child { border-bottom: none; }
        .job-name { font-size: 13px; font-weight: 600; }
        .job-info { font-size: 12px; color: #666; margin-top: 2px; }
        .job-tags { margin-top: 6px; display: flex; gap: 4px; flex-wrap: wrap; }
        .btn-primary { background: #1B4332; color: #fff; border: none; border-radius: 8px; padding: 9px 18px; font-size: 13px; font-weight: 600; cursor: pointer; }
        .btn-sm-green { background: #D8F3DC; color: #1B4332; border: none; border-radius: 6px; padding: 5px 10px; font-size: 11px; font-weight: 600; cursor: pointer; white-space: nowrap; }
        .btn-sm-gray { background: #f0f0f0; color: #666; border: none; border-radius: 6px; padding: 5px 10px; font-size: 11px; font-weight: 600; cursor: pointer; }
      `}</style>
    </div>
  )
}
