"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import { CompanyShell } from "@/components/company/CompanyShell";

import { InfoTooltip } from "@/components/company/InfoTooltip";

import { MetricCard } from "@/components/ui/MetricCard";

import { StatusBadge } from "@/components/ui/StatusBadge";

import {
  getCompanyById,
  getCompanyUsers,
  getJoinRequests,
} from "@/services/company.service";

const sectionCardStyle: React.CSSProperties =
  {
    background:
      "var(--white)",

    borderRadius:
      "20px",

    border:
      "1px solid rgba(45,106,45,0.08)",

    boxShadow:
      "var(--shadow-card)",

    padding: "1.35rem",
  };

const labelStyle: React.CSSProperties =
  {
    fontSize: ".75rem",

    color:
      "var(--gray-400)",

    textTransform:
      "uppercase",

    letterSpacing:
      ".08em",

    fontWeight: 600,
  };

const toneByStatus = {
  active: "high",

  suspended:
    "pending",
} as const;

const toneByPriority = {
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

    color:
      "#1a4480",
  },
} as const;

interface Company {
  id: string;

  name: string;

  sector: string;

  status:
    | "active"
    | "suspended";

  logo_url?: string | null;
}

interface CompanyUser {
  id: string;

  name: string;

  email: string;

  role: string;

  is_active: boolean;
}

interface JoinRequest {
  id: string;

  status:
    | "pending"
    | "approved"
    | "rejected";
}

