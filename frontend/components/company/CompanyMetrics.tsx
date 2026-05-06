import { CompanyShell } from "@/components/company/CompanyShell";
import { InfoTooltip } from "@/components/company/InfoTooltip";
import { MetricCard } from "@/components/ui/MetricCard";
import {
  companyAdminMock,
  type CompanyMetricsSnapshot,
} from "@/mocks/data/companyAdmin";

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

const toneByStatus = {
  active: "high",
  suspended: "pending",
} as const;

const toneByActivity = {
  success: { bg: "rgba(74,143,74,0.1)", color: "var(--green-900)" },
  warning: { bg: "rgba(214,137,16,0.12)", color: "var(--warning)" },
  info: { bg: "rgba(26,68,128,0.1)", color: "#1a4480" },
} as const;

const toneByTrend = {
  up: { bg: "rgba(74,143,74,0.1)", color: "var(--green-900)", label: "Up" },
  down: { bg: "rgba(209,63,63,0.1)", color: "var(--error)", label: "Down" },
  stable: { bg: "var(--gray-100)", color: "var(--gray-600)", label: "Stable" },
} as const;

export function CompanyMetrics() {
  const metrics = companyAdminMock.metrics;
  const zones = [...metrics.zonePerformance].sort(
    (left, right) => right.predictions - left.predictions,
  );
  const maxPredictions = Math.max(...zones.map((zone) => zone.predictions), 1);

  return (
    <CompanyShell
      activePath="/company/metrics"
      title="Company metrics"
      description="A compact operational summary of weekly usage, feedback rhythm, and the zones driving the most activity."
      statusTone={toneByStatus[companyAdminMock.company.status]}
      statusLabel={
        companyAdminMock.company.status === "active"
          ? "Company active"
          : "Company suspended"
      }
    >
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "1rem",
        }}
      >
        <MetricCard
          label="Predictions this week"
          value={metrics.predictionsThisWeek}
          sub="Company-wide activity"
        />
        <MetricCard
          label="Feedback rate"
          value={formatPercent(metrics.feedbackRate)}
          sub="Reviewed predictions"
        />
        <MetricCard
          label="Weekly growth"
          value={formatGrowth(metrics.weeklyGrowth)}
          sub="Compared with last week"
          trend={{
            label: `${Math.abs(metrics.weeklyGrowth)}%`,
            up: metrics.weeklyGrowth >= 0,
          }}
        />
        <MetricCard
          label="Top label"
          value={metrics.topLabel}
          sub="Most common detection"
        />
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.15fr) minmax(0, .85fr)",
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        <PanelCard
          eyebrow="Performance"
          title="Zone performance"
          description="A lightweight breakdown of where prediction volume and review completion are concentrating this week."
        >
          <div style={{ display: "grid", gap: "1rem" }}>
            {zones.map((zone) => (
              <ZonePerformanceRow
                key={zone.zone}
                zone={zone}
                maxPredictions={maxPredictions}
              />
            ))}
          </div>
        </PanelCard>

        <PanelCard
          eyebrow="Signals"
          title="Recent activity"
          description="Short operational notes that help admins read the week without digging into a full analytics dashboard."
        >
          <div style={{ display: "grid", gap: ".9rem" }}>
            {metrics.recentActivity.map((item) => (
              <ActivityItem key={item.id} item={item} />
            ))}
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
                fontFamily: "var(--font-display)",
                fontSize: "1.45rem",
                fontWeight: 400,
                lineHeight: 1.1,
                letterSpacing: "-.02em",
              }}
            >
              {title}
            </h2>
            <InfoTooltip text={description} />
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
  zone: CompanyMetricsSnapshot["zonePerformance"][number];
  maxPredictions: number;
}) {
  const width = `${Math.max((zone.predictions / maxPredictions) * 100, 18)}%`;
  const trendTone = toneByTrend[zone.trend];

  return (
    <article
      style={{
        display: "grid",
        gap: ".7rem",
        paddingBottom: "1rem",
        borderBottom: "1px solid rgba(28,28,26,0.08)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div>
          <p style={{ fontWeight: 600, color: "var(--gray-900)" }}>
            {zone.zone}
          </p>
          <p
            style={{ ...bodyTextStyle, fontSize: ".84rem", marginTop: ".2rem" }}
          >
            {zone.predictions} predictions · {formatPercent(zone.feedbackRate)}{" "}
            feedback
          </p>
        </div>
        <TrendPill trend={zone.trend} label={trendTone.label} />
      </div>

      <div
        style={{
          height: 10,
          borderRadius: 999,
          background: "rgba(28,28,26,0.08)",
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
  item,
}: {
  item: CompanyMetricsSnapshot["recentActivity"][number];
}) {
  const tone = toneByActivity[item.tone];

  return (
    <article
      style={{
        borderRadius: "18px",
        padding: "1rem",
        border: "1px solid rgba(45,106,45,0.08)",
        background:
          "linear-gradient(180deg, rgba(244,250,244,0.45), var(--white))",
        display: "grid",
        gap: ".55rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: ".8rem",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: ".45rem",
            padding: ".32rem .62rem",
            borderRadius: 999,
            background: tone.bg,
            color: tone.color,
            fontSize: ".72rem",
            fontWeight: 700,
            letterSpacing: ".04em",
            textTransform: "uppercase",
          }}
        >
          {item.value}
        </span>
      </div>
      <div style={{ display: "grid", gap: ".25rem" }}>
        <h3
          style={{
            fontSize: "1rem",
            fontWeight: 600,
            color: "var(--gray-900)",
          }}
        >
          {item.title}
        </h3>
        <p style={{ ...bodyTextStyle, fontSize: ".88rem" }}>
          {item.description}
        </p>
      </div>
    </article>
  );
}

function TrendPill({
  trend,
  label,
}: {
  trend: CompanyMetricsSnapshot["zonePerformance"][number]["trend"];
  label: string;
}) {
  const tone = toneByTrend[trend];

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
      {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}
      {label}
    </span>
  );
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatGrowth(value: number) {
  return `${value > 0 ? "+" : ""}${value}%`;
}
