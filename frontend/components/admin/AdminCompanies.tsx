// components/admin/AdminCompanies.tsx

"use client";

import { MetricCard } from "@/components/ui/MetricCard";
import Link from "next/link";

const companies = [
  {
    id: 1,
    name: "AgroVision",
    location: "Jalisco, MX",
    users: 24,
    status: "active",
    predictions: 4821,
  },
  {
    id: 2,
    name: "GreenFields",
    location: "Sonora, MX",
    users: 12,
    status: "active",
    predictions: 1930,
  },
  {
    id: 3,
    name: "CropLab",
    location: "Sinaloa, MX",
    users: 8,
    status: "pending",
    predictions: 620,
  },
  {
    id: 4,
    name: "HarvestAI",
    location: "Michoacán, MX",
    users: 31,
    status: "suspended",
    predictions: 8200,
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

export function AdminCompanies() {
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
          Platform management
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
          Registered companies
        </h1>

        <p
          style={{
            color: "var(--gray-600)",
            maxWidth: 760,
            lineHeight: 1.8,
            fontSize: ".98rem",
          }}
        >
          Manage platform organizations, review activity,
          supervise access, and monitor operational usage across
          all registered companies.
        </p>
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
          label="Total companies"
          value="24"
          sub="4 added this month"
          icon={<span>🏢</span>}
        />

        <MetricCard
          label="Active companies"
          value="21"
          sub="Currently operational"
          icon={<span>✅</span>}
        />

        <MetricCard
          label="Suspended"
          value="2"
          sub="Restricted access"
          icon={<span>⛔</span>}
        />

        <MetricCard
          label="Predictions"
          value="42k"
          sub="Platform-wide this week"
          icon={<span>🌿</span>}
        />
      </section>

      {/* companies table */}
      <section style={sectionCardStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
            marginBottom: "1.4rem",
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
              Organizations
            </p>

            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.7rem",
                fontWeight: 400,
                letterSpacing: "-.03em",
              }}
            >
              Company directory
            </h2>
          </div>

              <Link
  href="/register/company"
  className="btn btn--primary btn--sm"
  style={{
    width: "auto",
    textDecoration: "none",
  }}
>
  Add company
</Link>
         
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
                  "Company",
                  "Location",
                  "Users",
                  "Predictions",
                  "Status",
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
              {companies.map((company) => (
                <tr
                  key={company.id}
                  style={{
                    borderBottom: "1px solid var(--gray-100)",
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
                        {company.name}
                      </p>

                      <span
                        style={{
                          fontSize: ".82rem",
                          color: "var(--gray-400)",
                        }}
                      >
                        ID #{company.id}
                      </span>
                    </div>
                  </td>

                  <td
                    style={{
                      padding: "1rem",
                      color: "var(--gray-600)",
                    }}
                  >
                    {company.location}
                  </td>

                  <td
                    style={{
                      padding: "1rem",
                      fontWeight: 500,
                    }}
                  >
                    {company.users}
                  </td>

                  <td
                    style={{
                      padding: "1rem",
                      fontWeight: 500,
                    }}
                  >
                    {company.predictions.toLocaleString()}
                  </td>

                  <td
                    style={{
                      padding: "1rem",
                    }}
                  >
                    <StatusPill status={company.status} />
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

function StatusPill({
  status,
}: {
  status: "active" | "pending" | "suspended";
}) {
  const styles = {
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

  const tone = styles[status];

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