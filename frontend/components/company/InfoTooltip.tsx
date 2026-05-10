"use client";

import {
  useId,
  useState,
} from "react";

interface InfoTooltipProps {
  text: string;
}

export function InfoTooltip({
  text,
}: InfoTooltipProps) {
  const tooltipId =
    useId();

  const [visible, setVisible] =
    useState(false);

  return (
    <span
      style={{
        position:
          "relative",

        display:
          "inline-flex",

        alignItems:
          "center",
      }}
      onMouseEnter={() =>
        setVisible(true)
      }
      onMouseLeave={() =>
        setVisible(false)
      }
      onFocus={() =>
        setVisible(true)
      }
      onBlur={() =>
        setVisible(false)
      }
    >
      <button
        type="button"
        aria-describedby={
          visible
            ? tooltipId
            : undefined
        }
        aria-label="More information"
        style={{
          display:
            "inline-flex",

          alignItems:
            "center",

          justifyContent:
            "center",

          width: 20,

          height: 20,

          borderRadius:
            "999px",

          border:
            "1px solid var(--gray-200)",

          background:
            "var(--white)",

          color:
            "var(--gray-400)",

          fontSize:
            ".72rem",

          fontWeight: 700,

          lineHeight: 1,

          cursor: "help",

          flexShrink: 0,

          transition:
            "all .15s ease",
        }}
      >
        ?
      </button>

      <span
        id={tooltipId}
        role="tooltip"
        aria-hidden={!visible}
        style={{
          position:
            "absolute",

          left:
            "calc(100% + .55rem)",

          top: "50%",

          transform:
            visible
              ? "translateY(-50%) scale(1)"
              : "translateY(-50%) scale(.98)",

          transformOrigin:
            "left center",

          minWidth: 220,

          maxWidth: 280,

          padding:
            ".7rem .8rem",

          borderRadius:
            "12px",

          background:
            "var(--gray-900)",

          color:
            "var(--white)",

          fontSize:
            ".78rem",

          lineHeight: 1.45,

          boxShadow:
            "0 12px 32px rgba(0,0,0,0.18)",

          opacity:
            visible
              ? 1
              : 0,

          visibility:
            visible
              ? "visible"
              : "hidden",

          pointerEvents:
            "none",

          transition:
            "opacity .15s ease, transform .15s ease, visibility .15s ease",

          zIndex: 20,

          whiteSpace:
            "normal",
        }}
      >
        {text}
      </span>
    </span>
  );
}