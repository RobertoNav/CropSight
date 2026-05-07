import Link from "next/link";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/Badge";

const mockUser = {
  name: "Paola",
  company: "CropSight Labs",
  email: "paola@cropsight.ai",
  joinedAt: "2025-12-10",
};

const mockPredictions = [
  {
    id: 1,
    label: "Healthy",
    confidence: 0.97,
    createdAt: "2026-05-01",
  },
  {
    id: 2,
    label: "Powdery mildew",
    confidence: 0.91,
    createdAt: "2026-05-02",
  },
  {
    id: 3,
    label: "Rust",
    confidence: 0.88,
    createdAt: "2026-05-04",
  },
];

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

export function UserDashboard() {
  return (
    <div
      style={{
        display: "grid",
        gap: "1.5rem",
      }}
    >
      {/* top */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
          gap: "1.5rem",
        }}
      >
        <SectionCard
          eyebrow="Profile"
          title="Field user overview"
          description="A quick operational snapshot of your account and prediction activity."
        >
          <div style={{ display: "grid", gap: "1.25rem" }}>
            <div>
              <p style={labelStyle}>Welcome back</p>

              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "2rem",
                  fontWeight: 400,
                  lineHeight: 1.05,
                  letterSpacing: "-.03em",
                  marginTop: ".2rem",
                }}
              >
                {mockUser.name}
              </h2>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(190px,1fr))",
                gap: "1rem",
              }}
            >
              <InfoTile
                label="Company"
                value={mockUser.company}
              />

              <InfoTile
                label="Email"
                value={mockUser.email}
              />

              <InfoTile
                label="Member since"
                value={formatDate(mockUser.joinedAt)}
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Quick actions"
          title="Continue your workflow"
          description="Jump into the next actions without leaving your dashboard."
        >
          <div style={{ display: "grid", gap: "1rem" }}>
            <QuickLink
              href="/predict"
              label="Run a new prediction"
            />

            <QuickLink
              href="/predictions"
              label="Review prediction history"
            />

            <QuickLink
              href="/profile"
              label="Update your profile"
            />
          </div>
        </SectionCard>
      </section>

      {/* metrics */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px,1fr))",
          gap: "1rem",
        }}
      >
        <MetricCard
          label="Total predictions"
          value={mockPredictions.length}
          sub="Captured analyses"
          trend={{
            label: "+12%",
            up: true,
          }}
          icon={<span>🌿</span>}
        />

        <MetricCard
          label="Best confidence"
          value="97%"
          sub="Latest model"
          trend={{
            label: "Stable",
            up: true,
          }}
          icon={<span>🎯</span>}
        />

        <MetricCard
          label="Detected diseases"
          value="3"
          sub="Unique labels"
          icon={<span>🦠</span>}
        />

        <MetricCard
          label="Feedback rate"
          value="94%"
          sub="Validated predictions"
          icon={<span>✅</span>}
        />
      </section>

      {/* history */}
      <SectionCard
        eyebrow="Prediction history"
        title="Recent predictions"
        description="A compact timeline of your latest crop analyses."
      >
        <div style={{ display: "grid", gap: ".9rem" }}>
          {mockPredictions.map((prediction) => (
            <div
              key={prediction.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingBottom: ".9rem",
                borderBottom:
                  "1px solid var(--gray-100)",
              }}
            >
              <div>
                <p
                  style={{
                    fontWeight: 600,
                    color: "var(--gray-900)",
                  }}
                >
                  {prediction.label}
                </p>

                <p
                  style={{
                    ...bodyTextStyle,
                    fontSize: ".85rem",
                  }}
                >
                  {formatDate(
                    prediction.createdAt,
                  )}
                </p>
              </div>

              <Badge>
                {(
                  prediction.confidence * 100
                ).toFixed(1)}
                %
              </Badge>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function SectionCard({
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
      <div style={{ marginBottom: "1.15rem" }}>
        <p
          style={{
            ...labelStyle,
            color: "var(--green-800)",
            marginBottom: ".45rem",
          }}
        >
          {eyebrow}
        </p>

        <h3
          style={{
            fontFamily:
              "var(--font-display)",
            fontSize: "1.45rem",
            fontWeight: 400,
            lineHeight: 1.1,
            letterSpacing: "-.02em",
          }}
        >
          {title}
        </h3>

        <p
          style={{
            ...bodyTextStyle,
            marginTop: ".45rem",
          }}
        >
          {description}
        </p>
      </div>

      {children}
    </section>
  );
}

function InfoTile({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        padding: ".95rem 1rem",
        borderRadius: "16px",
        background: "var(--gray-50)",
        border:
          "1px solid var(--gray-100)",
      }}
    >
      <p style={labelStyle}>
        {label}
      </p>

      <p
        style={{
          marginTop: ".35rem",
          fontWeight: 600,
          color: "var(--gray-900)",
        }}
      >
        {value}
      </p>
    </div>
  );
}

function QuickLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="link"
      style={{
        textDecoration: "none",
        fontWeight: 600,
      }}
    >
      {label} →
    </Link>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}