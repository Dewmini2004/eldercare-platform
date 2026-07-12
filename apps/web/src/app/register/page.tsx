'use client'
import { useState } from 'react'
import { authApi } from '@/lib/api/client'
import Link from 'next/link'

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', password: '', fullName: '', phone: '', role: 'family' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await authApi.register(form)
      setSuccess(true)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed.')
    } finally { setLoading(false) }
  }

  if (success) return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
          <h2 style={{ color: '#1B4332' }}>Account created!</h2>
          <p style={{ color: '#666', fontSize: 13 }}>Check your email to verify your account, then sign in.</p>
          <Link href="/login" style={{ display: 'inline-block', marginTop: 16, background: '#1B4332', color: '#fff', padding: '10px 24px', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>Go to sign in</Link>
        </div>
      </div>
      <style>{`.auth-page{min-height:100vh;background:#F8F4EF;display:flex;align-items:center;justify-content:center}.auth-card{background:#fff;border:1px solid #E0D9D0;border-radius:14px;padding:40px;width:100%;max-width:420px}`}</style>
    </div>
  )

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">ElderCare Sri Lanka</div>
        <h1 className="auth-title">Create account</h1>
        {error && <div className="error-box">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="label">I am a</label>
            <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              <option value="family">Family member (looking for care)</option>
              <option value="home_admin">Elder home administrator</option>
              <option value="nurse">Nurse (looking for work)</option>
            </select>
          </div>
          <div className="field">
            <label className="label">Full name</label>
            <input className="input" value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} placeholder="Nethmi Silva" required />
          </div>
          <div className="field">
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" required />
          </div>
          <div className="field">
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+94 77 123 4567" />
          </div>
          <div className="field">
            <label className="label">Password</label>
            <input className="input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 8 characters" required minLength={8} />
          </div>
          <button className="btn-submit" type="submit" disabled={loading}>{loading ? 'Creating account...' : 'Create account'}</button>
        </form>
        <p className="auth-footer">Already have an account? <Link href="/login">Sign in</Link></p>
      </div>
      <style>{`
        .auth-page { min-height: 100vh; background: #F8F4EF; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .auth-card { background: #fff; border: 1px solid #E0D9D0; border-radius: 14px; padding: 40px; width: 100%; max-width: 420px; }
        .auth-logo { font-size: 13px; color: #1B4332; font-weight: 700; margin-bottom: 24px; }
        .auth-title { font-size: 24px; font-weight: 700; color: #1B4332; margin: 0 0 24px; }
        .field { margin-bottom: 14px; }
        .label { display: block; font-size: 13px; font-weight: 500; color: #333; margin-bottom: 6px; }
        .input { width: 100%; padding: 10px 14px; border: 1px solid #E0D9D0; border-radius: 8px; font-size: 14px; outline: none; box-sizing: border-box; }
        .input:focus { border-color: #40916C; }
        .btn-submit { width: 100%; background: #1B4332; color: #fff; border: none; border-radius: 8px; padding: 12px; font-size: 14px; font-weight: 600; cursor: pointer; margin-top: 8px; }
        .btn-submit:disabled { opacity: 0.6; }
        .error-box { background: #FDEDEC; color: #C0392B; border-radius: 8px; padding: 10px 14px; font-size: 13px; margin-bottom: 16px; }
        .auth-footer { font-size: 13px; color: #666; text-align: center; margin-top: 20px; }
        .auth-footer a { color: #1B4332; font-weight: 600; }
      `}</style>
    </div>
  )
}
