// components/user/UserPredictions.tsx

"use client";

import Link from "next/link";
import { MetricCard } from "@/components/ui/MetricCard";

const sectionCardStyle: React.CSSProperties = {
  background: "var(--white)",
  borderRadius: "20px",
  border: "1px solid rgba(45,106,45,0.08)",
  boxShadow: "var(--shadow-card)",
  padding: "1.35rem",
};

const labelStyle: React.CSSProperties = {
  fontSize: ".75rem",
  color: "var(--gray-400)",
  textTransform: "uppercase",
  letterSpacing: ".08em",
  fontWeight: 600,
};

const bodyTextStyle: React.CSSProperties = {
  color: "var(--gray-600)",
  fontSize: ".92rem",
};

const predictionsMock = [
  {
    id: "pred_001",
    label: "Tomato Early Blight",
    confidence: 0.94,
    feedback: true,
    created_at: "2026-05-01",
    status: "healthy",
  },
  {
    id: "pred_002",
    label: "Leaf Mold",
    confidence: 0.88,
    feedback: false,
    created_at: "2026-05-02",
    status: "warning",
  },
  {
    id: "pred_003",
    label: "Healthy Plant",
    confidence: 0.97,
    feedback: true,
    created_at: "2026-05-03",
    status: "healthy",
  },
  {
    id: "pred_004",
    label: "Bacterial Spot",
    confidence: 0.82,
    feedback: false,
    created_at: "2026-05-04",
    status: "danger",
  },
];

export function UserPredictions() {
  return (
    <div
      style={{
        display: "grid",
        gap: "1.5rem",
      }}
    >
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
          label="Total predictions"
          value={predictionsMock.length}
          sub="Stored in your history"
          icon={<span>📂</span>}
        />

        <MetricCard
          label="Feedback submitted"
          value="2"
          sub="Helping improve the AI"
          icon={<span>✅</span>}
        />

        <MetricCard
          label="Average confidence"
          value="90%"
          sub="Across all analyses"
          icon={<span>📈</span>}
        />
      </section>

      {/* history table */}
      <section style={sectionCardStyle}>
        <div
          style={{
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <div>
            <p
              style={{
                ...labelStyle,
                color: "var(--green-800)",
                marginBottom: ".45rem",
              }}
            >
              Diagnosis history
            </p>

            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.7rem",
                fontWeight: 400,
                letterSpacing: "-.03em",
                marginBottom: ".45rem",
              }}
            >
              Previous predictions
            </h2>

            <p
              style={{
                ...bodyTextStyle,
                maxWidth: 620,
              }}
            >
              Review previous AI analyses, confidence scores,
              and feedback submissions from your field uploads.
            </p>
          </div>

          <Link
            href="/predict"
            className="btn btn--primary btn--sm"
          >
            New prediction
          </Link>
        </div>

        {/* desktop table */}
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
                  "Date",
                  "Diagnosis",
                  "Confidence",
                  "Feedback",
                  "Status",
                  "Action",
                ].map((head) => (
                  <th
                    key={head}
                    style={{
                      textAlign: "left",
                      padding: "1rem",
                      fontSize: ".76rem",
                      textTransform: "uppercase",
                      letterSpacing: ".08em",
                      color: "var(--gray-400)",
                      fontWeight: 700,
                    }}
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {predictionsMock.map((item) => (
                <tr
                  key={item.id}
                  style={{
                    borderBottom:
                      "1px solid rgba(28,28,26,0.06)",
                    transition: ".15s",
                  }}
                >
                  <td
                    style={{
                      padding: "1rem",
                      color: "var(--gray-600)",
                      fontSize: ".9rem",
                    }}
                  >
                    {formatDate(item.created_at)}
                  </td>

                  <td
                    style={{
                      padding: "1rem",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gap: ".2rem",
                      }}
                    >
                      <p
                        style={{
                          fontWeight: 600,
                          color: "var(--gray-900)",
                        }}
                      >
                        {item.label}
                      </p>

                      <p
                        style={{
                          fontSize: ".82rem",
                          color: "var(--gray-400)",
                        }}
                      >
                        AI disease classification
                      </p>
                    </div>
                  </td>

                  <td
                    style={{
                      padding: "1rem",
                      minWidth: 180,
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gap: ".45rem",
                      }}
                    >
                      <div
                        style={{
                          height: 8,
                          borderRadius: 999,
                          background:
                            "rgba(28,28,26,0.08)",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${
                              item.confidence * 100
                            }%`,
                            height: "100%",
                            borderRadius: 999,
                            background:
                              "linear-gradient(90deg, var(--green-700), var(--green-600))",
                          }}
                        />
                      </div>

                      <span
                        style={{
                          fontSize: ".82rem",
                          fontWeight: 600,
                          color: "var(--green-800)",
                        }}
                      >
                        {(item.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </td>

                  <td
                    style={{
                      padding: "1rem",
                    }}
                  >
                    <StatusPill
                      tone={
                        item.feedback
                          ? "success"
                          : "pending"
                      }
                      label={
                        item.feedback
                          ? "Submitted"
                          : "Pending"
                      }
                    />
                  </td>

                  <td
                    style={{
                      padding: "1rem",
                    }}
                  >
                    <StatusPill
                      tone={item.status}
                      label={
                        item.status === "healthy"
                          ? "Healthy"
                          : item.status === "warning"
                          ? "Warning"
                          : "Critical"
                      }
                    />
                  </td>

                  <td
                    style={{
                      padding: "1rem",
                    }}
                  >
                    <Link
                      href={`/predictions/${item.id}`}
                      className="link"
                      style={{
                        fontSize: ".9rem",
                      }}
                    >
                      View details →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          style={{
            marginTop: "1.25rem",
            paddingTop: "1rem",
            borderTop: "1px solid var(--gray-100)",
            display: "flex",
            justifyContent: "space-between",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <p
            style={{
              fontSize: ".85rem",
              color: "var(--gray-400)",
            }}
          >
            Showing {predictionsMock.length} stored
            predictions
          </p>

          <button className="btn btn--ghost btn--sm">
            Export history
          </button>
        </div>
      </section>
    </div>
  );
}

function StatusPill({
  tone,
  label,
}: {
  tone: string;
  label: string;
}) {
  const tones: Record<
    string,
    { bg: string; color: string }
  > = {
    success: {
      bg: "rgba(74,143,74,0.1)",
      color: "var(--green-800)",
    },
    pending: {
      bg: "rgba(214,137,16,0.12)",
      color: "var(--warning)",
    },
    healthy: {
      bg: "rgba(74,143,74,0.1)",
      color: "var(--green-800)",
    },
    warning: {
      bg: "rgba(214,137,16,0.12)",
      color: "var(--warning)",
    },
    danger: {
      bg: "rgba(209,63,63,0.1)",
      color: "var(--error)",
    },
  };

  const current = tones[tone];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: ".35rem .7rem",
        borderRadius: 999,
        background: current.bg,
        color: current.color,
        fontSize: ".75rem",
        fontWeight: 700,
      }}
    >
      {label}
    </span>
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}