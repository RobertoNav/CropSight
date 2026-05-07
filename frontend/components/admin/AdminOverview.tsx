// components/admin/AdminOverview.tsx

"use client";

import Link from "next/link";
import { MetricCard } from "@/components/ui/MetricCard";

const sectionCardStyle: React.CSSProperties = {
  background: "var(--white)",
  borderRadius: "20px",
  border: "1px solid rgba(45,106,45,0.08)",
  boxShadow: "var(--shadow-card)",
  padding: "1.4rem",
};

const labelStyle: React.CSSProperties = {
  fontSize: ".75rem",
  color: "var(--gray-400)",
  textTransform: "uppercase",
  letterSpacing: ".08em",
  fontWeight: 600,
};

const activity = [
  {
    title: "New model promoted",
    desc: "resnet50-v2.3 was promoted to production.",
    time: "2 hours ago",
  },
  {
    title: "Retraining completed",
    desc: "Nightly tomato disease retraining finished successfully.",
    time: "5 hours ago",
  },
  {
    title: "Company registered",
    desc: "AgroVision joined the platform.",
    time: "Yesterday",
  },
];

const quickLinks = [
  {
    title: "Manage models",
    href: "/admin/models",
    icon: "🧠",
  },
  {
    title: "Review experiments",
    href: "/admin/experiments",
    icon: "🧪",
  },
  {
    title: "Platform metrics",
    href: "/admin/metrics",
    icon: "📊",
  },
  {
    title: "Retraining jobs",
    href: "/admin/retraining",
    icon: "🔄",
  },
];

export function AdminOverview() {
  return (
    <div
      style={{
        display: "grid",
        gap: "1.5rem",
      }}
    >
      {/* page header */}
      <section>
        <p
          style={{
            ...labelStyle,
            color: "var(--green-800)",
            marginBottom: ".55rem",
          }}
        >
          Super admin
        </p>

        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "3rem",
            lineHeight: 1,
            letterSpacing: "-.04em",
            fontWeight: 400,
            marginBottom: ".9rem",
          }}
        >
          Platform control center
        </h1>

        <p
          style={{
            color: "var(--gray-600)",
            maxWidth: 760,
            lineHeight: 1.8,
            fontSize: ".98rem",
          }}
        >
          Monitor ML performance, manage companies, review
          experiments, and supervise platform-wide operations from
          one centralized workspace.
        </p>
      </section>

      {/* metrics */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
        }}
      >
        <MetricCard
          label="Active companies"
          value="24"
          sub="4 added this month"
          icon={<span>🏢</span>}
        />

        <MetricCard
          label="Predictions today"
          value="18,420"
          sub="Across all companies"
          icon={<span>🌿</span>}
        />

        <MetricCard
          label="Production model"
          value="v2.3"
          sub="ResNet50 production"
          icon={<span>🧠</span>}
        />

        <MetricCard
          label="Training jobs"
          value="3"
          sub="Currently running"
          icon={<span>⚡</span>}
        />
      </section>

      {/* quick actions + activity */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1.1fr .9fr",
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        {/* quick actions */}
        <div style={sectionCardStyle}>
          <div style={{ marginBottom: "1.25rem" }}>
            <p
              style={{
                ...labelStyle,
                color: "var(--green-800)",
                marginBottom: ".45rem",
              }}
            >
              Navigation
            </p>

            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.7rem",
                fontWeight: 400,
                letterSpacing: "-.03em",
              }}
            >
              Quick actions
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1rem",
            }}
          >
            {quickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  borderRadius: "18px",
                  border: "1px solid var(--gray-100)",
                  background: "var(--gray-50)",
                  padding: "1.2rem",
                  textDecoration: "none",
                  transition: ".15s ease",
                  display: "grid",
                  gap: ".65rem",
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: "12px",
                    background: "var(--green-100)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.2rem",
                  }}
                >
                  {item.icon}
                </div>

                <div>
                  <p
                    style={{
                      fontWeight: 600,
                      color: "var(--gray-900)",
                      marginBottom: ".25rem",
                    }}
                  >
                    {item.title}
                  </p>

                  <p
                    style={{
                      fontSize: ".85rem",
                      color: "var(--gray-400)",
                    }}
                  >
                    Open workspace →
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* activity */}
        <div style={sectionCardStyle}>
          <div style={{ marginBottom: "1.25rem" }}>
            <p
              style={{
                ...labelStyle,
                color: "var(--green-800)",
                marginBottom: ".45rem",
              }}
            >
              Activity
            </p>

            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.7rem",
                fontWeight: 400,
                letterSpacing: "-.03em",
              }}
            >
              Recent platform events
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gap: "1rem",
            }}
          >
            {activity.map((item, index) => (
              <div
                key={index}
                style={{
                  paddingBottom: "1rem",
                  borderBottom:
                    index !== activity.length - 1
                      ? "1px solid var(--gray-100)"
                      : "none",
                }}
              >
                <p
                  style={{
                    fontWeight: 600,
                    color: "var(--gray-900)",
                    marginBottom: ".25rem",
                  }}
                >
                  {item.title}
                </p>

                <p
                  style={{
                    fontSize: ".9rem",
                    color: "var(--gray-600)",
                    lineHeight: 1.7,
                    marginBottom: ".4rem",
                  }}
                >
                  {item.desc}
                </p>

                <span
                  style={{
                    fontSize: ".78rem",
                    color: "var(--gray-400)",
                  }}
                >
                  {item.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}