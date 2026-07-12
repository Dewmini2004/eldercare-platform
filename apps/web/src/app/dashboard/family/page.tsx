'use client'
import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api/client'

export default function FamilyDashboard() {
  const [alerts, setAlerts] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])

  useEffect(() => {
    apiClient.get('/alerts/mine').then(r => setAlerts(r.data.data || [])).catch(() => {})
    apiClient.get('/bookings/mine').then(r => setBookings(r.data.data || [])).catch(() => {})
  }, [])

  const severityColor: Record<string, string> = {
    critical: '#C0392B', urgent: '#E74C3C', attention: '#E67E22', info: '#2980B9'
  }

  return (
    <div className="page">
      <div className="topbar">
        <div>
          <h1 className="page-title">Family dashboard</h1>
          <p className="page-sub">Welcome back — here's the latest on your elder.</p>
        </div>
        <button className="btn-primary" onClick={() => window.location.href='/dashboard/family/chat'}>
          Ask AI assistant
        </button>
      </div>

      <div className="stats-grid">
        {[
          { label: 'Elder status', value: 'Settled in', color: '#2D6A4F' },
          { label: 'Unread alerts', value: alerts.filter(a => !a.acknowledgedAt).length.toString(), color: alerts.some(a => a.aiSeverity === 'critical') ? '#C0392B' : '#1B4332' },
          { label: 'Next payment', value: 'LKR 85,000', color: '#E67E22' },
          { label: 'Days in care', value: '47', color: '#1B4332' }
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Emergency alerts</h2>
            {alerts.filter(a => !a.acknowledgedAt).length > 0 && (
              <span className="badge badge-red">{alerts.filter(a => !a.acknowledgedAt).length} new</span>
            )}
          </div>
          {alerts.length === 0 ? (
            <p className="empty">No alerts yet.</p>
          ) : (
            alerts.slice(0, 5).map(alert => (
              <div className="alert-row" key={alert.id} style={{ borderLeftColor: severityColor[alert.aiSeverity] || '#2980B9' }}>
                <div>
                  <div className="alert-title">{alert.aiSeverity?.toUpperCase()} — {alert.elderName}</div>
                  <div className="alert-summary">{alert.aiSummary || alert.rawIncident}</div>
                  {alert.aiSuggestedActions?.length > 0 && (
                    <div className="alert-actions">Next: {alert.aiSuggestedActions[0]}</div>
                  )}
                </div>
                <div className="alert-time">{new Date(alert.createdAt).toLocaleDateString()}</div>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Bookings</h2>
            <a href="/dashboard/family/bookings" className="card-link">View all</a>
          </div>
          {bookings.length === 0 ? (
            <p className="empty">No bookings yet. <a href="/homes">Find a home</a></p>
          ) : (
            bookings.slice(0, 4).map(b => (
              <div className="booking-row" key={b.id}>
                <div>
                  <div className="booking-name">{b.elderName} — {b.bookingType?.replace('_', ' ')}</div>
                  <div className="booking-date">{new Date(b.startDate).toLocaleDateString()}</div>
                </div>
                <span className={`pill pill-${b.status === 'confirmed' ? 'green' : b.status === 'pending' ? 'amber' : 'gray'}`}>
                  {b.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">AI home matching</h2>
          <a href="/homes?ai=true" className="btn-outline">Run AI match</a>
        </div>
        <p className="card-hint">Answer a few questions about your elder and our AI will recommend the best homes from Sri Lanka's verified registry.</p>
      </div>

      <style>{`
        .page { padding: 28px; max-width: 1100px; }
        .topbar { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
        .page-title { font-size: 22px; font-weight: 600; color: #1B4332; margin: 0; }
        .page-sub { font-size: 13px; color: #666; margin: 4px 0 0; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
        .stat-card { background: #fff; border: 1px solid #E0D9D0; border-radius: 10px; padding: 14px 16px; }
        .stat-label { font-size: 12px; color: #888; margin-bottom: 6px; }
        .stat-value { font-size: 20px; font-weight: 600; }
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        .card { background: #fff; border: 1px solid #E0D9D0; border-radius: 12px; padding: 18px; margin-bottom: 16px; }
        .card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
        .card-title { font-size: 14px; font-weight: 600; color: #1B4332; margin: 0; }
        .card-link { font-size: 12px; color: #40916C; text-decoration: none; }
        .card-hint { font-size: 13px; color: #666; }
        .badge { border-radius: 10px; padding: 2px 8px; font-size: 11px; font-weight: 600; }
        .badge-red { background: #FDEDEC; color: #C0392B; }
        .alert-row { border-left: 3px solid; padding: 10px 12px; margin-bottom: 10px; border-radius: 0 6px 6px 0; background: #fafafa; display: flex; gap: 10px; align-items: flex-start; }
        .alert-title { font-size: 12px; font-weight: 600; color: #1a1a1a; }
        .alert-summary { font-size: 12px; color: #555; margin-top: 3px; }
        .alert-actions { font-size: 11px; color: #888; margin-top: 4px; }
        .alert-time { font-size: 11px; color: #aaa; white-space: nowrap; margin-left: auto; }
        .booking-row { display: flex; align-items: center; justify-content: space-between; padding: 9px 0; border-bottom: 1px solid #f0ebe3; }
        .booking-row:last-child { border-bottom: none; }
        .booking-name { font-size: 13px; font-weight: 500; }
        .booking-date { font-size: 12px; color: #888; }
        .pill { border-radius: 10px; padding: 2px 8px; font-size: 11px; font-weight: 600; }
        .pill-green { background: #D8F3DC; color: #1B4332; }
        .pill-amber { background: #FEF9E7; color: #A67C35; }
        .pill-gray { background: #f0f0f0; color: #666; }
        .empty { font-size: 13px; color: #aaa; padding: 12px 0; }
        .btn-primary { background: #1B4332; color: #fff; border: none; border-radius: 8px; padding: 9px 18px; font-size: 13px; font-weight: 600; cursor: pointer; }
        .btn-outline { background: none; color: #1B4332; border: 1px solid #1B4332; border-radius: 8px; padding: 6px 14px; font-size: 12px; cursor: pointer; text-decoration: none; }
      `}</style>
    </div>
  )
}
