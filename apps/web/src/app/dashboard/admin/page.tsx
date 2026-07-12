'use client'
import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api/client'

export default function AdminDashboard() {
  const [pendingHomes, setPendingHomes] = useState<any[]>([])
  const [pendingNurses, setPendingNurses] = useState<any[]>([])

  useEffect(() => {
    apiClient.get('/homes?status=pending&limit=10').then(r => setPendingHomes(r.data.data || [])).catch(() => {})
    apiClient.get('/nurses?slncStatus=pending&limit=10').then(r => setPendingNurses(r.data.data || [])).catch(() => {})
  }, [])

  return (
    <div className="page">
      <div className="topbar">
        <div>
          <h1 className="page-title">Super admin dashboard</h1>
          <p className="page-sub">Platform management and oversight.</p>
        </div>
        <a href="/dashboard/admin/analytics" className="btn-outline">View analytics</a>
      </div>

      <div className="stats-grid">
        {[
          { label: 'Registered homes', value: '142', sub: '↑ 8 this month' },
          { label: 'Active nurses', value: '387', sub: 'SLNC verified' },
          { label: 'Pending approvals', value: (pendingHomes.length + pendingNurses.length).toString(), sub: 'Need action', warn: true },
          { label: 'Platform bookings', value: '1,204', sub: 'All time' }
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.warn ? '#C0392B' : '#1B4332' }}>{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Homes pending approval</h2>
            <span className="badge badge-amber">{pendingHomes.length} pending</span>
          </div>
          {pendingHomes.length === 0 ? (
            <p className="empty">No homes pending approval.</p>
          ) : (
            pendingHomes.slice(0, 5).map(home => (
              <div className="item-row" key={home.id}>
                <div style={{ flex: 1 }}>
                  <div className="item-name">{home.name}</div>
                  <div className="item-info">{home.district} · {home.type} · Reg: {home.registrationNumber}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    className="btn-approve"
                    onClick={() => apiClient.patch(`/homes/${home.id}/approve`).then(() => window.location.reload())}
                  >Approve</button>
                  <button className="btn-reject">Reject</button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">SLNC verification queue</h2>
            <span className="badge badge-amber">{pendingNurses.length} pending</span>
          </div>
          {pendingNurses.length === 0 ? (
            <p className="empty">No nurses pending SLNC check.</p>
          ) : (
            pendingNurses.slice(0, 5).map(nurse => (
              <div className="item-row" key={nurse.id}>
                <div style={{ flex: 1 }}>
                  <div className="item-name">{nurse.fullName}</div>
                  <div className="item-info">SLNC: {nurse.slncRegistrationNumber} · {nurse.district}</div>
                </div>
                <button
                  className="btn-verify"
                  onClick={() => apiClient.post(`/nurses/${nurse.id}/verify-slnc`).then(() => window.location.reload())}
                >
                  Check SLNC
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Quick actions</h2>
        </div>
        <div className="quick-actions">
          {[
            { label: 'Manage all homes', href: '/dashboard/admin/homes', icon: '🏠' },
            { label: 'Manage all nurses', href: '/dashboard/admin/nurses', icon: '👩‍⚕️' },
            { label: 'All users', href: '/dashboard/admin/users', icon: '👥' },
            { label: 'All alerts', href: '/dashboard/admin/alerts', icon: '🚨' },
            { label: 'Platform analytics', href: '/dashboard/admin/analytics', icon: '📊' },
            { label: 'SLNC batch verify', href: '/dashboard/admin/verifications', icon: '✅' }
          ].map(a => (
            <a key={a.href} href={a.href} className="quick-btn">
              <span style={{ fontSize: 20 }}>{a.icon}</span>
              <span>{a.label}</span>
            </a>
          ))}
        </div>
      </div>

      <style>{`
        .page { padding: 28px; max-width: 1100px; }
        .topbar { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
        .page-title { font-size: 22px; font-weight: 600; color: #1B4332; margin: 0; }
        .page-sub { font-size: 13px; color: #666; margin: 4px 0 0; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
        .stat-card { background: #fff; border: 1px solid #E0D9D0; border-radius: 10px; padding: 14px 16px; }
        .stat-label { font-size: 12px; color: #888; margin-bottom: 6px; }
        .stat-value { font-size: 22px; font-weight: 600; }
        .stat-sub { font-size: 11px; color: #aaa; margin-top: 4px; }
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        .card { background: #fff; border: 1px solid #E0D9D0; border-radius: 12px; padding: 18px; margin-bottom: 16px; }
        .card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
        .card-title { font-size: 14px; font-weight: 600; color: #1B4332; margin: 0; }
        .badge { border-radius: 10px; padding: 2px 8px; font-size: 11px; font-weight: 600; }
        .badge-amber { background: #FEF9E7; color: #A67C35; }
        .item-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid #f0ebe3; }
        .item-row:last-child { border-bottom: none; }
        .item-name { font-size: 13px; font-weight: 600; }
        .item-info { font-size: 12px; color: #888; margin-top: 2px; }
        .btn-approve { background: #D8F3DC; color: #1B4332; border: none; border-radius: 6px; padding: 5px 10px; font-size: 11px; font-weight: 600; cursor: pointer; }
        .btn-reject { background: #FDEDEC; color: #C0392B; border: none; border-radius: 6px; padding: 5px 10px; font-size: 11px; font-weight: 600; cursor: pointer; }
        .btn-verify { background: #EBF5FB; color: #1A5276; border: none; border-radius: 6px; padding: 5px 10px; font-size: 11px; font-weight: 600; cursor: pointer; white-space: nowrap; }
        .empty { font-size: 13px; color: #aaa; padding: 12px 0; }
        .quick-actions { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .quick-btn { display: flex; align-items: center; gap: 10px; padding: 12px 16px; background: #F8F4EF; border-radius: 8px; text-decoration: none; color: #1B4332; font-size: 13px; font-weight: 500; border: 1px solid #E0D9D0; transition: background 0.15s; }
        .quick-btn:hover { background: #D8F3DC; }
        .btn-outline { background: none; color: #1B4332; border: 1px solid #1B4332; border-radius: 8px; padding: 8px 16px; font-size: 13px; cursor: pointer; text-decoration: none; }
      `}</style>
    </div>
  )
}
