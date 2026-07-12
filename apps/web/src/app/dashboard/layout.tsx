'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

function useUserRole(): string {
  if (typeof window === 'undefined') return 'family'
  return localStorage.getItem('eldercare_role') || 'family'
}

const navByRole: Record<string, Array<{ href: string; label: string; icon: string; badge?: number }>> = {
  family: [
    { href: '/dashboard/family',          label: 'Overview',      icon: 'ti-layout-dashboard' },
    { href: '/dashboard/family/elder',    label: 'My Elder',      icon: 'ti-heart', },
    { href: '/dashboard/family/alerts',   label: 'Alerts',        icon: 'ti-bell', badge: 2 },
    { href: '/homes',                     label: 'Find a home',   icon: 'ti-building' },
    { href: '/nurses',                    label: 'Hire a nurse',  icon: 'ti-stethoscope' },
    { href: '/dashboard/family/bookings', label: 'Bookings',      icon: 'ti-calendar' },
    { href: '/dashboard/family/payments', label: 'Payments',      icon: 'ti-credit-card' },
    { href: '/dashboard/family/chat',     label: 'AI assistant',  icon: 'ti-message-circle' },
  ],
  home_admin: [
    { href: '/dashboard/home-admin',              label: 'Overview',     icon: 'ti-layout-dashboard' },
    { href: '/dashboard/home-admin/residents',    label: 'Residents',    icon: 'ti-users' },
    { href: '/dashboard/home-admin/bookings',     label: 'Bookings',     icon: 'ti-calendar' },
    { href: '/dashboard/home-admin/alerts',       label: 'File alert',   icon: 'ti-bell' },
    { href: '/dashboard/home-admin/nurses',       label: 'Hire nurses',  icon: 'ti-stethoscope' },
    { href: '/dashboard/home-admin/payments',     label: 'Revenue',      icon: 'ti-credit-card' },
    { href: '/dashboard/home-admin/profile',      label: 'Home profile', icon: 'ti-building' },
  ],
  nurse: [
    { href: '/dashboard/nurse',          label: 'Overview',      icon: 'ti-layout-dashboard' },
    { href: '/dashboard/nurse/slnc',     label: 'SLNC status',  icon: 'ti-shield-check' },
    { href: '/dashboard/nurse/jobs',     label: 'Job requests',  icon: 'ti-stethoscope' },
    { href: '/dashboard/nurse/schedule', label: 'Schedule',      icon: 'ti-calendar' },
    { href: '/dashboard/nurse/earnings', label: 'Earnings',      icon: 'ti-credit-card' },
    { href: '/dashboard/nurse/profile',  label: 'My profile',    icon: 'ti-user' },
  ],
  admin: [
    { href: '/dashboard/admin',                label: 'Overview',       icon: 'ti-layout-dashboard' },
    { href: '/dashboard/admin/homes',          label: 'Homes',          icon: 'ti-building' },
    { href: '/dashboard/admin/nurses',         label: 'Nurses',         icon: 'ti-stethoscope' },
    { href: '/dashboard/admin/users',          label: 'Users',          icon: 'ti-users' },
    { href: '/dashboard/admin/alerts',         label: 'All alerts',     icon: 'ti-bell' },
    { href: '/dashboard/admin/analytics',      label: 'Analytics',      icon: 'ti-chart-bar' },
    { href: '/dashboard/admin/verifications',  label: 'Verifications',  icon: 'ti-shield-check' },
  ]
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const role = useUserRole()
  const navItems = navByRole[role] || navByRole.family

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="sidebar-logo">
          <span className="logo-text">ElderCare</span>
          <span className="logo-sub">Sri Lanka</span>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link key={item.href} href={item.href} className={`nav-link ${active ? 'active' : ''}`}>
                <i className={`ti ${item.icon}`} aria-hidden="true" />
                <span>{item.label}</span>
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </Link>
            )
          })}
        </nav>
        <div className="sidebar-bottom">
          <Link href="/dashboard/settings" className="nav-link"><i className="ti ti-settings" />Settings</Link>
          <button className="nav-link nav-btn" onClick={() => { localStorage.clear(); window.location.href = '/login' }}>
            <i className="ti ti-logout" />Log out
          </button>
        </div>
      </aside>
      <main className="dashboard-main">{children}</main>

      <style>{`
        @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css');
        .dashboard-shell { display: grid; grid-template-columns: 220px 1fr; min-height: 100vh; }
        .dashboard-sidebar { background: #1B4332; display: flex; flex-direction: column; }
        .sidebar-logo { padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .logo-text { display: block; font-size: 18px; color: #fff; font-weight: 700; }
        .logo-sub { font-size: 11px; color: rgba(255,255,255,0.4); }
        .sidebar-nav { flex: 1; padding: 12px 0; overflow-y: auto; }
        .nav-link { display: flex; align-items: center; gap: 10px; padding: 9px 20px; font-size: 13px; color: rgba(255,255,255,0.6); text-decoration: none; border-right: 3px solid transparent; transition: all 0.15s; }
        .nav-link i { font-size: 16px; }
        .nav-link span { flex: 1; }
        .nav-link:hover { color: #fff; background: rgba(255,255,255,0.06); }
        .nav-link.active { color: #fff; background: rgba(255,255,255,0.12); border-right-color: #D4A853; }
        .nav-badge { background: #E74C3C; color: #fff; border-radius: 10px; padding: 1px 6px; font-size: 10px; font-weight: 700; }
        .sidebar-bottom { border-top: 1px solid rgba(255,255,255,0.1); padding: 8px 0; }
        .nav-btn { background: none; border: none; cursor: pointer; width: 100%; text-align: left; }
        .dashboard-main { background: #F8F4EF; overflow: auto; }
      `}</style>
    </div>
  )
}
