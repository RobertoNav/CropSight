import React from 'react'

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const styles: Record<BadgeVariant, React.CSSProperties> = {
  default: { background: 'var(--gray-100)', color: 'var(--gray-600)' },
  success: { background: 'var(--green-100)', color: 'var(--green-800)' },
  warning: { background: '#fef9ec',          color: '#d68910'          },
  error:   { background: '#fdf2f2',          color: 'var(--error)'     },
  info:    { background: '#f0f6ff',          color: '#1a4480'          },
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 10px',
        borderRadius: '100px',
        fontSize: '.75rem',
        fontWeight: 600,
        lineHeight: 1.6,
        whiteSpace: 'nowrap',
        ...styles[variant],
      }}
    >
      {children}
    </span>
  )
}