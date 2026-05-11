// components/admin/AdminModels.tsx

"use client";

import Link from "next/link";
import { MetricCard } from "@/components/ui/MetricCard";

const models = [
  {
    version: "v2.3",
    name: "ResNet50 Tomato",
    stage: "production",
    accuracy: "94.8%",
    drift: "Low",
    updated: "2 hours ago",
  },
  {
    version: "v2.2",
    name: "EfficientNet Corn",
    stage: "staging",
    accuracy: "92.1%",
    drift: "Moderate",
    updated: "Yesterday",
  },
  {
    version: "v1.9",
    name: "Potato Blight CNN",
    stage: "archived",
    accuracy: "88.7%",
    drift: "High",
    updated: "5 days ago",
  },
] as const;

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

export function AdminModels() {
  return (
    <div
      style={{
        display: "grid",
        gap: "1.5rem",
      }}
    >
      {/* header */}
      <section>
        <p
          style={{
            ...labelStyle,
            color: "var(--green-800)",
            marginBottom: ".55rem",
          }}
        >
          ML registry
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
          Registered models
        </h1>

        <p
          style={{
            color: "var(--gray-600)",
            maxWidth: 760,
            lineHeight: 1.8,
            fontSize: ".98rem",
          }}
        >
          Review MLflow registry versions, promote models to
          production, monitor drift, and supervise deployment
          health across the platform.
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
          label="Production models"
          value="4"
          sub="Currently deployed"
          icon={<span>🧠</span>}
        />

        <MetricCard
          label="Registry versions"
          value="18"
          sub="Tracked in MLflow"
          icon={<span>📦</span>}
        />

        <MetricCard
          label="Best accuracy"
          value="94.8%"
          sub="ResNet50 Tomato"
          icon={<span>🎯</span>}
        />

        <MetricCard
          label="Drift alerts"
          value="2"
          sub="Require review"
          icon={<span>⚠️</span>}
        />
      </section>

      {/* table */}
      <section style={sectionCardStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
            marginBottom: "1.4rem",
            flexWrap: "wrap",
          }}
        >
          <div>
            <p
              style={{
                ...labelStyle,
                color: "var(--green-800)",
                marginBottom: ".35rem",
              }}
            >
              Registry
            </p>

            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.7rem",
                fontWeight: 400,
                letterSpacing: "-.03em",
              }}
            >
              Model versions
            </h2>
          </div>

          <button className="btn btn--primary btn--sm">
            Register model
          </button>
        </div>

        <div
          style={{
            overflowX: "auto",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid var(--gray-100)",
                }}
              >
                {[
                  "Model",
                  "Stage",
                  "Accuracy",
                  "Drift",
                  "Updated",
                  "",
                ].map((item) => (
                  <th
                    key={item}
                    style={{
                      textAlign: "left",
                      padding: "1rem",
                      fontSize: ".75rem",
                      color: "var(--gray-400)",
                      textTransform: "uppercase",
                      letterSpacing: ".08em",
                      fontWeight: 600,
                    }}
                  >
                    {item}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {models.map((model) => (
                <tr
                  key={model.version}
                  style={{
                    borderBottom: "1px solid var(--gray-100)",
                  }}
                >
                  <td
                    style={{
                      padding: "1rem",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontWeight: 600,
                          color: "var(--gray-900)",
                          marginBottom: ".2rem",
                        }}
                      >
                        {model.name}
                      </p>

                      <span
                        style={{
                          fontSize: ".82rem",
                          color: "var(--gray-400)",
                        }}
                      >
                        {model.version}
                      </span>
                    </div>
                  </td>

                  <td
                    style={{
                      padding: "1rem",
                    }}
                  >
                    <StagePill stage={model.stage} />
                  </td>

                  <td
                    style={{
                      padding: "1rem",
                      fontWeight: 600,
                      color: "var(--green-800)",
                    }}
                  >
                    {model.accuracy}
                  </td>

                  <td
                    style={{
                      padding: "1rem",
                    }}
                  >
                    <DriftPill drift={model.drift} />
                  </td>

                  <td
                    style={{
                      padding: "1rem",
                      color: "var(--gray-400)",
                    }}
                  >
                    {model.updated}
                  </td>

                  <td
                    style={{
                      padding: "1rem",
                    }}
                  >
                    <Link
                      href={`/admin/models/${model.version}`}
                      className="link"
                      style={{
                        fontSize: ".88rem",
                      }}
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StagePill({
  stage,
}: {
  stage: "production" | "staging" | "archived";
}) {
  const tones = {
    production: {
      bg: "var(--green-100)",
      color: "var(--green-800)",
      label: "Production",
    },
    staging: {
      bg: "#eef7ff",
      color: "#1a4480",
      label: "Staging",
    },
    archived: {
      bg: "var(--gray-100)",
      color: "var(--gray-600)",
      label: "Archived",
    },
  };

  const tone = tones[stage];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: ".4rem .7rem",
        borderRadius: "999px",
        background: tone.bg,
        color: tone.color,
        fontSize: ".78rem",
        fontWeight: 600,
      }}
    >
      {tone.label}
    </span>
  );
}

function DriftPill({
  drift,
}: {
  drift: "Low" | "Moderate" | "High";
}) {
  const tones = {
    Low: {
      bg: "var(--green-100)",
      color: "var(--green-800)",
    },
    Moderate: {
      bg: "#fff7e6",
      color: "var(--warning)",
    },
    High: {
      bg: "#fdf2f2",
      color: "var(--error)",
    },
  };

  const tone = tones[drift];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: ".4rem .7rem",
        borderRadius: "999px",
        background: tone.bg,
        color: tone.color,
        fontSize: ".78rem",
        fontWeight: 600,
      }}
    >
      {drift}
    </span>
  );
}