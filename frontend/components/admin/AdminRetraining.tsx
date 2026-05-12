// components/admin/AdminRetraining.tsx

"use client";

import { useEffect, useState } from "react";

import { MetricCard } from "@/components/ui/MetricCard";

import {
  getRetrainingJobs,
  triggerRetraining,
} from "@/services/admin.service";

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

type RetrainingJob = {
  id: string;
  status:
    | "pending"
    | "running"
    | "completed"
    | "failed";

  notes?: string;

  github_run_id?: string;

  created_at?: string | null;

  started_at?: string | null;

  completed_at?: string | null;

  finished_at?: string | null;

  triggered_by_name?: string;
};

export function AdminRetraining() {
  const [loading, setLoading] =
    useState(true);

  const [starting, setStarting] =
    useState(false);

  const [jobs, setJobs] = useState<
    RetrainingJob[]
  >([]);

  async function loadJobs() {
    try {
      const data =
        await getRetrainingJobs();

      setJobs(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadJobs();
  }, []);

  async function handleStartRetraining() {
    try {
      setStarting(true);

      await triggerRetraining(
        "Triggered from admin dashboard"
      );

      await loadJobs();
    } catch (error) {
      console.error(error);
    } finally {
      setStarting(false);
    }
  }

  const runningJobs =
    jobs.filter(
      (job) =>
        job.status === "running"
    ).length;

  const completedJobs =
    jobs.filter(
      (job) =>
        job.status === "completed"
    ).length;

  const failedJobs =
    jobs.filter(
      (job) =>
        job.status === "failed"
    ).length;

  const formatter =
    new Intl.DateTimeFormat(
      "en-US",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );

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
          justifyContent:
            "space-between",

          alignItems: "flex-start",

          gap: "1rem",

          flexWrap: "wrap",
        }}
      >
        <div>
          <p
            style={{
              ...labelStyle,
              color:
                "var(--green-800)",

              marginBottom: ".55rem",
            }}
          >
            ML operations
          </p>

          <h1
            style={{
              fontFamily:
                "var(--font-display)",

              fontSize: "3rem",

              lineHeight: 1,

              letterSpacing:
                "-.04em",

              fontWeight: 400,

              marginBottom: ".9rem",
            }}
          >
            Retraining jobs
          </h1>

          <p
            style={{
              color:
                "var(--gray-600)",

              maxWidth: 760,

              lineHeight: 1.8,

              fontSize: ".98rem",
            }}
          >
            Trigger retraining
            pipelines, supervise
            training progress, and
            monitor operational
            health for platform ML
            workflows.
          </p>
        </div>

        <button
          className="btn btn--primary btn--sm"
          onClick={
            handleStartRetraining
          }
          disabled={starting}
        >
          {starting
            ? "Starting..."
            : "Start retraining"}
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
          value={
            loading
              ? "..."
              : runningJobs.toString()
          }
          sub="Currently processing"
          icon={<span>⚙️</span>}
        />

        <MetricCard
          label="Completed jobs"
          value={
            loading
              ? "..."
              : completedJobs.toString()
          }
          sub="Successful pipelines"
          icon={<span>✅</span>}
        />

        <MetricCard
          label="Failed jobs"
          value={
            loading
              ? "..."
              : failedJobs.toString()
          }
          sub="Require review"
          icon={<span>⚠️</span>}
        />

        <MetricCard
          label="Total jobs"
          value={
            loading
              ? "..."
              : jobs.length.toString()
          }
          sub="Historical runs"
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
              color:
                "var(--green-800)",

              marginBottom: ".35rem",
            }}
          >
            Pipeline monitoring
          </p>

          <h2
            style={{
              fontFamily:
                "var(--font-display)",

              fontSize: "1.7rem",

              fontWeight: 400,

              letterSpacing:
                "-.03em",
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
                border:
                  "1px solid var(--gray-100)",

                borderRadius: "18px",

                padding: "1.1rem",

                background:
                  "linear-gradient(180deg, rgba(244,250,244,0.45), var(--white))",
              }}
            >
              <div
                style={{
                  display: "flex",

                  justifyContent:
                    "space-between",

                  gap: "1rem",

                  flexWrap: "wrap",

                  marginBottom: ".9rem",
                }}
              >
                <div>
                  <h3
                    style={{
                      fontWeight: 600,

                      color:
                        "var(--gray-900)",

                      marginBottom:
                        ".25rem",
                    }}
                  >
                    Retraining job
                  </h3>

                  <p
                    style={{
                      color:
                        "var(--gray-400)",

                      fontSize: ".85rem",
                    }}
                  >
                    {job.id}
                    {job.github_run_id &&
                      ` · GitHub #${job.github_run_id}`}
                  </p>
                </div>

                <JobStatus
                  status={job.status}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gap: ".65rem",
                }}
              >
                <InfoRow
                  label="Triggered by"
                  value={
                    job.triggered_by_name ||
                    "Unknown"
                  }
                />

                <InfoRow
                  label="Started at"
                  value={formatter.format(
                    new Date(
                      job.started_at
                    )
                  )}
                />

                <InfoRow
                  label="Finished at"
                  value={
                    job.finished_at
                      ? formatter.format(
                          new Date(
                            job.finished_at
                          )
                        )
                      : "Still running"
                  }
                />

                <InfoRow
                  label="Notes"
                  value={
                    job.notes ||
                    "No notes provided"
                  }
                />
              </div>
            </article>
          ))}

          {!loading &&
            jobs.length === 0 && (
              <div
                style={{
                  padding: "2rem",
                  textAlign: "center",
                  color:
                    "var(--gray-400)",
                }}
              >
                No retraining jobs
                found.
              </div>
            )}
        </div>
      </section>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent:
          "space-between",
        gap: "1rem",
        flexWrap: "wrap",
      }}
    >
      <span
        style={{
          color:
            "var(--gray-400)",
          fontSize: ".84rem",
        }}
      >
        {label}
      </span>

      <span
        style={{
          color:
            "var(--gray-900)",
          fontWeight: 500,
          fontSize: ".88rem",
          textAlign: "right",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function JobStatus({
  status,
}: {
  status:
    | "running"
    | "completed"
    | "failed";
}) {
  const tones = {
    running: {
      bg: "#eef7ff",
      color: "#1a4480",
      label: "Running",
    },

    completed: {
      bg: "var(--green-100)",
      color:
        "var(--green-800)",
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

        justifyContent:
          "center",

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