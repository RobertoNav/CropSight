import Link from "next/link";
import { CompanyShell } from "@/components/company/CompanyShell";
import { InfoTooltip } from "@/components/company/InfoTooltip";
import { MetricCard } from "@/components/ui/MetricCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  companyAdminMock,
  getCompanyOverviewSummary,
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

const toneByPriority = {
  success: { bg: "rgba(74,143,74,0.1)", color: "var(--green-900)" },
  warning: { bg: "rgba(214,137,16,0.12)", color: "var(--warning)" },
  info: { bg: "rgba(26,68,128,0.1)", color: "#1a4480" },
} as const;

export function CompanyOverview() {
  const summary = getCompanyOverviewSummary(companyAdminMock);
  const pendingRequests = companyAdminMock.requests.filter(
    (request) => request.status === "pending",
  );
  const priorityItems = [
    {
      id: "requests",
      label: "Requests",
      title: `${summary.pendingRequests} pending join requests`,
      href: "/company/requests",
      hrefLabel: "Open queue",
      tone: "warning" as const,
    },
    {
      id: "members",
      label: "Team",
      title: `${summary.inactiveMembers} inactive member`,
      href: "/company/users",
      hrefLabel: "Review users",
      tone: "info" as const,
    },
    {
      id: "health",
      label: "Crop health",
      title: `Top label: ${companyAdminMock.metrics.topLabel}`,
      href: "/company/metrics",
      hrefLabel: "View metrics",
      tone: "success" as const,
    },
  ];

  return (
    <CompanyShell
      activePath="/company"
      title={companyAdminMock.company.name}
      description="A shared operational view for your company administrators to monitor team health, queue pressure, and next actions without leaving the panel."
      statusTone={toneByStatus[companyAdminMock.company.status]}
      statusLabel={
        companyAdminMock.company.status === "active"
          ? "Company active"
          : "Company suspended"
      }
      action={{ href: "/company/requests", label: "Review requests" }}
    >
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "1.5rem",
        }}
      >
        <SectionCard
          eyebrow="Company profile"
          title="Company snapshot"
          description="A compact identity block with the essentials your admins need before moving into workflows."
        >
          <div style={{ display: "grid", gap: "1.25rem" }}>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "1rem",
                flexWrap: "wrap",
              }}
            >
              <div>
                <p style={labelStyle}>Primary company</p>
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
                  {companyAdminMock.company.name}
                </h2>
              </div>
              <StatusBadge
                status={toneByStatus[companyAdminMock.company.status]}
                label={
                  companyAdminMock.company.status === "active"
                    ? "Operational"
                    : "Suspended"
                }
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                gap: "1rem",
              }}
            >
              <InfoTile
                label="Sector"
                value={companyAdminMock.company.sector}
              />
              <InfoTile
                label="Region"
                value={companyAdminMock.company.location}
              />
              <InfoTile
                label="Lead admin"
                value={companyAdminMock.company.adminName}
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="At a glance"
          title="Priority queue"
          description="A compact list of the few items that deserve your attention first."
        >
          <div style={{ display: "grid" }}>
            {priorityItems.map((item, index) => {
              const tone = toneByPriority[item.tone];

              return (
                <div
                  key={item.id}
                  style={{
                    display: "grid",
                    gap: ".55rem",
                    padding: index === 0 ? ".15rem 0 1rem" : "1rem 0",
                    borderBottom:
                      index === priorityItems.length - 1
                        ? "none"
                        : "1px solid rgba(28,28,26,0.08)",
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
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: ".55rem",
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "999px",
                          background: tone.color,
                          boxShadow: `0 0 0 6px ${tone.bg}`,
                        }}
                      />
                      <span
                        style={{
                          ...labelStyle,
                          color: tone.color,
                          fontSize: ".69rem",
                        }}
                      >
                        {item.label}
                      </span>
                    </div>
                    <Link
                      href={item.href}
                      className="link"
                      style={{
                        fontSize: ".82rem",
                        color: "var(--gray-600)",
                        textDecoration: "none",
                      }}
                    >
                      {item.hrefLabel} →
                    </Link>
                  </div>
                  <p
                    style={{
                      fontWeight: 600,
                      color: "var(--gray-900)",
                      fontSize: "1rem",
                      letterSpacing: "-.01em",
                    }}
                  >
                    {item.title}
                  </p>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
        }}
      >
        <MetricCard
          label="Total members"
          value={summary.totalMembers}
          sub={`${summary.activeMembers} active across the company`}
          trend={{ label: `${summary.adminMembers} admins`, up: true }}
          icon={<span style={{ fontSize: "1.1rem" }}>👥</span>}
        />
        <MetricCard
          label="Pending requests"
          value={summary.pendingRequests}
          sub="Access queue waiting for review"
          trend={{ label: "Needs attention", up: false }}
          icon={<span style={{ fontSize: "1.1rem" }}>📥</span>}
        />
        <MetricCard
          label="Predictions this week"
          value={companyAdminMock.metrics.predictionsThisWeek}
          sub="Captured by field users"
          trend={{
            label: `${companyAdminMock.metrics.weeklyGrowth}% vs last week`,
            up: true,
          }}
          icon={<span style={{ fontSize: "1.1rem" }}>🌿</span>}
        />
        <MetricCard
          label="Feedback rate"
          value={`${Math.round(companyAdminMock.metrics.feedbackRate * 100)}%`}
          sub={`Top label: ${companyAdminMock.metrics.topLabel}`}
          trend={{ label: "Healthy review loop", up: true }}
          icon={<span style={{ fontSize: "1.1rem" }}>✅</span>}
        />
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "1.5rem",
        }}
      >
        <SectionCard
          eyebrow="Team snapshot"
          title="Who is carrying the workflow"
          description="A lightweight roster view so the company lead can spot role balance and inactive members quickly."
        >
          <div style={{ display: "grid", gap: ".85rem" }}>
            {companyAdminMock.users.map((member) => (
              <div
                key={member.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "1rem",
                  paddingBottom: ".85rem",
                  borderBottom: "1px solid var(--gray-100)",
                }}
              >
                <div>
                  <p style={{ fontWeight: 600, color: "var(--gray-900)" }}>
                    {member.name}
                  </p>
                  <p style={{ ...bodyTextStyle, fontSize: ".86rem" }}>
                    {member.email}
                  </p>
                </div>
                <div
                  style={{
                    display: "grid",
                    justifyItems: "end",
                    gap: ".45rem",
                  }}
                >
                  <RolePill role={member.role} />
                  <StatusBadge
                    status={member.status === "active" ? "high" : "pending"}
                    label={member.status === "active" ? "Active" : "Inactive"}
                  />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Pending queue"
          title="Requests waiting for a decision"
          description="A quick preview of the join queue before jumping into the full requests page."
        >
          <div style={{ display: "grid", gap: ".9rem" }}>
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                style={{
                  padding: "1rem",
                  borderRadius: "16px",
                  border: "1px solid var(--gray-100)",
                  background: "var(--gray-50)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "1rem",
                    marginBottom: ".45rem",
                  }}
                >
                  <p style={{ fontWeight: 600, color: "var(--gray-900)" }}>
                    {request.name}
                  </p>
                  <StatusBadge status="pending" label="Pending" />
                </div>
                <p style={{ ...bodyTextStyle, fontSize: ".86rem" }}>
                  {request.email}
                </p>
                <p
                  style={{
                    ...bodyTextStyle,
                    fontSize: ".8rem",
                    marginTop: ".35rem",
                  }}
                >
                  Requested on {formatDate(request.requestedAt)}
                </p>
              </div>
            ))}

            <Link
              href="/company/requests"
              className="btn btn--ghost btn--sm"
              style={{
                width: "auto",
                justifySelf: "start",
                marginTop: ".25rem",
              }}
            >
              Open full queue
            </Link>
          </div>
        </SectionCard>
      </section>
    </CompanyShell>
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
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: ".55rem",
          }}
        >
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.45rem",
              fontWeight: 400,
              lineHeight: 1.1,
              letterSpacing: "-.02em",
            }}
          >
            {title}
          </h3>
          <InfoTooltip text={description} />
        </div>
      </div>
      {children}
    </section>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: ".95rem 1rem",
        borderRadius: "16px",
        background: "var(--gray-50)",
        border: "1px solid var(--gray-100)",
      }}
    >
      <p style={labelStyle}>{label}</p>
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

function RolePill({ role }: { role: "company_admin" | "user" }) {
  const isAdmin = role === "company_admin";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: ".3rem .6rem",
        borderRadius: "999px",
        background: isAdmin ? "var(--green-50)" : "var(--gray-100)",
        color: isAdmin ? "var(--green-800)" : "var(--gray-600)",
        fontSize: ".74rem",
        fontWeight: 600,
      }}
    >
      {isAdmin ? "Company admin" : "Field user"}
    </span>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
