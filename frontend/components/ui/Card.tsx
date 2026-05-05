import React from 'react'

interface CardProps {
  children:  React.ReactNode
  padding?:  string
  style?:    React.CSSProperties
  className?: string
}

export function Card({ children, padding = '1.5rem', style, className }: CardProps) {
  return (
    <div
      className={className}
      style={{
        background:   'white',
        border:       '1px solid var(--gray-100)',
        borderRadius: 'var(--radius-md)',
        boxShadow:    'var(--shadow-card)',
        padding,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  title:    React.ReactNode
  action?:  React.ReactNode
  style?:   React.CSSProperties
}

export function CardHeader({ title, action, style }: CardHeaderProps) {
  return (
    <div
      style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        paddingBottom:  '1rem',
        marginBottom:   '1rem',
        borderBottom:   '1px solid var(--gray-100)',
        ...style,
      }}
    >
      <h2
        style={{
          fontFamily:    'var(--font-display)',
          fontSize:      '1.05rem',
          fontWeight:    600,
          color:         'var(--gray-900)',
          letterSpacing: '-.01em',
        }}
      >
        {title}
      </h2>
      {action && <div>{action}</div>}
    </div>
  )
}