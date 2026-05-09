'use client'
// app/(public)/company/join/page.tsx

import { useState, useEffect } from 'react'
import Link from 'next/link'

import { Logo } from '@/components/ui/Logo'

import {
  joinCompany,
  searchCompanies,
  type Company,
} from '@/services/company.service'

export default function JoinCompanyPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Company[]>([])
  const [selected, setSelected] =
    useState<Company | null>(null)

  const [message, setMessage] = useState('')

  const [submitted, setSubmitted] =
    useState(false)

  const [loading, setLoading] =
    useState(false)

  const [searching, setSearching] =
    useState(false)

  const [error, setError] = useState('')

  /* ───────────────── SEARCH ───────────────── */

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      return
    }

    const t = setTimeout(async () => {
      setSearching(true)

      try {
        const data =
          await searchCompanies(query)

        setResults(
          Array.isArray(data)
            ? data
            : []
        )
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 350)

    return () => clearTimeout(t)
  }, [query])

  /* ───────────────── SUBMIT ───────────────── */

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault()

    if (!selected) {
      setError(
        'Please select a company.'
      )

      return
    }

    setError('')
    setLoading(true)

    try {
      await joinCompany(
        selected.id
      )

      setSubmitted(true)
    } catch (err: any) {
      console.error(err)

      setError(
        err?.response?.data?.error
          ?.message ||
          'Request failed'
      )
    } finally {
      setLoading(false)
    }
  }

  /* ───────────────── HELPERS ───────────────── */

  function initials(name: string) {
    return name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
  }

  return (
    <div className="auth-page">
      <div className="auth-card auth-card--wide">
        <Logo />

        {!submitted ? (
          <>
            <h1 className="auth-title">
              Join a company
            </h1>

            <p className="auth-subtitle">
              Search for your agribusiness
              and send a join request to
              the admin
            </p>

            {error && (
              <div className="alert alert--error">
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

            <form
              onSubmit={handleSubmit}
              noValidate
            >
              {/* SEARCH */}
              <div className="form-group">
                <label
                  className="form-label"
                  htmlFor="search"
                >
                  Search company
                </label>

                <div
                  style={{
                    position: 'relative',
                  }}
                >
                  <input
                    id="search"
                    className="form-input"
                    type="text"
                    placeholder="Type company name…"
                    value={query}
                    onChange={(e) => {
                      setQuery(
                        e.target.value
                      )

                      setSelected(
                        null
                      )
                    }}
                    autoComplete="off"
                  />

                  {searching && (
                    <span
                      style={{
                        position:
                          'absolute',

                        right: '.75rem',

                        top: '50%',

                        transform:
                          'translateY(-50%)',

                        fontSize: '.75rem',

                        color:
                          'var(--gray-400)',
                      }}
                    >
                      Searching…
                    </span>
                  )}
                </div>
              </div>

              {/* RESULTS */}
              {results.length > 0 &&
                !selected && (
                  <div
                    style={{
                      marginBottom:
                        '1rem',
                    }}
                  >
                    {results.map(
                      (c) => (
                        <div
                          key={c.id}
                          className="company-card"
                          onClick={() => {
                            setSelected(
                              c
                            )

                            setQuery(
                              c.name
                            )
                          }}
                        >
                          <div className="company-avatar">
                            {initials(
                              c.name
                            )}
                          </div>

                          <div className="company-info">
                            <div className="company-name">
                              {c.name}
                            </div>

                            <div className="company-meta">
                              {
                                c.sector
                              }
                            </div>
                          </div>

                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                          >
                            <path
                              d="M6 4l4 4-4 4"
                              stroke="var(--gray-400)"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                          </svg>
                        </div>
                      )
                    )}
                  </div>
                )}

              {/* SELECTED */}
              {selected && (
                <div
                  className="company-card company-card--selected"
                  style={{
                    marginBottom:
                      '1rem',

                    cursor:
                      'default',
                  }}
                >
                  <div className="company-avatar">
                    {initials(
                      selected.name
                    )}
                  </div>

                  <div className="company-info">
                    <div className="company-name">
                      {selected.name}
                    </div>

                    <div className="company-meta">
                      {
                        selected.sector
                      }
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelected(
                        null
                      )

                      setQuery('')
                    }}
                    style={{
                      background:
                        'none',

                      border: 'none',

                      cursor:
                        'pointer',

                      color:
                        'var(--gray-400)',

                      padding: 0,
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                    >
                      <path
                        d="M4 4l8 8M12 4l-8 8"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>
              )}

              {/* MESSAGE */}
              <div className="form-group">
                <label
                  className="form-label"
                  htmlFor="message"
                >
                  Message to admin{' '}
                  <span
                    style={{
                      color:
                        'var(--gray-400)',

                      fontWeight: 400,
                    }}
                  >
                    (optional)
                  </span>
                </label>

                <textarea
                  id="message"
                  className="form-textarea"
                  placeholder="Briefly explain why you want to join…"
                  value={message}
                  onChange={(e) =>
                    setMessage(
                      e.target.value
                    )
                  }
                  maxLength={280}
                />

                <span className="form-hint">
                  {message.length}/280
                </span>
              </div>

              <button
                className="btn btn--primary"
                type="submit"
                disabled={
                  loading ||
                  !selected
                }
              >
                {loading
                  ? 'Sending request…'
                  : 'Send join request'}
              </button>
            </form>

            <div className="divider">
              or
            </div>

            <Link
              href="/register/company"
              className="btn btn--secondary"
            >
              Register a new company
            </Link>
          </>
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '1rem 0',
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background:
                  'var(--green-100)',

                display: 'flex',

                alignItems: 'center',

                justifyContent:
                  'center',

                margin:
                  '0 auto 1.25rem',
              }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--green-800)"
                strokeWidth="2"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>

            <h1 className="auth-title">
              Request sent!
            </h1>

            <p className="auth-subtitle">
              Your request to join{' '}
              <strong>
                {selected?.name}
              </strong>{' '}
              has been submitted.
              The company admin will
              review and approve it
              shortly.
            </p>

            <Link
              href="/dashboard"
              className="btn btn--primary"
              style={{
                marginTop: '1rem',
                display: 'flex',
              }}
            >
              Go to dashboard
            </Link>
          </div>
        )}

        <p className="auth-footer">
          <Link
            href="/dashboard"
            className="link"
          >
            ← Back to dashboard
          </Link>
        </p>
      </div>
    </div>
  )
}