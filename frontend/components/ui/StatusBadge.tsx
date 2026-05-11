import React from 'react'

type Status = 'high' | 'medium' | 'low' | 'pending' | 'error'

interface StatusBadgeProps {
  status:   Status
  label?:   string   // override text; defaults to the status name
  showDot?: boolean
}

const config: Record<Status, { bg: string; color: string; defaultLabel: string }> = {
  high:    { bg: 'var(--green-100)', color: 'var(--green-800)', defaultLabel: 'High'    },
  medium:  { bg: '#fef9ec',          color: '#d68910',          defaultLabel: 'Medium'  },
  low:     { bg: '#fdf2f2',          color: 'var(--error)',      defaultLabel: 'Low'     },
  pending: { bg: 'var(--gray-100)', color: 'var(--gray-600)',   defaultLabel: 'Pending' },
  error:   { bg: '#fdf2f2',          color: 'var(--error)',      defaultLabel: 'Error'   },
}

export function StatusBadge({ status, label, showDot = true }: StatusBadgeProps) {
  const { bg, color, defaultLabel } = config[status]

  return (
    <span
      style={{
        display:     'inline-flex',
        alignItems:  'center',
        gap:         '5px',
        padding:     '3px 10px',
        borderRadius:'100px',
        fontSize:    '.75rem',
        fontWeight:  600,
        background:  bg,
        color,
        whiteSpace:  'nowrap',
      }}
    >
      {showDot && (
        <span
          style={{
            width:        6,
            height:       6,
            borderRadius: '50%',
            background:   color,
            flexShrink:   0,
          }}
        />
      )}
      {label ?? defaultLabel}
    </span>
  )
}

/**
 * Derive a Status from a numeric confidence score (0–100).
 *   ≥ 80  → high
 *   ≥ 60  → medium
 *   < 60  → low
 */
export function confidenceToStatus(score: number): Status {
  if (score >= 80) return 'high'
  if (score >= 60) return 'medium'
  return 'low'
}