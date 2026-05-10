// components/admin/AdminExperiments.tsx

"use client";

import { MetricCard } from "@/components/ui/MetricCard";

/*
  Mocked data aligned with API contract:
  /admin/models
  /admin/retraining/jobs
*/

const runs = [
  {
    id: "RUN-204",
    model: "Tomato Disease CNN",
    status: "running",
    accuracy: 94.8,
    triggeredBy: "Paola",
    createdAt: "2 hours ago",
  },
  {
    id: "RUN-198",
    model: "Corn Leaf Detection",
    status: "success",
    accuracy: 91.2,
    triggeredBy: "Ferdi",
    createdAt: "Yesterday",
  },
  {
    id: "RUN-191",
    model: "Potato Blight Classification",
    status: "failed",
    accuracy: null,
    triggeredBy: "Admin",
    createdAt: "2 days ago",
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

export function AdminExperiments() {
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
          MLflow monitoring
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
          Model training runs
        </h1>

        <p
          style={{
            color: "var(--gray-600)",
            maxWidth: 760,
            lineHeight: 1.8,
            fontSize: ".98rem",
          }}
        >
          Monitor retraining jobs, compare model
          performance, and supervise MLflow runs
          across the entire platform.
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
          label="Running jobs"
          value="12"
          sub="Currently processing"
          icon={<span>🧪</span>}
        />

        <MetricCard
          label="Best accuracy"
          value="94.8%"
          sub="Tomato Disease CNN"
          icon={<span>🎯</span>}
        />

        <MetricCard
          label="Successful runs"
          value="5"
          sub="Completed today"
          icon={<span>✅</span>}
        />

        <MetricCard
          label="Failed runs"
          value="1"
          sub="Requires review"
          icon={<span>⚠️</span>}
        />
      </section>

      {/* runs table */}

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
              Retraining
            </p>

            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.7rem",
                fontWeight: 400,
                letterSpacing: "-.03em",
              }}
            >
              Recent training runs
            </h2>
          </div>

          <button className="btn btn--primary btn--sm">
            Trigger retraining
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
                  borderBottom:
                    "1px solid var(--gray-100)",
                }}
              >
                {[
                  "Model",
                  "Status",
                  "Accuracy",
                  "Triggered by",
                  "Created",
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
              {runs.map((run) => (
                <tr
                  key={run.id}
                  style={{
                    borderBottom:
                      "1px solid var(--gray-100)",
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
                          color:
                            "var(--gray-900)",
                          marginBottom: ".2rem",
                        }}
                      >
                        {run.model}
                      </p>

                      <span
                        style={{
                          fontSize: ".82rem",
                          color:
                            "var(--gray-400)",
                        }}
                      >
                        {run.id}
                      </span>
                    </div>
                  </td>

                  <td
                    style={{
                      padding: "1rem",
                    }}
                  >
                    <RunStatus
                      status={run.status}
                    />
                  </td>

                  <td
                    style={{
                      padding: "1rem",
                      fontWeight: 600,
                      color:
                        "var(--green-800)",
                    }}
                  >
                    {run.accuracy !== null
                      ? `${run.accuracy}%`
                      : "--"}
                  </td>

                  <td
                    style={{
                      padding: "1rem",
                      color:
                        "var(--gray-600)",
                    }}
                  >
                    {run.triggeredBy}
                  </td>

                  <td
                    style={{
                      padding: "1rem",
                      color:
                        "var(--gray-400)",
                    }}
                  >
                    {run.createdAt}
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

function RunStatus({
  status,
}: {
  status:
    | "running"
    | "success"
    | "failed";
}) {
  const tones = {
    running: {
      bg: "#eef7ff",
      color: "#1a4480",
      label: "Running",
    },

    success: {
      bg: "var(--green-100)",
      color: "var(--green-800)",
      label: "Success",
    },

    failed: {
      bg: "#fdf2f2",
      color: "var(--error)",
      label: "Failed",
    },
  };

  const tone = tones[status];

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