// components/admin/AdminModelDetail.tsx

"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
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

export function AdminModelDetail() {
  const params = useParams();

  const version = params.version as string;

  const model = {
    version,
    name: "ResNet50 Tomato",
    stage: "production",
    accuracy: "94.8%",
    precision: "93.9%",
    recall: "92.4%",
    drift: "Low",
    createdAt: "May 2, 2026",
    deployedBy: "Paola",
    notes:
      "This version improves early-stage disease classification and reduces false positives in tomato leaf detection.",
  };

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
          <Link
            href="/admin/models"
            className="link"
            style={{
              display: "inline-block",
              marginBottom: ".8rem",
            }}
          >
            ← Back to models
          </Link>

          <p
            style={{
              ...labelStyle,
              color: "var(--green-800)",
              marginBottom: ".55rem",
            }}
          >
            Model registry
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
            {model.name}
          </h1>

          <p
            style={{
              color: "var(--gray-600)",
              maxWidth: 760,
              lineHeight: 1.8,
              fontSize: ".98rem",
            }}
          >
            Detailed operational view for model version{" "}
            <strong>{model.version}</strong>, including
            performance metrics, deployment state, and rollback
            actions.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: ".75rem",
            flexWrap: "wrap",
          }}
        >
          <button className="btn btn--ghost btn--sm">
            Rollback model
          </button>

          <button className="btn btn--primary btn--sm">
            Promote to production
          </button>
        </div>
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
          label="Accuracy"
          value={model.accuracy}
          sub="Validation dataset"
          icon={<span>🎯</span>}
        />

        <MetricCard
          label="Precision"
          value={model.precision}
          sub="Prediction quality"
          icon={<span>📈</span>}
        />

        <MetricCard
          label="Recall"
          value={model.recall}
          sub="Detection sensitivity"
          icon={<span>🧠</span>}
        />

        <MetricCard
          label="Drift status"
          value={model.drift}
          sub="Current monitoring"
          icon={<span>⚠️</span>}
        />
      </section>

      {/* detail cards */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(0, 1.1fr) minmax(320px, .9fr)",
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        {/* overview */}
        <section style={sectionCardStyle}>
          <p
            style={{
              ...labelStyle,
              color: "var(--green-800)",
              marginBottom: ".55rem",
            }}
          >
            Overview
          </p>

          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.7rem",
              fontWeight: 400,
              letterSpacing: "-.03em",
              marginBottom: "1rem",
            }}
          >
            Deployment summary
          </h2>

          <div
            style={{
              display: "grid",
              gap: "1rem",
            }}
          >
            <InfoRow
              label="Current stage"
              value={
                <StagePill stage={model.stage} />
              }
            />

            <InfoRow
              label="Version"
              value={model.version}
            />

            <InfoRow
              label="Created at"
              value={model.createdAt}
            />

            <InfoRow
              label="Deployed by"
              value={model.deployedBy}
            />
          </div>

          <div
            style={{
              marginTop: "1.5rem",
              padding: "1rem",
              borderRadius: "16px",
              background: "var(--gray-50)",
              border: "1px solid var(--gray-100)",
            }}
          >
            <p
              style={{
                ...labelStyle,
                marginBottom: ".5rem",
              }}
            >
              Notes
            </p>

            <p
              style={{
                color: "var(--gray-600)",
                lineHeight: 1.8,
              }}
            >
              {model.notes}
            </p>
          </div>
        </section>

        {/* actions */}
        <section style={sectionCardStyle}>
          <p
            style={{
              ...labelStyle,
              color: "var(--green-800)",
              marginBottom: ".55rem",
            }}
          >
            Actions
          </p>

          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.7rem",
              fontWeight: 400,
              letterSpacing: "-.03em",
              marginBottom: "1rem",
            }}
          >
            Registry controls
          </h2>

          <div
            style={{
              display: "grid",
              gap: "1rem",
            }}
          >
            <ActionCard
              title="Promote model"
              description="Move this version into production deployment for all prediction pipelines."
              button="Promote"
              primary
            />

            <ActionCard
              title="Rollback deployment"
              description="Restore the previous stable version from the MLflow registry."
              button="Rollback"
            />

            <ActionCard
              title="Archive version"
              description="Remove this model from active lifecycle tracking."
              button="Archive"
            />
          </div>
        </section>
      </section>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: "1rem",
        paddingBottom: ".9rem",
        borderBottom: "1px solid var(--gray-100)",
        alignItems: "center",
      }}
    >
      <span
        style={{
          color: "var(--gray-400)",
          fontSize: ".85rem",
        }}
      >
        {label}
      </span>

      <span
        style={{
          color: "var(--gray-900)",
          fontWeight: 600,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function ActionCard({
  title,
  description,
  button,
  primary,
}: {
  title: string;
  description: string;
  button: string;
  primary?: boolean;
}) {
  return (
    <div
      style={{
        padding: "1rem",
        borderRadius: "16px",
        border: "1px solid var(--gray-100)",
        background: "var(--gray-50)",
      }}
    >
      <h3
        style={{
          fontWeight: 600,
          color: "var(--gray-900)",
          marginBottom: ".35rem",
        }}
      >
        {title}
      </h3>

      <p
        style={{
          color: "var(--gray-600)",
          fontSize: ".9rem",
          lineHeight: 1.7,
          marginBottom: "1rem",
        }}
      >
        {description}
      </p>

      <button
        className={
          primary
            ? "btn btn--primary btn--sm"
            : "btn btn--ghost btn--sm"
        }
      >
        {button}
      </button>
    </div>
  );
}

function StagePill({
  stage,
}: {
  stage: string;
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
  } as const;

  const tone =
    tones[stage as keyof typeof tones] ||
    tones.production;

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