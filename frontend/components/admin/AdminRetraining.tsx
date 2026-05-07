// components/admin/AdminRetraining.tsx

"use client";

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

const jobs = [
  {
    id: "JOB-203",
    model: "Tomato Disease CNN",
    status: "running",
    progress: 72,
    dataset: "18.2k images",
    started: "35 min ago",
  },
  {
    id: "JOB-198",
    model: "Corn Leaf Detection",
    status: "completed",
    progress: 100,
    dataset: "12.4k images",
    started: "Yesterday",
  },
  {
    id: "JOB-191",
    model: "Potato Blight Model",
    status: "queued",
    progress: 12,
    dataset: "7.9k images",
    started: "Queued",
  },
] as const;

export function AdminRetraining() {
  return (
    <div
      style={{
        display: "grid",
        gap: "1.5rem",
      }}
    >
      {/* header */}
      <section
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div>
          <p
            style={{
              ...labelStyle,
              color: "var(--green-800)",
              marginBottom: ".55rem",
            }}
          >
            ML operations
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
            Retraining jobs
          </h1>

          <p
            style={{
              color: "var(--gray-600)",
              maxWidth: 760,
              lineHeight: 1.8,
              fontSize: ".98rem",
            }}
          >
            Trigger retraining pipelines, supervise training
            progress, and monitor operational health for
            platform ML workflows.
          </p>
        </div>

        <button className="btn btn--primary btn--sm">
          Start retraining
        </button>
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
          label="Active jobs"
          value="3"
          sub="Currently processing"
          icon={<span>⚙️</span>}
        />

        <MetricCard
          label="Completed today"
          value="8"
          sub="Successful pipelines"
          icon={<span>✅</span>}
        />

        <MetricCard
          label="Queued runs"
          value="2"
          sub="Waiting execution"
          icon={<span>⏳</span>}
        />

        <MetricCard
          label="Average duration"
          value="42m"
          sub="Per training job"
          icon={<span>🧠</span>}
        />
      </section>

      {/* jobs */}
      <section style={sectionCardStyle}>
        <div
          style={{
            marginBottom: "1.4rem",
          }}
        >
          <p
            style={{
              ...labelStyle,
              color: "var(--green-800)",
              marginBottom: ".35rem",
            }}
          >
            Pipeline monitoring
          </p>

          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.7rem",
              fontWeight: 400,
              letterSpacing: "-.03em",
            }}
          >
            Training activity
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gap: "1rem",
          }}
        >
          {jobs.map((job) => (
            <article
              key={job.id}
              style={{
                border: "1px solid var(--gray-100)",
                borderRadius: "18px",
                padding: "1.1rem",
                background:
                  "linear-gradient(180deg, rgba(244,250,244,0.45), var(--white))",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "1rem",
                  flexWrap: "wrap",
                  marginBottom: ".9rem",
                }}
              >
                <div>
                  <h3
                    style={{
                      fontWeight: 600,
                      color: "var(--gray-900)",
                      marginBottom: ".25rem",
                    }}
                  >
                    {job.model}
                  </h3>

                  <p
                    style={{
                      color: "var(--gray-400)",
                      fontSize: ".85rem",
                    }}
                  >
                    {job.id} · {job.dataset}
                  </p>
                </div>

                <JobStatus status={job.status} />
              </div>

              <div
                style={{
                  marginBottom: ".8rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: ".45rem",
                  }}
                >
                  <span
                    style={{
                      color: "var(--gray-600)",
                      fontSize: ".85rem",
                    }}
                  >
                    Training progress
                  </span>

                  <span
                    style={{
                      color: "var(--gray-900)",
                      fontWeight: 600,
                      fontSize: ".85rem",
                    }}
                  >
                    {job.progress}%
                  </span>
                </div>

                <div
                  style={{
                    height: 10,
                    borderRadius: 999,
                    background: "var(--gray-100)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${job.progress}%`,
                      height: "100%",
                      borderRadius: 999,
                      background:
                        "linear-gradient(90deg, var(--green-700), var(--green-600))",
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "1rem",
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    color: "var(--gray-400)",
                    fontSize: ".82rem",
                  }}
                >
                  Started: {job.started}
                </span>

                <div
                  style={{
                    display: "flex",
                    gap: ".65rem",
                    flexWrap: "wrap",
                  }}
                >
                  <button className="btn btn--ghost btn--sm">
                    Logs
                  </button>

                  <button className="btn btn--secondary btn--sm">
                    Details
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function JobStatus({
  status,
}: {
  status: "running" | "completed" | "queued";
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
    queued: {
      bg: "#fff7e6",
      color: "var(--warning)",
      label: "Queued",
    },
  };

  const tone = tones[status];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: ".38rem .7rem",
        borderRadius: "999px",
        background: tone.bg,
        color: tone.color,
        fontSize: ".75rem",
        fontWeight: 600,
      }}
    >
      {tone.label}
    </span>
  );
}