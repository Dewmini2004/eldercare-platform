'use client'
import { useState } from 'react'
import { authApi } from '@/lib/api/client'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await authApi.login(email, password)
      const { accessToken, refreshToken, user } = res.data.data
      localStorage.setItem('eldercare_token', accessToken)
      localStorage.setItem('eldercare_refresh', refreshToken)
      localStorage.setItem('eldercare_role', user.role)
      window.location.href = `/dashboard/${user.role === 'home_admin' ? 'home-admin' : user.role}`
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">ElderCare Sri Lanka</div>
        <h1 className="auth-title">Sign in</h1>
        {error && <div className="error-box">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div className="field">
            <label className="label">Password</label>
            <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <button className="btn-submit" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <p className="auth-footer">Don't have an account? <Link href="/register">Register</Link></p>
      </div>
      <style>{`
        .auth-page { min-height: 100vh; background: #F8F4EF; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .auth-card { background: #fff; border: 1px solid #E0D9D0; border-radius: 14px; padding: 40px; width: 100%; max-width: 400px; }
        .auth-logo { font-size: 13px; color: #1B4332; font-weight: 700; margin-bottom: 24px; }
        .auth-title { font-size: 24px; font-weight: 700; color: #1B4332; margin: 0 0 24px; }
        .field { margin-bottom: 16px; }
        .label { display: block; font-size: 13px; font-weight: 500; color: #333; margin-bottom: 6px; }
        .input { width: 100%; padding: 10px 14px; border: 1px solid #E0D9D0; border-radius: 8px; font-size: 14px; outline: none; box-sizing: border-box; }
        .input:focus { border-color: #40916C; }
        .btn-submit { width: 100%; background: #1B4332; color: #fff; border: none; border-radius: 8px; padding: 12px; font-size: 14px; font-weight: 600; cursor: pointer; margin-top: 8px; }
        .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        .error-box { background: #FDEDEC; color: #C0392B; border-radius: 8px; padding: 10px 14px; font-size: 13px; margin-bottom: 16px; }
        .auth-footer { font-size: 13px; color: #666; text-align: center; margin-top: 20px; }
        .auth-footer a { color: #1B4332; font-weight: 600; }
      `}</style>
    </div>
  )
}
