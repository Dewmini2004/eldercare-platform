'use client'
import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api/client'

export default function HomeAdminDashboard() {
  const [bookings, setBookings] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])

  useEffect(() => {
    const homeId = localStorage.getItem('eldercare_home_id')
    if (!homeId) return
    apiClient.get(`/bookings/home/${homeId}`).then(r => setBookings(r.data.data || [])).catch(() => {})
    apiClient.get(`/alerts/home/${homeId}`).then(r => setAlerts(r.data.data || [])).catch(() => {})
  }, [])

  return (
    <div className="page">
      <div className="topbar">
        <div>
          <h1 className="page-title">Home admin dashboard</h1>
          <p className="page-sub">Manage your elder care home operations.</p>
        </div>
        <button className="btn-danger" onClick={() => window.location.href='/dashboard/home-admin/alerts/new'}>
          + File emergency alert
        </button>
      </div>

      <div className="stats-grid">
        {[
          { label: 'Total residents', value: '24' },
          { label: 'Available beds', value: '6', highlight: true },
          { label: 'Pending bookings', value: bookings.filter(b => b.status === 'pending').length.toString() },
          { label: 'Active alerts', value: alerts.filter(a => !a.resolvedAt).length.toString(), danger: alerts.some(a => a.aiSeverity === 'critical' && !a.resolvedAt) }
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.danger ? '#C0392B' : s.highlight ? '#2D6A4F' : '#1B4332' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Pending booking requests</h2>
            <span className="badge badge-amber">{bookings.filter(b => b.status === 'pending').length} pending</span>
          </div>
          {bookings.filter(b => b.status === 'pending').length === 0 ? (
            <p className="empty">No pending bookings.</p>
          ) : (
            bookings.filter(b => b.status === 'pending').slice(0, 4).map(b => (
              <div className="booking-row" key={b.id}>
                <div>
                  <div className="booking-name">{b.elderName}, {b.elderAge}</div>
                  <div className="booking-date">{b.bookingType?.replace('_', ' ')} · From {new Date(b.startDate).toLocaleDateString()}</div>
                  {b.elderConditions?.length > 0 && (
                    <div className="booking-conditions">{b.elderConditions.join(', ')}</div>
                  )}
                </div>
                <div className="action-btns">
                  <button className="btn-approve" onClick={() => apiClient.patch(`/bookings/${b.id}/confirm`).then(() => window.location.reload())}>Confirm</button>
                  <button className="btn-reject" onClick={() => apiClient.patch(`/bookings/${b.id}/cancel`).then(() => window.location.reload())}>Decline</button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recent alerts filed</h2>
            <a href="/dashboard/home-admin/alerts/new" className="card-link">+ New alert</a>
          </div>
          {alerts.length === 0 ? (
            <p className="empty">No alerts filed yet.</p>
          ) : (
            alerts.slice(0, 4).map(alert => (
              <div className="alert-row" key={alert.id} style={{ borderLeftColor: alert.aiSeverity === 'critical' ? '#C0392B' : alert.aiSeverity === 'urgent' ? '#E74C3C' : '#E67E22' }}>
                <div style={{ flex: 1 }}>
                  <div className="alert-elder">{alert.elderName}</div>
                  <div className="alert-summary">{alert.aiSummary || alert.rawIncident.slice(0, 80) + '...'}</div>
                </div>
                <span className={`pill pill-${alert.resolvedAt ? 'green' : 'red'}`}>
                  {alert.resolvedAt ? 'resolved' : alert.aiSeverity || 'pending'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Hire a nurse</h2>
          <a href="/nurses" className="btn-outline">Browse SLNC-verified nurses</a>
        </div>
        <p className="card-hint">Find and hire certified nurses for your residents. All nurses are verified against the Sri Lanka Nursing Council registry.</p>
      </div>

      <style>{`
        .page { padding: 28px; max-width: 1100px; }
        .topbar { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
        .page-title { font-size: 22px; font-weight: 600; color: #1B4332; margin: 0; }
        .page-sub { font-size: 13px; color: #666; margin: 4px 0 0; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
        .stat-card { background: #fff; border: 1px solid #E0D9D0; border-radius: 10px; padding: 14px 16px; }
        .stat-label { font-size: 12px; color: #888; margin-bottom: 6px; }
        .stat-value { font-size: 20px; font-weight: 600; color: #1B4332; }
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        .card { background: #fff; border: 1px solid #E0D9D0; border-radius: 12px; padding: 18px; margin-bottom: 16px; }
        .card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
        .card-title { font-size: 14px; font-weight: 600; color: #1B4332; margin: 0; }
        .card-link { font-size: 12px; color: #40916C; text-decoration: none; }
        .card-hint { font-size: 13px; color: #666; }
        .badge { border-radius: 10px; padding: 2px 8px; font-size: 11px; font-weight: 600; }
        .badge-amber { background: #FEF9E7; color: #A67C35; }
        .booking-row { padding: 10px 0; border-bottom: 1px solid #f0ebe3; display: flex; align-items: flex-start; gap: 12px; }
        .booking-row:last-child { border-bottom: none; }
        .booking-name { font-size: 13px; font-weight: 600; }
        .booking-date { font-size: 12px; color: #888; margin-top: 2px; }
        .booking-conditions { font-size: 11px; color: #aaa; margin-top: 2px; }
        .action-btns { display: flex; gap: 6px; flex-shrink: 0; margin-top: 2px; }
        .btn-approve { background: #D8F3DC; color: #1B4332; border: none; border-radius: 6px; padding: 4px 10px; font-size: 11px; font-weight: 600; cursor: pointer; }
        .btn-reject { background: #FDEDEC; color: #C0392B; border: none; border-radius: 6px; padding: 4px 10px; font-size: 11px; font-weight: 600; cursor: pointer; }
        .alert-row { border-left: 3px solid; padding: 10px 12px; margin-bottom: 8px; border-radius: 0 6px 6px 0; background: #fafafa; display: flex; gap: 12px; align-items: flex-start; }
        .alert-elder { font-size: 12px; font-weight: 600; }
        .alert-summary { font-size: 12px; color: #666; margin-top: 3px; }
        .pill { border-radius: 10px; padding: 2px 8px; font-size: 11px; font-weight: 600; white-space: nowrap; }
        .pill-green { background: #D8F3DC; color: #1B4332; }
        .pill-red { background: #FDEDEC; color: #C0392B; }
        .empty { font-size: 13px; color: #aaa; padding: 12px 0; }
        .btn-danger { background: #C0392B; color: #fff; border: none; border-radius: 8px; padding: 9px 18px; font-size: 13px; font-weight: 600; cursor: pointer; }
        .btn-outline { background: none; color: #1B4332; border: 1px solid #1B4332; border-radius: 8px; padding: 6px 14px; font-size: 12px; cursor: pointer; text-decoration: none; }
      `}</style>
    </div>
  )
}
