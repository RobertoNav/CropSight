import React from 'react'

interface LoadingSpinnerProps {
  size?:  number   // px
  color?: string
  /** Centers inside its container */
  centered?: boolean
}

export function LoadingSpinner({ size = 28, color = 'var(--green-800)', centered = false }: LoadingSpinnerProps) {
  const spinner = (
    <>
      <style>{`@keyframes cs-spin{to{transform:rotate(360deg)}}`}</style>
      <span
        role="status"
        aria-label="Loading"
        style={{
          display:      'inline-block',
          width:        size,
          height:       size,
          borderRadius: '50%',
          border:       `2.5px solid ${color}22`,
          borderTopColor: color,
          animation:    'cs-spin .7s linear infinite',
          flexShrink:   0,
        }}
      />
    </>
  )

  if (centered) {
    return (
      <div
        style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          padding:        '3rem',
        }}
      >
        {spinner}
      </div>
    )
  }

  return spinner
}