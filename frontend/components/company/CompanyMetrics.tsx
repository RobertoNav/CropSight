"use client";

import { useEffect, useState } from "react";

import { CompanyShell } from "@/components/company/CompanyShell";
import { InfoTooltip } from "@/components/company/InfoTooltip";
import { MetricCard } from "@/components/ui/MetricCard";

import {
  getUsageMetrics,
} from "@/services/admin.service";

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

const toneByTrend = {
  up: {
    bg: "rgba(74,143,74,0.1)",
    color: "var(--green-900)",
    label: "Up",
  },

  down: {
    bg: "rgba(209,63,63,0.1)",
    color: "var(--error)",
    label: "Down",
  },

  stable: {
    bg: "var(--gray-100)",
    color: "var(--gray-600)",
    label: "Stable",
  },
} as const;

type MetricsState = {
  predictionsThisWeek: number;
  feedbackRate: number;
  activeUsers: number;
  activeCompanies: number;
  predictionsByDay: {
    date: string;
    count: number;
  }[];
};

export function CompanyMetrics() {
  const [loading, setLoading] =
    useState(true);

  const [metrics, setMetrics] =
    useState<MetricsState>({
      predictionsThisWeek: 0,
      feedbackRate: 0,
      activeUsers: 0,
      activeCompanies: 0,
      predictionsByDay: [],
    });

  useEffect(() => {
    async function loadMetrics() {
      try {
        const data =
          await getUsageMetrics();

        setMetrics({
          predictionsThisWeek:
            data.total_predictions || 0,

          feedbackRate:
            data.feedback_rate || 0,

          activeUsers:
            data.active_users || 0,

          activeCompanies:
            data.active_companies || 0,

          predictionsByDay:
            data.predictions_by_day ||
            [],
        });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadMetrics();
  }, []);

 const zonePerformance =
  metrics.predictionsByDay.map(
    (
      item: {
        date: string;
        count: number;
      },
      index: number
    ): {
      zone: string;
      predictions: number;
      feedbackRate: number;
      trend:
        | "up"
        | "down"
        | "stable";
    } => ({
      zone: item.date,
      predictions: item.count,

      feedbackRate:
        metrics.feedbackRate,

      trend:
        index > 0 &&
        item.count >
          metrics
            .predictionsByDay[
            index - 1
          ]?.count
          ? "up"
          : index > 0 &&
              item.count <
                metrics
                  .predictionsByDay[
                  index - 1
                ]?.count
            ? "down"
            : "stable",
    })
  );

  const maxPredictions =
    Math.max(
      ...zonePerformance.map(
        (z) => z.predictions
      ),
      1
    );

  return (
    <CompanyShell
      activePath="/company/metrics"
      title="Company metrics"
      description="Operational overview of company prediction activity and feedback behavior."
      statusTone="high"
      statusLabel="Company active"
    >
      {/* metrics */}
      <section
        style={{
          display: "grid",

          gridTemplateColumns:
            "repeat(auto-fit, minmax(210px, 1fr))",

          gap: "1rem",
        }}
      >
        <MetricCard
          label="Predictions"
          value={
            loading
              ? "..."
              : metrics.predictionsThisWeek.toLocaleString()
          }
          sub="Platform activity"
        />

        <MetricCard
          label="Feedback rate"
          value={
            loading
              ? "..."
              : formatPercent(
                  metrics.feedbackRate
                )
          }
          sub="Reviewed predictions"
        />

        <MetricCard
          label="Active users"
          value={
            loading
              ? "..."
              : metrics.activeUsers.toString()
          }
          sub="Using the platform"
        />

        <MetricCard
          label="Companies"
          value={
            loading
              ? "..."
              : metrics.activeCompanies.toString()
          }
          sub="Currently active"
        />
      </section>

      {/* sections */}
      <section
        style={{
          display: "grid",

          gridTemplateColumns:
            "minmax(0, 1.15fr) minmax(0, .85fr)",

          gap: "1.5rem",

          alignItems: "start",
        }}
      >
        {/* performance */}
        <PanelCard
          eyebrow="Performance"
          title="Prediction activity"
          description="Prediction volume across recent dates."
        >
          <div
            style={{
              display: "grid",
              gap: "1rem",
            }}
          >
            {zonePerformance.map(
              (zone) => (
                <ZonePerformanceRow
                  key={zone.zone}
                  zone={zone}
                  maxPredictions={
                    maxPredictions
                  }
                />
              )
            )}

            {!loading &&
              zonePerformance.length ===
                0 && (
                <p
                  style={{
                    color:
                      "var(--gray-400)",
                  }}
                >
                  No activity data.
                </p>
              )}
          </div>
        </PanelCard>

        {/* activity */}
        <PanelCard
          eyebrow="Signals"
          title="Operational summary"
          description="Quick operational insights from usage metrics."
        >
          <div
            style={{
              display: "grid",
              gap: ".9rem",
            }}
          >
            <ActivityItem
              title="Prediction activity"
              value={`${metrics.predictionsThisWeek}`}
              description="Predictions processed across the platform."
              tone="success"
            />

            <ActivityItem
              title="Feedback participation"
              value={formatPercent(
                metrics.feedbackRate
              )}
              description="Validated prediction feedback rate."
              tone="info"
            />

            <ActivityItem
              title="Active user base"
              value={`${metrics.activeUsers}`}
              description="Users currently interacting with the platform."
              tone="warning"
            />
          </div>
        </PanelCard>
      </section>
    </CompanyShell>
  );
}

function PanelCard({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section style={sectionCardStyle}>
      <div
        style={{
          marginBottom: "1.15rem",

          display: "flex",

          alignItems: "flex-start",

          justifyContent:
            "space-between",

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

              marginBottom:
                ".45rem",
            }}
          >
            {eyebrow}
          </p>

          <div
            style={{
              display: "inline-flex",

              alignItems: "center",

              gap: ".55rem",
            }}
          >
            <h2
              style={{
                fontFamily:
                  "var(--font-display)",

                fontSize: "1.45rem",

                fontWeight: 400,

                lineHeight: 1.1,

                letterSpacing:
                  "-.02em",
              }}
            >
              {title}
            </h2>

            <InfoTooltip
              text={description}
            />
          </div>
        </div>
      </div>

      {children}
    </section>
  );
}

function ZonePerformanceRow({
  zone,
  maxPredictions,
}: {
  zone: {
    zone: string;
    predictions: number;
    feedbackRate: number;
    trend:
      | "up"
      | "down"
      | "stable";
  };

  maxPredictions: number;
}) {
  const width = `${Math.max(
    (zone.predictions /
      maxPredictions) *
      100,
    18
  )}%`;

  const trendTone =
    toneByTrend[zone.trend];

  return (
    <article
      style={{
        display: "grid",

        gap: ".7rem",

        paddingBottom: "1rem",

        borderBottom:
          "1px solid rgba(28,28,26,0.08)",
      }}
    >
      <div
        style={{
          display: "flex",

          alignItems: "center",

          justifyContent:
            "space-between",

          gap: "1rem",

          flexWrap: "wrap",
        }}
      >
        <div>
          <p
            style={{
              fontWeight: 600,
              color:
                "var(--gray-900)",
            }}
          >
            {zone.zone}
          </p>

          <p
            style={{
              ...bodyTextStyle,

              fontSize: ".84rem",

              marginTop: ".2rem",
            }}
          >
            {zone.predictions}{" "}
            predictions ·{" "}
            {formatPercent(
              zone.feedbackRate
            )}{" "}
            feedback
          </p>
        </div>

        <TrendPill
          trend={zone.trend}
          label={trendTone.label}
        />
      </div>

      <div
        style={{
          height: 10,

          borderRadius: 999,

          background:
            "rgba(28,28,26,0.08)",

          overflow: "hidden",
        }}
      >
        <div
          style={{
            width,

            height: "100%",

            borderRadius: 999,

            background:
              "linear-gradient(90deg, var(--green-700), var(--green-500))",
          }}
        />
      </div>
    </article>
  );
}

function ActivityItem({
  title,
  value,
  description,
  tone,
}: {
  title: string;
  value: string;
  description: string;
  tone:
    | "success"
    | "warning"
    | "info";
}) {
  const toneByActivity = {
    success: {
      bg: "rgba(74,143,74,0.1)",
      color:
        "var(--green-900)",
    },

    warning: {
      bg: "rgba(214,137,16,0.12)",
      color:
        "var(--warning)",
    },

    info: {
      bg: "rgba(26,68,128,0.1)",
      color: "#1a4480",
    },
  } as const;

  const current =
    toneByActivity[tone];

  return (
    <article
      style={{
        borderRadius: "18px",

        padding: "1rem",

        border:
          "1px solid rgba(45,106,45,0.08)",

        background:
          "linear-gradient(180deg, rgba(244,250,244,0.45), var(--white))",

        display: "grid",

        gap: ".55rem",
      }}
    >
      <span
        style={{
          display: "inline-flex",

          alignItems: "center",

          gap: ".45rem",

          padding:
            ".32rem .62rem",

          borderRadius: 999,

          background:
            current.bg,

          color:
            current.color,

          fontSize: ".72rem",

          fontWeight: 700,

          letterSpacing:
            ".04em",

          textTransform:
            "uppercase",

          width: "fit-content",
        }}
      >
        {value}
      </span>

      <div
        style={{
          display: "grid",
          gap: ".25rem",
        }}
      >
        <h3
          style={{
            fontSize: "1rem",

            fontWeight: 600,

            color:
              "var(--gray-900)",
          }}
        >
          {title}
        </h3>

        <p
          style={{
            ...bodyTextStyle,
            fontSize: ".88rem",
          }}
        >
          {description}
        </p>
      </div>
    </article>
  );
}

function TrendPill({
  trend,
  label,
}: {
  trend:
    | "up"
    | "down"
    | "stable";

  label: string;
}) {
  const tone =
    toneByTrend[trend];

  return (
    <span
      style={{
        display: "inline-flex",

        alignItems: "center",

        gap: ".4rem",

        padding: ".32rem .62rem",

        borderRadius: 999,

        background: tone.bg,

        color: tone.color,

        fontSize: ".74rem",

        fontWeight: 700,
      }}
    >
      {trend === "up"
        ? "↑"
        : trend === "down"
          ? "↓"
          : "→"}

      {label}
    </span>
  );
}

function formatPercent(
  value: number
) {
  return `${Math.round(
    value * 100
  )}%`;
}