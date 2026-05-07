// components/admin/AdminExperiments.tsx

"use client";

import { MetricCard } from "@/components/ui/MetricCard";

const experiments = [
  {
    id: "EXP-204",
    name: "Tomato Disease CNN",
    status: "running",
    accuracy: "94.8%",
    startedBy: "Paola",
    createdAt: "2 hours ago",
  },
  {
    id: "EXP-198",
    name: "Corn Leaf Detection",
    status: "completed",
    accuracy: "91.2%",
    startedBy: "Ferdi",
    createdAt: "Yesterday",
  },
  {
    id: "EXP-191",
    name: "Potato Blight Classification",
    status: "failed",
    accuracy: "--",
    startedBy: "Admin",
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
          MLflow tracking
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
          Experiment tracking
        </h1>

        <p
          style={{
            color: "var(--gray-600)",
            maxWidth: 760,
            lineHeight: 1.8,
            fontSize: ".98rem",
          }}
        >
          Monitor training experiments, compare model
          performance, and supervise MLflow runs across the
          entire platform.
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
          label="Active experiments"
          value="12"
          sub="Currently running"
          icon={<span>🧪</span>}
        />

        <MetricCard
          label="Best accuracy"
          value="94.8%"
          sub="Tomato Disease CNN"
          icon={<span>🎯</span>}
        />

        <MetricCard
          label="Completed today"
          value="5"
          sub="Successful training runs"
          icon={<span>✅</span>}
        />

        <MetricCard
          label="Failed runs"
          value="1"
          sub="Requires review"
          icon={<span>⚠️</span>}
        />
      </section>

      {/* experiments table */}
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
              MLflow
            </p>

            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.7rem",
                fontWeight: 400,
                letterSpacing: "-.03em",
              }}
            >
              Recent experiments
            </h2>
          </div>

          <button className="btn btn--primary btn--sm">
            Start experiment
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
                  "Experiment",
                  "Status",
                  "Accuracy",
                  "Started by",
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
              {experiments.map((experiment) => (
                <tr
                  key={experiment.id}
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
                        {experiment.name}
                      </p>

                      <span
                        style={{
                          fontSize: ".82rem",
                          color: "var(--gray-400)",
                        }}
                      >
                        {experiment.id}
                      </span>
                    </div>
                  </td>

                  <td
                    style={{
                      padding: "1rem",
                    }}
                  >
                    <ExperimentStatus status={experiment.status} />
                  </td>

                  <td
                    style={{
                      padding: "1rem",
                      fontWeight: 600,
                      color: "var(--green-800)",
                    }}
                  >
                    {experiment.accuracy}
                  </td>

                  <td
                    style={{
                      padding: "1rem",
                      color: "var(--gray-600)",
                    }}
                  >
                    {experiment.startedBy}
                  </td>

                  <td
                    style={{
                      padding: "1rem",
                      color: "var(--gray-400)",
                    }}
                  >
                    {experiment.createdAt}
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

function ExperimentStatus({
  status,
}: {
  status: "running" | "completed" | "failed";
}) {
  const tones = {
    running: {
      bg: "#eef7ff",
      color: "#1a4480",
      label: "Running",
    },
    completed: {
      bg: "var(--green-100)",
      color: "var(--green-800)",
      label: "Completed",
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