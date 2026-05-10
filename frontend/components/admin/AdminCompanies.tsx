"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { MetricCard } from "@/components/ui/MetricCard";

import {
  getCompanies,
  updateCompanyStatus,
} from "@/services/company.service";

/* ───────────────── TYPES ───────────────── */

type CompanyStatus =
  | "active"
  | "suspended";

interface Company {
  id: string;
  name: string;
  sector: string;
  status: CompanyStatus;
  created_at?: string;
}

interface CompaniesResponse {
  data: Company[];
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}

/* ───────────────── STYLES ───────────────── */

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

/* ───────────────── COMPONENT ───────────────── */

export function AdminCompanies() {
  const [companies, setCompanies] =
    useState<Company[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<
      "all" | "active" | "suspended"
    >("all");

  /* ───────────────── FETCH ───────────────── */

  async function loadCompanies() {
    try {
      setLoading(true);
      setError("");

      const response =
        (await getCompanies({
          page: 1,
          limit: 50,
          search:
            search.trim() || undefined,
          status:
            statusFilter === "all"
              ? undefined
              : statusFilter,
        })) as CompaniesResponse;

      setCompanies(response.data || []);
    } catch (err: any) {
      setError(
        err.message ||
          "Could not load companies"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCompanies();
  }, [search, statusFilter]);

  /* ───────────────── METRICS ───────────────── */

  const metrics = useMemo(() => {
    const active = companies.filter(
      (c) => c.status === "active"
    ).length;

    const suspended = companies.filter(
      (c) => c.status === "suspended"
    ).length;

    return {
      total: companies.length,
      active,
      suspended,
    };
  }, [companies]);

  /* ───────────────── ACTIONS ───────────────── */

  async function toggleStatus(
    company: Company
  ) {
    const newStatus =
      company.status === "active"
        ? "suspended"
        : "active";

    try {
      await updateCompanyStatus(
        company.id,
        newStatus
      );

      setCompanies((prev) =>
        prev.map((c) =>
          c.id === company.id
            ? {
                ...c,
                status: newStatus,
              }
            : c
        )
      );
    } catch (err: any) {
      alert(
        err.message ||
          "Could not update company"
      );
    }
  }

  /* ───────────────── RENDER ───────────────── */

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
            fontFamily:
              "var(--font-display)",
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
          Manage organizations,
          supervise access, and monitor
          operational activity across the
          platform.
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
          value={String(metrics.total)}
          sub="Registered organizations"
          icon={<span>🏢</span>}
        />

        <MetricCard
          label="Active companies"
          value={String(metrics.active)}
          sub="Operational"
          icon={<span>✅</span>}
        />

        <MetricCard
          label="Suspended"
          value={String(
            metrics.suspended
          )}
          sub="Restricted access"
          icon={<span>⛔</span>}
        />
      </section>

      {/* table */}

      <section style={sectionCardStyle}>
        {/* top controls */}

        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: "1rem",
            marginBottom: "1.5rem",
            flexWrap: "wrap",
          }}
        >
          <div>
            <p
              style={{
                ...labelStyle,
                color:
                  "var(--green-800)",
                marginBottom: ".35rem",
              }}
            >
              Organizations
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

        {/* filters */}

        <div
          style={{
            display: "flex",
            gap: ".75rem",
            marginBottom: "1.25rem",
            flexWrap: "wrap",
          }}
        >
          <input
            className="form-input"
            placeholder="Search companies..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            style={{
              maxWidth: 300,
            }}
          />

          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value as any
              )
            }
            style={{
              width: 180,
            }}
          >
            <option value="all">
              All statuses
            </option>

            <option value="active">
              Active
            </option>

            <option value="suspended">
              Suspended
            </option>
          </select>
        </div>

        {/* error */}

        {error && (
          <div
            className="alert alert--error"
            style={{
              marginBottom: "1rem",
            }}
          >
            {error}
          </div>
        )}

        {/* loading */}

        {loading ? (
          <div
            style={{
              padding: "3rem 0",
              textAlign: "center",
              color: "var(--gray-400)",
            }}
          >
            Loading companies...
          </div>
        ) : companies.length === 0 ? (
          <div
            style={{
              padding: "3rem 0",
              textAlign: "center",
              color: "var(--gray-400)",
            }}
          >
            No companies found.
          </div>
        ) : (
          <div
            style={{
              overflowX: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse:
                  "collapse",
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom:
                      "1px solid var(--gray-100)",
                  }}
                >
                  {[
                    "Company",
                    "Sector",
                    "Status",
                    "Actions",
                  ].map((item) => (
                    <th
                      key={item}
                      style={{
                        textAlign: "left",
                        padding: "1rem",
                        fontSize: ".75rem",
                        color:
                          "var(--gray-400)",
                        textTransform:
                          "uppercase",
                        letterSpacing:
                          ".08em",
                        fontWeight: 600,
                      }}
                    >
                      {item}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {companies.map(
                  (company) => (
                    <tr
                      key={company.id}
                      style={{
                        borderBottom:
                          "1px solid var(--gray-100)",
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
                              color:
                                "var(--gray-900)",
                              marginBottom:
                                ".2rem",
                            }}
                          >
                            {
                              company.name
                            }
                          </p>

                          <span
                            style={{
                              fontSize:
                                ".82rem",
                              color:
                                "var(--gray-400)",
                            }}
                          >
                            {
                              company.id
                            }
                          </span>
                        </div>
                      </td>

                      <td
                        style={{
                          padding: "1rem",
                          color:
                            "var(--gray-600)",
                        }}
                      >
                        {
                          company.sector
                        }
                      </td>

                      <td
                        style={{
                          padding: "1rem",
                        }}
                      >
                        <StatusPill
                          status={
                            company.status
                          }
                        />
                      </td>

                      <td
                        style={{
                          padding: "1rem",
                        }}
                      >
                        <button
                          className="btn btn--ghost btn--sm"
                          style={{
                            width: "auto",
                          }}
                          onClick={() =>
                            toggleStatus(
                              company
                            )
                          }
                        >
                          {company.status ===
                          "active"
                            ? "Suspend"
                            : "Activate"}
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

/* ───────────────── STATUS ───────────────── */

function StatusPill({
  status,
}: {
  status: CompanyStatus;
}) {
  const styles = {
    active: {
      bg: "var(--green-100)",
      color: "var(--green-800)",
      label: "Active",
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