import React from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'
type ButtonSize    = 'md' | 'sm'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  ButtonVariant
  size?:     ButtonSize
  loading?:  boolean
  fullWidth?: boolean
  children:  React.ReactNode
}

export function Button({
  variant   = 'primary',
  size      = 'md',
  loading   = false,
  fullWidth = true,
  children,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const variantClass = `btn--${variant}`
  const sizeClass    = size === 'sm' ? 'btn--sm' : ''

  return (
    <button
      className={`btn ${variantClass} ${sizeClass}`.trim()}
      disabled={disabled || loading}
      style={{ width: fullWidth ? '100%' : 'auto', opacity: (disabled || loading) ? .6 : 1, ...style }}
      {...props}
    >
      {loading ? (
        <>
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              border: '2px solid currentColor',
              borderTopColor: 'transparent',
              display: 'inline-block',
              animation: 'cs-spin .7s linear infinite',
            }}
          />
          <style>{`@keyframes cs-spin{to{transform:rotate(360deg)}}`}</style>
          Loading…
        </>
      ) : children}
    </button>
  )
}