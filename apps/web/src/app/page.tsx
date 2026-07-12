import Link from 'next/link'

export default function Home() {
  return (
    <main style={{ fontFamily: 'var(--font-sans)', background: '#F8F4EF', minHeight: '100vh' }}>
      <nav style={{ background: '#1B4332', padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>ElderCare Sri Lanka</span>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/homes" style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, textDecoration: 'none' }}>Find a home</Link>
          <Link href="/nurses" style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, textDecoration: 'none' }}>Hire a nurse</Link>
          <Link href="/login" style={{ background: '#D4A853', color: '#1a1a1a', padding: '6px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
        </div>
      </nav>
      <section style={{ padding: '80px 40px', textAlign: 'center', maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{ fontSize: 40, fontWeight: 700, color: '#1B4332', marginBottom: 16 }}>
          Trusted elder care across Sri Lanka
        </h1>
        <p style={{ fontSize: 18, color: '#555', marginBottom: 40, lineHeight: 1.7 }}>
          Find verified elder care homes, hire SLNC-certified nurses, and stay connected with AI-powered emergency alerts.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link href="/homes" style={{ background: '#1B4332', color: '#fff', padding: '14px 28px', borderRadius: 8, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
            Find a home near me
          </Link>
          <Link href="/register" style={{ background: '#fff', color: '#1B4332', padding: '14px 28px', borderRadius: 8, fontSize: 15, fontWeight: 600, textDecoration: 'none', border: '1px solid #1B4332' }}>
            Register your home
          </Link>
        </div>
      </section>
    </main>
  )
}
