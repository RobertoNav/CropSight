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

export function CompanyMetrics() {
  const metrics = companyAdminMock.metrics;
  const predictionsByDay = [...metrics.predictions_by_day].sort(
    (left, right) =>
      new Date(left.date).getTime() - new Date(right.date).getTime(),
  );
  const topLabels = [...metrics.top_labels].sort(
    (left, right) => right.count - left.count,
  );
  const maxDailyPredictions = Math.max(
    ...predictionsByDay.map((entry) => entry.count),
    1,
  );
  const maxLabelCount = Math.max(...topLabels.map((entry) => entry.count), 1);
  const primaryLabel = topLabels[0];
  const peakDay = predictionsByDay.reduce<
    (typeof predictionsByDay)[number] | null
  >((highest, entry) => {
    if (!highest || entry.count > highest.count) {
      return entry;
    }

    return highest;
  }, null);
  const averagePerDay = Math.round(
    metrics.total_predictions / Math.max(predictionsByDay.length, 1),
  );

  return (
    <CompanyShell
      activePath="/company/metrics"
      title="Company metrics"
      description="A compact operational summary of prediction volume, review rhythm, and the labels dominating the selected date range."
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
          label="Total predictions"
          value={metrics.total_predictions}
          sub={formatRangeLabel(predictionsByDay.length)}
        />
        <MetricCard
          label="Feedback rate"
          value={formatPercent(metrics.feedback_rate)}
          sub="Reviewed predictions"
        />
        <MetricCard
          label="Average per day"
          value={averagePerDay}
          sub={
            peakDay
              ? `Peak day: ${formatShortDate(peakDay.date)}`
              : "No daily activity yet"
          }
        />
        <MetricCard
          label="Top label"
          value={
            primaryLabel ? formatLabel(primaryLabel.label) : "No labels yet"
          }
          sub={
            primaryLabel
              ? `${primaryLabel.count} detections`
              : "No detections recorded"
          }
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
          eyebrow="Volume"
          title="Prediction activity by day"
          description="A lightweight breakdown of prediction volume across the selected range, based only on the backend daily series."
        >
          <div
            style={{
              display: "grid",
              gap: "1rem",
              maxHeight: predictionsByDay.length > 8 ? 420 : "none",
              overflowY: predictionsByDay.length > 8 ? "auto" : "visible",
              paddingRight: predictionsByDay.length > 8 ? ".35rem" : 0,
            }}
          >
            {predictionsByDay.map((entry) => (
              <PredictionDayRow
                key={entry.date}
                entry={entry}
                maxCount={maxDailyPredictions}
              />
            ))}
          </div>
          {predictionsByDay.length > 8 ? (
            <p
              style={{
                ...bodyTextStyle,
                fontSize: ".82rem",
                marginTop: ".85rem",
              }}
            >
              The full daily series stays in one view and scrolls vertically
              when the selected range gets long, instead of splitting the
              timeline with pagination.
            </p>
          ) : null}
        </PanelCard>

        <PanelCard
          eyebrow="Labels"
          title="Most detected labels"
          description="A ranked list of the labels most often returned in the selected range, using the exact backend response shape."
        >
          <div style={{ display: "grid", gap: ".9rem" }}>
            {topLabels.map((item) => (
              <TopLabelRow
                key={item.label}
                item={item}
                maxCount={maxLabelCount}
                totalPredictions={metrics.total_predictions}
              />
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

function PredictionDayRow({
  entry,
  maxCount,
}: {
  entry: CompanyMetricsSnapshot["predictions_by_day"][number];
  maxCount: number;
}) {
  const width = `${Math.max((entry.count / maxCount) * 100, 18)}%`;

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
            {formatLongDate(entry.date)}
          </p>
          <p
            style={{ ...bodyTextStyle, fontSize: ".84rem", marginTop: ".2rem" }}
          >
            {entry.count} predictions recorded
          </p>
        </div>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: ".32rem .62rem",
            borderRadius: 999,
            background: "rgba(74,143,74,0.1)",
            color: "var(--green-900)",
            fontSize: ".74rem",
            fontWeight: 700,
          }}
        >
          {entry.count}
        </span>
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

function TopLabelRow({
  item,
  maxCount,
  totalPredictions,
}: {
  item: CompanyMetricsSnapshot["top_labels"][number];
  maxCount: number;
  totalPredictions: number;
}) {
  const width = `${Math.max((item.count / maxCount) * 100, 18)}%`;
  const share =
    totalPredictions > 0
      ? Math.round((item.count / totalPredictions) * 100)
      : 0;

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
            padding: ".32rem .62rem",
            borderRadius: 999,
            background: "rgba(26,68,128,0.1)",
            color: "#1a4480",
            fontSize: ".72rem",
            fontWeight: 700,
            letterSpacing: ".04em",
            textTransform: "uppercase",
          }}
        >
          {share}% share
        </span>
        <span
          style={{
            fontSize: ".82rem",
            fontWeight: 600,
            color: "var(--gray-700)",
          }}
        >
          {item.count} detections
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
          {formatLabel(item.label)}
        </h3>
        <div
          style={{
            height: 8,
            borderRadius: 999,
            background: "rgba(28,28,26,0.08)",
            overflow: "hidden",
            marginTop: ".35rem",
          }}
        >
          <div
            style={{
              width,
              height: "100%",
              borderRadius: 999,
              background: "linear-gradient(90deg, #1a4480, #5f8fc9)",
            }}
          />
        </div>
      </div>
    </article>
  );
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

function formatLongDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function formatRangeLabel(days: number) {
  return days === 1 ? "1 tracked day" : `${days} tracked days`;
}
