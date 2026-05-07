// components/admin/AdminUsers.tsx

"use client";

import { MetricCard } from "@/components/ui/MetricCard";

const users = [
  {
    id: 1,
    name: "Paola Covarrubias",
    email: "paola@cropsight.ai",
    role: "super_admin",
    company: "CropSight",
    status: "active",
  },
  {
    id: 2,
    name: "Fernando Ruiz",
    email: "ferdi@agrovision.com",
    role: "company_admin",
    company: "AgroVision",
    status: "active",
  },
  {
    id: 3,
    name: "Mariana Torres",
    email: "mariana@greenleaf.io",
    role: "field_user",
    company: "GreenLeaf",
    status: "pending",
  },
  {
    id: 4,
    name: "Carlos Gómez",
    email: "carlos@harvestlabs.ai",
    role: "field_user",
    company: "Harvest Labs",
    status: "suspended",
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

export function AdminUsers() {
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
            Platform administration
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
            User management
          </h1>

          <p
            style={{
              color: "var(--gray-600)",
              maxWidth: 760,
              lineHeight: 1.8,
              fontSize: ".98rem",
            }}
          >
            Supervise platform-wide accounts, manage access
            permissions, and monitor operational activity
            across all registered companies.
          </p>
        </div>

        <button className="btn btn--primary btn--sm">
          Add user
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
          label="Total users"
          value="1,284"
          sub="Across all companies"
          icon={<span>👥</span>}
        />

        <MetricCard
          label="Admins"
          value="84"
          sub="Platform + company admins"
          icon={<span>🛡️</span>}
        />

        <MetricCard
          label="Pending approvals"
          value="12"
          sub="Awaiting review"
          icon={<span>⏳</span>}
        />

        <MetricCard
          label="Suspended users"
          value="4"
          sub="Restricted accounts"
          icon={<span>⚠️</span>}
        />
      </section>

      {/* table */}
      <section style={sectionCardStyle}>
        <div
          style={{
            marginBottom: "1.4rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
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
              Accounts
            </p>

            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.7rem",
                fontWeight: 400,
                letterSpacing: "-.03em",
              }}
            >
              Platform users
            </h2>
          </div>

          <input
            placeholder="Search users..."
            className="form-input"
            style={{
              maxWidth: 260,
            }}
          />
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
                  "User",
                  "Role",
                  "Company",
                  "Status",
                  "Actions",
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
              {users.map((user) => (
                <tr
                  key={user.id}
                  style={{
                    borderBottom:
                      "1px solid rgba(28,28,26,0.06)",
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
                        {user.name}
                      </p>

                      <span
                        style={{
                          color: "var(--gray-400)",
                          fontSize: ".84rem",
                        }}
                      >
                        {user.email}
                      </span>
                    </div>
                  </td>

                  <td
                    style={{
                      padding: "1rem",
                    }}
                  >
                    <RolePill role={user.role} />
                  </td>

                  <td
                    style={{
                      padding: "1rem",
                      color: "var(--gray-600)",
                    }}
                  >
                    {user.company}
                  </td>

                  <td
                    style={{
                      padding: "1rem",
                    }}
                  >
                    <StatusPill status={user.status} />
                  </td>

                  <td
                    style={{
                      padding: "1rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: ".55rem",
                        flexWrap: "wrap",
                      }}
                    >
                      <button className="btn btn--ghost btn--sm">
                        Edit
                      </button>

                      <button className="btn btn--secondary btn--sm">
                        View
                      </button>
                    </div>
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

function RolePill({
  role,
}: {
  role:
    | "super_admin"
    | "company_admin"
    | "field_user";
}) {
  const tones = {
    super_admin: {
      bg: "#eef7ff",
      color: "#1a4480",
      label: "Super admin",
    },
    company_admin: {
      bg: "var(--green-100)",
      color: "var(--green-800)",
      label: "Company admin",
    },
    field_user: {
      bg: "var(--gray-100)",
      color: "var(--gray-600)",
      label: "Field user",
    },
  };

  const tone = tones[role];

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

function StatusPill({
  status,
}: {
  status: "active" | "pending" | "suspended";
}) {
  const tones = {
    active: {
      bg: "var(--green-100)",
      color: "var(--green-800)",
      label: "Active",
    },
    pending: {
      bg: "#fff7e6",
      color: "var(--warning)",
      label: "Pending",
    },
    suspended: {
      bg: "#fdf2f2",
      color: "var(--error)",
      label: "Suspended",
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