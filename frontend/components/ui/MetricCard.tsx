import React from 'react'

interface MetricCardProps {
  label:    string
  value:    string | number
  sub?:     string
  /** Optional small trend indicator, e.g. "+12%" */
  trend?:   { label: string; up: boolean }
  icon?:    React.ReactNode
  style?:   React.CSSProperties
}

export function MetricCard({ label, value, sub, trend, icon, style }: MetricCardProps) {
  return (
    <div
      style={{
        background:   'white',
        border:       '1px solid var(--gray-100)',
        borderRadius: 'var(--radius-md)',
        boxShadow:    'var(--shadow-card)',
        padding:      '1.25rem 1.5rem',
        display:      'flex',
        flexDirection:'column',
        gap:          '.25rem',
        ...style,
      }}
    >
      {/* top row: label + optional icon */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.25rem' }}>
        <p
          style={{
            fontSize:      '.72rem',
            fontWeight:    600,
            color:         'var(--gray-400)',
            textTransform: 'uppercase',
            letterSpacing: '.07em',
          }}
        >
          {label}
        </p>
        {icon && (
          <span style={{ color: 'var(--green-700)', display: 'flex', alignItems: 'center' }}>
            {icon}
          </span>
        )}
      </div>

      {/* value */}
      <p
        style={{
          fontFamily:    'var(--font-display)',
          fontSize:      '2rem',
          fontWeight:    600,
          color:         'var(--gray-900)',
          lineHeight:    1,
          letterSpacing: '-.02em',
        }}
      >
        {value}
      </p>

      {/* sub + trend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginTop: '.15rem' }}>
        {sub && (
          <p style={{ fontSize: '.75rem', color: 'var(--gray-400)' }}>{sub}</p>
        )}
        {trend && (
          <span
            style={{
              fontSize:   '.72rem',
              fontWeight: 600,
              color:      trend.up ? 'var(--green-800)' : 'var(--error)',
            }}
          >
            {trend.up ? '↑' : '↓'} {trend.label}
          </span>
        )}
      </div>
    </div>
  )
}