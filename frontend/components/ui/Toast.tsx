'use client'

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

/* ─── Types ──────────────────────────────────────────────── */

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastItem {
  id:      string
  type:    ToastType
  message: string
  duration?: number   // ms, default 4000
}

/* ─── Context ────────────────────────────────────────────── */

interface ToastContextValue {
  toast: (message: string, type?: ToastType, duration?: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

/* ─── Provider ───────────────────────────────────────────── */

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const t = timers.current.get(id)
    if (t) { clearTimeout(t); timers.current.delete(id) }
  }, [])

  const toast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, type, message, duration }])
    const t = setTimeout(() => remove(id), duration)
    timers.current.set(id, t)
  }, [remove])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Portal-like stack — fixed bottom-right */}
      <div
        aria-live="polite"
        style={{
          position:      'fixed',
          bottom:        '1.5rem',
          right:         '1.5rem',
          zIndex:        9999,
          display:       'flex',
          flexDirection: 'column',
          gap:           '.5rem',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => (
          <ToastBubble key={t.id} item={t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

/* ─── Hook ───────────────────────────────────────────────── */

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx.toast
}

/* ─── Individual bubble ──────────────────────────────────── */

const toastConfig: Record<ToastType, { bg: string; color: string; border: string; icon: string }> = {
  success: { bg: 'var(--green-50)',  color: 'var(--green-900)', border: '#b7d9b7', icon: '✓' },
  error:   { bg: '#fdf2f2',         color: '#922b21',          border: '#f5c6c6', icon: '✕' },
  warning: { bg: '#fef9ec',         color: '#7d5a0b',          border: '#f5dfa0', icon: '!' },
  info:    { bg: '#f0f6ff',         color: '#1a4480',          border: '#bdd4f5', icon: 'i' },
}

function ToastBubble({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const [visible, setVisible] = useState(false)
  const cfg = toastConfig[item.type]

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  return (
    <>
      <style>{`@keyframes cs-slidein{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:none}}`}</style>
      <div
        role="alert"
        style={{
          pointerEvents:  'auto',
          display:        'flex',
          alignItems:     'flex-start',
          gap:            '.6rem',
          padding:        '.75rem 1rem',
          borderRadius:   'var(--radius-md)',
          border:         `1px solid ${cfg.border}`,
          background:     cfg.bg,
          color:          cfg.color,
          fontSize:       '.875rem',
          maxWidth:       340,
          boxShadow:      'var(--shadow-card)',
          animation:      'cs-slidein .2s ease both',
          transition:     'opacity .2s',
          opacity:        visible ? 1 : 0,
        }}
      >
        {/* Icon circle */}
        <span
          style={{
            width:        20,
            height:       20,
            borderRadius: '50%',
            border:       `1.5px solid ${cfg.color}`,
            display:      'flex',
            alignItems:   'center',
            justifyContent:'center',
            fontSize:     '.65rem',
            fontWeight:   700,
            flexShrink:   0,
            marginTop:    1,
          }}
        >
          {cfg.icon}
        </span>

        <span style={{ flex: 1, lineHeight: 1.5 }}>{item.message}</span>

        <button
          onClick={onClose}
          aria-label="Dismiss"
          style={{
            background:  'none',
            border:      'none',
            cursor:      'pointer',
            color:       cfg.color,
            opacity:     .6,
            fontSize:    '1rem',
            lineHeight:  1,
            padding:     0,
            flexShrink:  0,
          }}
        >
          ×
        </button>
      </div>
    </>
  )
}