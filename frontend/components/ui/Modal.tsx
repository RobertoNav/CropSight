"use client";

import React, { useEffect } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** 'sm' = 420px | 'md' = 560px (default) | 'lg' = 720px */
  size?: "sm" | "md" | "lg";
  /** Footer slot — typically action buttons */
  footer?: React.ReactNode;
}

const widths = { sm: 420, md: 560, lg: 720 };

export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
  footer,
}: ModalProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(28,28,26,.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        backdropFilter: "blur(2px)",
        animation: "cs-fade .15s ease both",
      }}
    >
      <style>{`
        @keyframes cs-fade { from { opacity:0 } to { opacity:1 } }
        @keyframes cs-up   { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:none } }
      `}</style>

      {/* Dialog panel — stop propagation so clicking inside doesn't close */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          borderRadius: "var(--radius-lg)",
          boxShadow: "0 8px 40px rgba(0,0,0,.18)",
          width: "100%",
          maxWidth: widths[size],
          maxHeight: "calc(100vh - 4rem)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          animation: "cs-up .2s ease both",
        }}
      >
        {/* Header */}
        {title && (
          <div
            style={{
              padding: "1.25rem 1.5rem",
              borderBottom: "1px solid var(--gray-100)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <h2
              id="modal-title"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.15rem",
                fontWeight: 400,
                color: "var(--gray-900)",
                letterSpacing: "-.02em",
              }}
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--gray-400)",
                fontSize: "1.3rem",
                lineHeight: 1,
                padding: "2px 4px",
                borderRadius: "var(--radius-sm)",
                transition: "color .15s",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.color =
                  "var(--gray-900)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.color =
                  "var(--gray-400)")
              }
            >
              ×
            </button>
          </div>
        )}

        {/* Body */}
        <div
          style={{
            padding: "1.5rem",
            overflowY: "auto",
            overflowX: "hidden",
            minWidth: 0,
            flex: 1,
          }}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            style={{
              padding: "1rem 1.5rem",
              borderTop: "1px solid var(--gray-100)",
              display: "flex",
              gap: ".75rem",
              flexWrap: "wrap",
              justifyContent: "flex-end",
              flexShrink: 0,
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
