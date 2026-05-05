import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?:   string
  error?:   string
  hint?:    string
  /** Icon shown on the left — pass any React node (e.g. an SVG) */
  iconLeft?: React.ReactNode
}

export function Input({ label, error, hint, iconLeft, id, style, className, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="form-group" style={{ marginBottom: 0 }}>
      {label && (
        <label className="form-label" htmlFor={inputId}>
          {label}
        </label>
      )}

      <div className="input-wrapper">
        {iconLeft && (
          <span
            style={{
              position:  'absolute',
              left:      '.75rem',
              top:       '50%',
              transform: 'translateY(-50%)',
              color:     'var(--gray-400)',
              display:   'flex',
              alignItems:'center',
              pointerEvents: 'none',
            }}
          >
            {iconLeft}
          </span>
        )}
        <input
          id={inputId}
          className={`form-input ${error ? 'form-input--error' : ''} ${className ?? ''}`}
          style={{ paddingLeft: iconLeft ? '2.4rem' : undefined, ...style }}
          {...props}
        />
      </div>

      {error && <p className="form-error">{error}</p>}
      {hint && !error && <p className="form-hint">{hint}</p>}
    </div>
  )
}