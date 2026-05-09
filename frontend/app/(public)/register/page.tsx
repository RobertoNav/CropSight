'use client'

import { useState } from 'react'
import Link from 'next/link'

import { Logo } from '@/components/ui/Logo'

import {
  register,
} from '@/services/auth.service'

import {
  useAuth,
} from '@/context/AuthContext'

export default function RegisterPage() {
  const { login } = useAuth()

  const [showPass, setShowPass] =
    useState(false)

  const [error, setError] =
    useState('')

  const [loading, setLoading] =
    useState(false)

  /* ───────────────── SUBMIT ───────────────── */

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault()

    setError('')

    const fd = new FormData(
      e.currentTarget
    )

    const password = fd.get(
      'password'
    ) as string

    const confirm = fd.get(
      'confirm'
    ) as string

    /* VALIDATIONS */

    if (password !== confirm) {
      setError(
        'Passwords do not match.'
      )

      return
    }

    if (password.length < 8) {
      setError(
        'Password must be at least 8 characters.'
      )

      return
    }

    setLoading(true)

    try {
      const data =
        await register({
          name: fd.get(
            'full_name'
          ) as string,

          email: fd.get(
            'email'
          ) as string,

          password,
        })

      /*
        guarda auth
      */

      login({
        access_token:
          data.access_token,

        refresh_token:
          data.refresh_token,

        user: data.user,
      })

      /*
        redirect según role
      */

      if (
        data.user.role ===
        'super_admin'
      ) {
        window.location.href =
          '/admin'
      } else if (
        data.user.role ===
        'company_admin'
      ) {
        window.location.href =
          '/company'
      } else {
        window.location.href =
          '/dashboard'
      }
    } catch (err: any) {
      console.error(err)

      setError(
        err?.response?.data?.error
          ?.message ||
          'Something went wrong'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Logo />

        <h1 className="auth-title">
          Create your account
        </h1>

        <p className="auth-subtitle">
          Start diagnosing crop
          diseases today
        </p>

        {error && (
          <div className="alert alert--error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* FULL NAME */}

          <div className="form-group">
            <label className="form-label">
              Full name
            </label>

            <input
              className="form-input"
              name="full_name"
              required
            />
          </div>

          {/* EMAIL */}

          <div className="form-group">
            <label className="form-label">
              Email
            </label>

            <input
              className="form-input"
              type="email"
              name="email"
              required
            />
          </div>

          {/* PASSWORD */}

          <div className="form-group">
            <label className="form-label">
              Password
            </label>

            <div className="input-wrapper">
              <input
                className="form-input"
                type={
                  showPass
                    ? 'text'
                    : 'password'
                }
                name="password"
                required
              />

              <button
                type="button"
                className="input-toggle"
                onClick={() =>
                  setShowPass(
                    !showPass
                  )
                }
              >
                👁
              </button>
            </div>
          </div>

          {/* CONFIRM */}

          <div className="form-group">
            <label className="form-label">
              Confirm password
            </label>

            <input
              className="form-input"
              type="password"
              name="confirm"
              required
            />
          </div>

          {/* SUBMIT */}

          <button
            className="btn btn--primary"
            disabled={loading}
            type="submit"
          >
            {loading
              ? 'Creating account...'
              : 'Create account'}
          </button>
        </form>

        <div className="divider">
          or
        </div>

        <Link
          href="/register/company"
          className="btn btn--secondary"
        >
          Register a company instead
        </Link>

        <p className="auth-footer">
          Already have an account?{' '}
          <Link
            href="/login"
            className="link"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}