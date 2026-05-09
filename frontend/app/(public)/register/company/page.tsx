'use client'
// app/(public)/register/company/page.tsx

import { useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'

type Step = 1 | 2

const SECTORS = [
  'Grains & Cereals',
  'Fruits & Vegetables',
  'Agro-inputs & Distribution',
  'Livestock & Integrated',
  'Research & Extension',
  'Other',
]

export default function RegisterCompanyPage() {
  const [step, setStep] = useState<Step>(1)

  const [error, setError] = useState('')

  const [loading, setLoading] =
    useState(false)

  const [form, setForm] = useState({
    // company
    company_name: '',
    sector: '',
    country: '',

    // admin user
    full_name: '',
    email: '',
    password: '',
  })

  function update(
    field: keyof typeof form,
    value: string
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  function goNext(
    e: React.FormEvent
  ) {
    e.preventDefault()

    setError('')

    if (
      !form.company_name.trim() ||
      !form.sector ||
      !form.country.trim()
    ) {
      setError(
        'Please fill in all company details.'
      )

      return
    }

    setStep(2)
  }

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault()

    setError('')

    if (
      !form.full_name ||
      !form.email ||
      !form.password
    ) {
      setError(
        'Please fill in all fields.'
      )

      return
    }

    if (form.password.length < 8) {
      setError(
        'Password must be at least 8 characters.'
      )

      return
    }

    setLoading(true)

    try {
      /*
        1. REGISTER USER
      */

      const registerRes = await fetch(
        '/api/v1/auth/register',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            name: form.full_name,
            email: form.email,
            password: form.password,
          }),
        }
      )

      if (!registerRes.ok) {
        const data =
          await registerRes.json()

        throw new Error(
          data?.error?.message ||
            'Could not create account'
        )
      }

      const registerData =
        await registerRes.json()

      /*
        SAVE TOKENS
      */

      localStorage.setItem(
        'access_token',
        registerData.access_token
      )

      localStorage.setItem(
        'refresh_token',
        registerData.refresh_token
      )

      localStorage.setItem(
        'user',
        JSON.stringify(
          registerData.user
        )
      )

      localStorage.setItem(
        'role',
        registerData.user.role
      )

      /*
        2. CREATE COMPANY
      */

      const companyRes = await fetch(
        '/api/v1/companies',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',

            Authorization: `Bearer ${registerData.access_token}`,
          },

          body: JSON.stringify({
            name: form.company_name,
            sector: form.sector,
          }),
        }
      )

      if (!companyRes.ok) {
        const data =
          await companyRes.json()

        throw new Error(
          data?.error?.message ||
            'Could not create company'
        )
      }

      /*
        SUCCESS
      */

      window.location.href =
        '/dashboard'
    } catch (err: any) {
      setError(
        err.message ||
          'Something went wrong'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card auth-card--wide">
        <Logo />

        <h1 className="auth-title">
          Register your company
        </h1>

        <p className="auth-subtitle">
          Set up your agribusiness on
          CropSight
        </p>

        {/* STEP INDICATOR */}

        <div className="steps">
          <div
            className={`step ${
              step >= 1
                ? 'step--active'
                : ''
            } ${
              step > 1
                ? 'step--done'
                : ''
            }`}
          >
            {step > 1 ? (
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
              >
                <path
                  d="M2 6l3 3 5-5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              '1'
            )}
          </div>

          <div
            className={`step-line ${
              step > 1
                ? 'step-line--done'
                : ''
            }`}
          />

          <div
            className={`step ${
              step >= 2
                ? 'step--active'
                : ''
            }`}
          >
            2
          </div>
        </div>

        {error && (
          <div
            className="alert alert--error"
            role="alert"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <circle
                cx="8"
                cy="8"
                r="7"
                stroke="currentColor"
                strokeWidth="1.5"
              />

              <path
                d="M8 5v3.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />

              <circle
                cx="8"
                cy="11"
                r=".75"
                fill="currentColor"
              />
            </svg>

            {error}
          </div>
        )}

        {/* STEP 1 */}

        {step === 1 && (
          <form
            onSubmit={goNext}
            noValidate
          >
            <div className="form-group">
              <label
                className="form-label"
                htmlFor="company_name"
              >
                Company name
              </label>

              <input
                id="company_name"
                className="form-input"
                type="text"
                placeholder="Agro Farms S.A."
                value={form.company_name}
                onChange={(e) =>
                  update(
                    'company_name',
                    e.target.value
                  )
                }
                required
              />
            </div>

            <div className="form-group">
              <label
                className="form-label"
                htmlFor="sector"
              >
                Sector
              </label>

              <select
                id="sector"
                className="form-select"
                value={form.sector}
                onChange={(e) =>
                  update(
                    'sector',
                    e.target.value
                  )
                }
                required
              >
                <option value="">
                  Select a sector…
                </option>

                {SECTORS.map((s) => (
                  <option
                    key={s}
                    value={s}
                  >
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label
                className="form-label"
                htmlFor="country"
              >
                Country
              </label>

              <input
                id="country"
                className="form-input"
                type="text"
                placeholder="Mexico"
                value={form.country}
                onChange={(e) =>
                  update(
                    'country',
                    e.target.value
                  )
                }
                required
              />
            </div>

            <button
              className="btn btn--primary"
              type="submit"
              style={{
                marginTop: '.5rem',
              }}
            >
              Continue →
            </button>
          </form>
        )}

        {/* STEP 2 */}

        {step === 2 && (
          <form
            onSubmit={handleSubmit}
            noValidate
          >
            <div
              style={{
                background:
                  'var(--green-50)',

                border:
                  '1px solid var(--green-100)',

                borderRadius:
                  'var(--radius-sm)',

                padding: '.65rem .9rem',

                fontSize: '.82rem',

                color:
                  'var(--green-900)',

                marginBottom: '1.25rem',

                display: 'flex',

                alignItems: 'center',

                gap: '.5rem',
              }}
            >
              <span>🏢</span>

              <strong>
                {form.company_name}
              </strong>

              &nbsp;·&nbsp;
              {form.sector}
              &nbsp;·&nbsp;
              {form.country}

              <button
                type="button"
                onClick={() =>
                  setStep(1)
                }
                style={{
                  marginLeft: 'auto',

                  background: 'none',

                  border: 'none',

                  color:
                    'var(--green-800)',

                  cursor: 'pointer',

                  fontSize: '.78rem',

                  fontWeight: 500,

                  textDecoration:
                    'underline',
                }}
              >
                Edit
              </button>
            </div>

            <p
              className="auth-subtitle"
              style={{
                textAlign: 'left',
                marginBottom: '1rem',
                fontSize: '.85rem',
              }}
            >
              Now create your admin
              account
            </p>

            <div className="form-group">
              <label
                className="form-label"
                htmlFor="full_name"
              >
                Full name
              </label>

              <input
                id="full_name"
                className="form-input"
                type="text"
                placeholder="Jane Smith"
                value={form.full_name}
                onChange={(e) =>
                  update(
                    'full_name',
                    e.target.value
                  )
                }
                required
              />
            </div>

            <div className="form-group">
              <label
                className="form-label"
                htmlFor="email"
              >
                Work email
              </label>

              <input
                id="email"
                className="form-input"
                type="email"
                placeholder="jane@agrofarms.com"
                value={form.email}
                onChange={(e) =>
                  update(
                    'email',
                    e.target.value
                  )
                }
                required
              />
            </div>

            <div className="form-group">
              <label
                className="form-label"
                htmlFor="password"
              >
                Password
              </label>

              <input
                id="password"
                className="form-input"
                type="password"
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={(e) =>
                  update(
                    'password',
                    e.target.value
                  )
                }
                autoComplete="new-password"
                required
              />

              <span className="form-hint">
                You will be the company
                administrator
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '.75rem',
                marginTop: '.5rem',
              }}
            >
              <button
                type="button"
                className="btn btn--ghost"
                style={{
                  flex: '0 0 auto',
                  width: 'auto',
                  padding:
                    '.72rem 1.1rem',
                }}
                onClick={() =>
                  setStep(1)
                }
              >
                ← Back
              </button>

              <button
                className="btn btn--primary"
                type="submit"
                disabled={loading}
                style={{ flex: 1 }}
              >
                {loading
                  ? 'Creating company…'
                  : 'Create company'}
              </button>
            </div>
          </form>
        )}

        <p
          className="auth-footer"
          style={{ marginTop: '1rem' }}
        >
          Already registered?{' '}
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