export function CompanyOverview() {
  const [loading, setLoading] =
    useState(true);

  const [company, setCompany] =
    useState<Company | null>(
      null
    );

  const [users, setUsers] =
    useState<
      CompanyUser[]
    >([]);

  const [requests, setRequests] =
    useState<
      JoinRequest[]
    >([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const storedUser =
        localStorage.getItem(
          "user"
        );

      if (!storedUser) {
        setLoading(false);
        return;
      }

      const parsedUser =
        JSON.parse(
          storedUser
        );

      const companyId =
        parsedUser?.company_id;

      if (!companyId) {
        setLoading(false);
        return;
      }

      const [
        companyData,
        usersData,
        requestsData,
      ] =
        await Promise.all([
          getCompanyById(
            companyId
          ),

          getCompanyUsers(
            companyId
          ),

          getJoinRequests(
            companyId,
            "pending"
          ),
        ]);

      setCompany(
        companyData
      );

      setUsers(
        usersData || []
      );

      setRequests(
        requestsData || []
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const summary = {
    totalMembers:
      users.length,

    activeMembers:
      users.filter(
        (user) =>
          user.is_active
      ).length,

    adminMembers:
      users.filter(
        (user) =>
          user.role ===
          "company_admin"
      ).length,

    inactiveMembers:
      users.filter(
        (user) =>
          !user.is_active
      ).length,

    pendingRequests:
      requests.length,
  };

  const priorityItems = [
    {
      id: "requests",

      label:
        "Requests",

      title: `${summary.pendingRequests} pending join requests`,

      href:
        "/company/requests",

      hrefLabel:
        "Open queue",

      tone:
        "warning" as const,
    },

    {
      id: "members",

      label: "Team",

      title: `${summary.inactiveMembers} inactive members`,

      href:
        "/company/users",

      hrefLabel:
        "Review users",

      tone:
        "info" as const,
    },

    {
      id: "health",

      label:
        "Company",

      title: `${summary.activeMembers} active users`,

      href:
        "/company/users",

      hrefLabel:
        "View users",

      tone:
        "success" as const,
    },
  ];

  if (loading) {
    return (
      <div
        style={{
          padding:
            "2rem",
        }}
      >
        Loading company dashboard...
      </div>
    );
  }

  if (!company) {
    return (
      <div
        style={{
          padding:
            "2rem",
        }}
      >
        Company not found.
      </div>
    );
  }

  return (
    <CompanyShell
      activePath="/company"
      title={
        company.name
      }
      description="A shared operational view for your company administrators to monitor team health, queue pressure, and next actions without leaving the panel."
      statusTone={
        toneByStatus[
          company.status
        ]
      }
      statusLabel={
        company.status ===
        "active"
          ? "Company active"
          : "Company suspended"
      }
      action={{
        href:
          "/company/requests",

        label:
          "Review requests",
      }}
    >
      <section
        style={{
          display: "grid",

          gridTemplateColumns:
            "repeat(auto-fit, minmax(320px, 1fr))",

          gap: "1.5rem",
        }}
      >
        <SectionCard
          eyebrow="Company profile"
          title="Company snapshot"
          description="A compact identity block with the essentials your admins need before moving into workflows."
        >
          <div
            style={{
              display:
                "grid",

              gap: "1.25rem",
            }}
          >
            <div
              style={{
                display:
                  "flex",

                alignItems:
                  "flex-start",

                justifyContent:
                  "space-between",

                gap: "1rem",

                flexWrap:
                  "wrap",
              }}
            >
              <div>
                <p
                  style={
                    labelStyle
                  }
                >
                  Primary company
                </p>

                <h2
                  style={{
                    fontFamily:
                      "var(--font-display)",

                    fontSize:
                      "2rem",

                    fontWeight: 400,

                    lineHeight: 1.05,

                    letterSpacing:
                      "-.03em",

                    marginTop:
                      ".2rem",
                  }}
                >
                  {
                    company.name
                  }
                </h2>
              </div>

              <StatusBadge
                status={
                  toneByStatus[
                    company.status
                  ]
                }
                label={
                  company.status ===
                  "active"
                    ? "Operational"
                    : "Suspended"
                }
              />
            </div>

            <div
              style={{
                display:
                  "grid",

                gridTemplateColumns:
                  "repeat(auto-fit, minmax(190px, 1fr))",

                gap: "1rem",
              }}
            >
              <InfoTile
                label="Sector"
                value={
                  company.sector
                }
              />

              <InfoTile
                label="Company status"
                value={
                  company.status
                }
              />

              <InfoTile
                label="Members"
                value={String(
                  summary.totalMembers
                )}
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="At a glance"
          title="Priority queue"
          description="A compact list of the few items that deserve your attention first."
        >
          <div
            style={{
              display:
                "grid",
            }}
          >
            {priorityItems.map(
              (
                item,
                index
              ) => {
                const tone =
                  toneByPriority[
                    item.tone
                  ];

                return (
                  <div
                    key={
                      item.id
                    }
                    style={{
                      display:
                        "grid",

                      gap: ".55rem",

                      padding:
                        index ===
                        0
                          ? ".15rem 0 1rem"
                          : "1rem 0",

                      borderBottom:
                        index ===
                        priorityItems.length -
                          1
                          ? "none"
                          : "1px solid rgba(28,28,26,0.08)",
                    }}
                  >
                    <div
                      style={{
                        display:
                          "flex",

                        alignItems:
                          "center",

                        justifyContent:
                          "space-between",

                        gap: "1rem",

                        flexWrap:
                          "wrap",
                      }}
                    >
                      <div
                        style={{
                          display:
                            "inline-flex",

                          alignItems:
                            "center",

                          gap: ".55rem",
                        }}
                      >
                        <span
                          style={{
                            width: 8,

                            height: 8,

                            borderRadius:
                              "999px",

                            background:
                              tone.color,

                            boxShadow: `0 0 0 6px ${tone.bg}`,
                          }}
                        />

                        <span
                          style={{
                            ...labelStyle,

                            color:
                              tone.color,

                            fontSize:
                              ".69rem",
                          }}
                        >
                          {
                            item.label
                          }
                        </span>
                      </div>

                      <Link
                        href={
                          item.href
                        }
                        className="link"
                        style={{
                          fontSize:
                            ".82rem",

                          color:
                            "var(--gray-600)",

                          textDecoration:
                            "none",
                        }}
                      >
                        {
                          item.hrefLabel
                        }{" "}
                        →
                      </Link>
                    </div>

                    <p
                      style={{
                        fontWeight: 600,

                        color:
                          "var(--gray-900)",

                        fontSize:
                          "1rem",

                        letterSpacing:
                          "-.01em",
                      }}
                    >
                      {
                        item.title
                      }
                    </p>
                  </div>
                );
              }
            )}
          </div>
        </SectionCard>
      </section>

      <section
        style={{
          display: "grid",

          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",

          gap: "1rem",
        }}
      >
        <MetricCard
          label="Total members"
          value={
            summary.totalMembers
          }
          sub={`${summary.activeMembers} active across the company`}
          trend={{
            label: `${summary.adminMembers} admins`,

            up: true,
          }}
          icon={
            <span
              style={{
                fontSize:
                  "1.1rem",
              }}
            >
              👥
            </span>
          }
        />

        <MetricCard
          label="Pending requests"
          value={
            summary.pendingRequests
          }
          sub="Access queue waiting for review"
          trend={{
            label:
              "Needs attention",

            up: false,
          }}
          icon={
            <span
              style={{
                fontSize:
                  "1.1rem",
              }}
            >
              📥
            </span>
          }
        />

        <MetricCard
          label="Active users"
          value={
            summary.activeMembers
          }
          sub="Currently active"
          trend={{
            label: `${summary.inactiveMembers} inactive`,

            up: true,
          }}
          icon={
            <span
              style={{
                fontSize:
                  "1.1rem",
              }}
            >
              🌿
            </span>
          }
        />

        <MetricCard
          label="Admins"
          value={
            summary.adminMembers
          }
          sub="Company administrators"
          trend={{
            label:
              "Healthy access control",

            up: true,
          }}
          icon={
            <span
              style={{
                fontSize:
                  "1.1rem",
              }}
            >
              ✅
            </span>
          }
        />
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
    <section
      style={
        sectionCardStyle
      }
    >
      <div
        style={{
          marginBottom:
            "1.15rem",
        }}
      >
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
            display:
              "inline-flex",

            alignItems:
              "center",

            gap: ".55rem",
          }}
        >
          <h3
            style={{
              fontFamily:
                "var(--font-display)",

              fontSize:
                "1.45rem",

              fontWeight: 400,

              lineHeight: 1.1,

              letterSpacing:
                "-.02em",
            }}
          >
            {title}
          </h3>

          <InfoTooltip
            text={
              description
            }
          />
        </div>
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
        padding:
          ".95rem 1rem",

        borderRadius:
          "16px",

        background:
          "var(--gray-50)",

        border:
          "1px solid var(--gray-100)",
      }}
    >
      <p
        style={
          labelStyle
        }
      >
        {label}
      </p>

      <p
        style={{
          marginTop:
            ".35rem",

          fontWeight: 600,

          color:
            "var(--gray-900)",
        }}
      >
        {value}
      </p>
    </div>
  );
}