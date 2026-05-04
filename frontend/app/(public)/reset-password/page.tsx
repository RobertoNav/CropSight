'use client'
// app/(public)/reset-password/page.tsx

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Logo } from '@/components/ui/Logo'

export default function ResetPasswordPage() {
  const params = useSearchParams()
  const token = params.get('token') ?? ''
  const [done, setDone] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <Logo />
          <div className="alert alert--error" style={{ marginTop: '1rem' }}>
            Invalid or missing reset token. Please request a new link.
          </div>
          <p className="auth-footer">
            <Link href="/forgot-password" className="link">Request new link</Link>
          </p>
        </div>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    const password = fd.get('password') as string
    const confirm  = fd.get('confirm') as string
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Reset failed. The link may have expired.')
      }
      setDone(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Logo />

        {!done ? (
          <>
            <h1 className="auth-title">Set new password</h1>
            <p className="auth-subtitle">Choose a strong password for your account</p>

            {error && (
              <div className="alert alert--error">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M8 5v3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="8" cy="11" r=".75" fill="currentColor"/>
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="password">New password</label>
                <div className="input-wrapper">
                  <input
                    id="password"
                    className="form-input"
                    type={showPass ? 'text' : 'password'}
                    name="password"
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
                    required
                  />
                  <button type="button" className="input-toggle"
                    onClick={() => setShowPass(p => !p)}
                    aria-label={showPass ? 'Hide' : 'Show'}>
                    {showPass ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="confirm">Confirm new password</label>
                <input
                  id="confirm"
                  className="form-input"
                  type="password"
                  name="confirm"
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  required
                />
              </div>

              <button className="btn btn--primary" type="submit" disabled={loading}
                style={{ marginTop: '.25rem' }}>
                {loading ? 'Saving…' : 'Set new password'}
              </button>
            </form>
          </>
        ) : (
          <>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'var(--green-100)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem'
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--green-800)" strokeWidth="2">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>
            <h1 className="auth-title">Password updated</h1>
            <p className="auth-subtitle">Your password has been changed successfully.</p>
            <Link href="/login" className="btn btn--primary" style={{ marginTop: '.5rem', display: 'flex' }}>
              Sign in now
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
