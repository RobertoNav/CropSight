'use client'
// app/(public)/register/page.tsx

import { useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'

export default function RegisterPage() {
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fd.get('full_name'),
          email: fd.get('email'),
          password,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        document.cookie = `access_token=${data.access_token}; path=/`
        document.cookie = `refresh_token=${data.refresh_token}; path=/`
        window.location.href = '/dashboard'
      }
      window.location.href = '/dashboard'
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
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Start diagnosing crop diseases today</p>

        {error && (
          <div className="alert alert--error" role="alert">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 5v3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="8" cy="11" r=".75" fill="currentColor"/>
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="full_name">Full name</label>
            <input
              id="full_name"
              className="form-input"
              type="text"
              name="full_name"
              placeholder="Jane Smith"
              autoComplete="name"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email address</label>
            <input
              id="email"
              className="form-input"
              type="email"
              name="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
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
                aria-label={showPass ? 'Hide password' : 'Show password'}>
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
            <label className="form-label" htmlFor="confirm">Confirm password</label>
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
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <div className="divider">or</div>

        <Link href="/register/company" className="btn btn--secondary">
          Register a company instead
        </Link>

        <p className="auth-footer" style={{ marginTop: '1rem' }}>
          Already have an account?{' '}
          <Link href="/login" className="link">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
