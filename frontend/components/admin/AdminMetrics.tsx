// components/admin/AdminMetrics.tsx

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

const zones = [
  {
    name: "North America",
    predictions: 12432,
    accuracy: 94,
    drift: "low",
  },
  {
    name: "Latin America",
    predictions: 9831,
    accuracy: 91,
    drift: "moderate",
  },
  {
    name: "Europe",
    predictions: 7420,
    accuracy: 95,
    drift: "low",
  },
  {
    name: "Asia Pacific",
    predictions: 13120,
    accuracy: 88,
    drift: "high",
  },
];

const activity = [
  {
    title: "Tomato model drift increased",
    description:
      "Prediction confidence decreased by 6% in Asia Pacific datasets.",
    tone: "warning",
  },
  {
    title: "Retraining completed",
    description:
      "Corn classification pipeline deployed successfully.",
    tone: "success",
  },
  {
    title: "New validation dataset uploaded",
    description:
      "4,200 annotated images added to MLflow tracking.",
    tone: "info",
  },
] as const;

export function AdminMetrics() {
  const maxPredictions = Math.max(
    ...zones.map((z) => z.predictions),
  );

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
          Platform analytics
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
          Global performance metrics
        </h1>

        <p
          style={{
            color: "var(--gray-600)",
            maxWidth: 760,
            lineHeight: 1.8,
            fontSize: ".98rem",
          }}
        >
          Monitor platform-wide prediction quality,
          confidence trends, drift detection, and operational
          health across all deployed ML models.
        </p>
      </section>

      {/* top metrics */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
        }}
      >
        <MetricCard
          label="Global accuracy"
          value="93.7%"
          sub="Across all production models"
          icon={<span>🎯</span>}
        />

        <MetricCard
          label="Predictions today"
          value="42.3k"
          sub="Processed worldwide"
          icon={<span>🌿</span>}
        />

        <MetricCard
          label="Detected drift"
          value="2"
          sub="Models requiring attention"
          icon={<span>⚠️</span>}
        />

        <MetricCard
          label="Feedback coverage"
          value="81%"
          sub="Validated predictions"
          icon={<span>✅</span>}
        />
      </section>

      {/* charts + activity */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(0, 1.15fr) minmax(320px, .85fr)",
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        {/* region performance */}
        <section style={sectionCardStyle}>
          <div
            style={{
              marginBottom: "1.2rem",
            }}
          >
            <p
              style={{
                ...labelStyle,
                color: "var(--green-800)",
                marginBottom: ".45rem",
              }}
            >
              Regional overview
            </p>

            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.7rem",
                fontWeight: 400,
                letterSpacing: "-.03em",
              }}
            >
              Prediction performance
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gap: "1rem",
            }}
          >
            {zones.map((zone) => (
              <div
                key={zone.name}
                style={{
                  display: "grid",
                  gap: ".6rem",
                  paddingBottom: "1rem",
                  borderBottom:
                    "1px solid rgba(28,28,26,0.08)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "1rem",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontWeight: 600,
                        color: "var(--gray-900)",
                      }}
                    >
                      {zone.name}
                    </p>

                    <p
                      style={{
                        color: "var(--gray-600)",
                        fontSize: ".85rem",
                      }}
                    >
                      {zone.predictions.toLocaleString()}{" "}
                      predictions · {zone.accuracy}% accuracy
                    </p>
                  </div>

                  <DriftPill drift={zone.drift} />
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
                      width: `${
                        (zone.predictions /
                          maxPredictions) *
                        100
                      }%`,
                      height: "100%",
                      borderRadius: 999,
                      background:
                        "linear-gradient(90deg, var(--green-700), var(--green-600))",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* activity */}
        <section style={sectionCardStyle}>
          <div
            style={{
              marginBottom: "1.2rem",
            }}
          >
            <p
              style={{
                ...labelStyle,
                color: "var(--green-800)",
                marginBottom: ".45rem",
              }}
            >
              Live signals
            </p>

            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.7rem",
                fontWeight: 400,
                letterSpacing: "-.03em",
              }}
            >
              Recent activity
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gap: ".9rem",
            }}
          >
            {activity.map((item) => (
              <ActivityCard
                key={item.title}
                title={item.title}
                description={item.description}
                tone={item.tone}
              />
            ))}
          </div>
        </section>
      </section>
    </div>
  );
}

function ActivityCard({
  title,
  description,
  tone,
}: {
  title: string;
  description: string;
  tone: "success" | "warning" | "info";
}) {
  const tones = {
    success: {
      bg: "rgba(74,143,74,0.1)",
      color: "var(--green-900)",
    },
    warning: {
      bg: "rgba(214,137,16,0.12)",
      color: "var(--warning)",
    },
    info: {
      bg: "rgba(26,68,128,0.1)",
      color: "#1a4480",
    },
  };

  const current = tones[tone];

  return (
    <article
      style={{
        borderRadius: "18px",
        padding: "1rem",
        border: "1px solid rgba(45,106,45,0.08)",
        background:
          "linear-gradient(180deg, rgba(244,250,244,0.45), var(--white))",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: ".35rem .65rem",
          borderRadius: "999px",
          background: current.bg,
          color: current.color,
          fontSize: ".72rem",
          fontWeight: 700,
          marginBottom: ".7rem",
          textTransform: "uppercase",
        }}
      >
        {tone}
      </span>

      <h3
        style={{
          fontWeight: 600,
          color: "var(--gray-900)",
          marginBottom: ".4rem",
        }}
      >
        {title}
      </h3>

      <p
        style={{
          color: "var(--gray-600)",
          fontSize: ".9rem",
          lineHeight: 1.7,
        }}
      >
        {description}
      </p>
    </article>
  );
}

function DriftPill({
  drift,
}: {
  drift: string;
}) {
  const tones = {
    low: {
      bg: "var(--green-100)",
      color: "var(--green-800)",
      label: "Low drift",
    },
    moderate: {
      bg: "#fff7e6",
      color: "var(--warning)",
      label: "Moderate drift",
    },
    high: {
      bg: "#fdf2f2",
      color: "var(--error)",
      label: "High drift",
    },
  } as const;

  const tone =
    tones[drift as keyof typeof tones] || tones.low;

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