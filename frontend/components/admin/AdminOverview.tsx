// components/admin/AdminOverview.tsx

"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import { MetricCard } from "@/components/ui/MetricCard";

import {
  getUsageMetrics,
  getRetrainingJobs,
  type RetrainingJob,
} from "@/services/admin.service";

import { getCompanies } from "@/services/company.service";

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

    padding: "1.4rem",
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

const quickLinks = [
  {
    title:
      "Manage companies",

    href:
      "/admin/companies",

    icon: "🏢",
  },

  {
    title:
      "Platform metrics",

    href:
      "/admin/metrics",

    icon: "📊",
  },

  {
    title:
      "Retraining jobs",

    href:
      "/admin/retraining",

    icon: "🔄",
  },

  {
    title:
      "Manage users",

    href:
      "/admin/users",

    icon: "👥",
  },
];

type ActivityItem = {
  title: string;

  desc: string;

  time: string;
};

export function AdminOverview() {
  const [loading, setLoading] =
    useState(true);

  const [metrics, setMetrics] =
    useState({
      activeCompanies: 0,

      predictions: 0,

      activeUsers: 0,

      retrainingJobs: 0,
    });

  const [activity, setActivity] =
    useState<ActivityItem[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [
          usageMetrics,
          companiesData,
          retrainingJobsData,
        ] = await Promise.all([
          getUsageMetrics(),

          getCompanies({
            page: 1,
            limit: 10,
            status:
              "active",
          }),

          getRetrainingJobs(),
        ]);

        const jobs: RetrainingJob[] =
          Array.isArray(
            retrainingJobsData
          )
            ? retrainingJobsData
            : [];

        setMetrics({
          activeCompanies:
            usageMetrics?.active_companies ||
            0,

          predictions:
            usageMetrics?.total_predictions ||
            0,

          activeUsers:
            usageMetrics?.active_users ||
            0,

          retrainingJobs:
            jobs.filter(
              (job) =>
                job.status ===
                "running"
            ).length,
        });

        const formatter =
          new Intl.DateTimeFormat(
            "en-US",
            {
              dateStyle:
                "medium",

              timeStyle:
                "short",
            }
          );

        const recentActivity: ActivityItem[] =
          [
            ...jobs
              .sort(
                (a, b) => {
                  const left =
                    new Date(
                      b.started_at ||
                        b.created_at ||
                        ""
                    ).getTime();

                  const right =
                    new Date(
                      a.started_at ||
                        a.created_at ||
                        ""
                    ).getTime();

                  return (
                    left -
                    right
                  );
                }
              )

              .slice(0, 2)

              .map((job) => ({
                title:
                  "Retraining job started",

                desc:
                  job.notes ||
                  "New retraining pipeline triggered.",

                time:
                  job.started_at ||
                  job.created_at
                    ? formatter.format(
                        new Date(
                          job.started_at ||
                            job.created_at ||
                            ""
                        )
                      )
                    : "Recently",
              })),

            ...(companiesData?.data ||
              [])

              .slice(0, 1)

              .map(
                (
                  company: any
                ) => ({
                  title:
                    "Company registered",

                  desc: `${company.name} joined the platform.`,

                  time:
                    company.created_at
                      ? formatter.format(
                          new Date(
                            company.created_at
                          )
                        )
                      : "Recently",
                })
              ),
          ];

        setActivity(
          recentActivity
        );
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <div
      style={{
        display:
          "grid",

        gap: "1.5rem",
      }}
    >
      {/* page header */}

      <section>
        <p
          style={{
            ...labelStyle,

            color:
              "var(--green-800)",

            marginBottom:
              ".55rem",
          }}
        >
          Super admin
        </p>

        <h1
          style={{
            fontFamily:
              "var(--font-display)",

            fontSize:
              "3rem",

            lineHeight: 1,

            letterSpacing:
              "-.04em",

            fontWeight: 400,

            marginBottom:
              ".9rem",
          }}
        >
          Platform control center
        </h1>

        <p
          style={{
            color:
              "var(--gray-600)",

            maxWidth: 760,

            lineHeight: 1.8,

            fontSize:
              ".98rem",
          }}
        >
          Monitor ML
          performance,
          manage companies,
          review retraining
          jobs, and
          supervise
          platform-wide
          operations from
          one centralized
          workspace.
        </p>
      </section>

      {/* metrics */}

      <section
        style={{
          display:
            "grid",

          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",

          gap: "1rem",
        }}
      >
        <MetricCard
          label="Active companies"
          value={
            loading
              ? "..."
              : metrics.activeCompanies.toString()
          }
          sub="Currently operational"
          icon={
            <span>
              🏢
            </span>
          }
        />

        <MetricCard
          label="Predictions"
          value={
            loading
              ? "..."
              : metrics.predictions.toLocaleString()
          }
          sub="Platform-wide usage"
          icon={
            <span>
              🌿
            </span>
          }
        />

        <MetricCard
          label="Active users"
          value={
            loading
              ? "..."
              : metrics.activeUsers.toString()
          }
          sub="Using the platform"
          icon={
            <span>
              👥
            </span>
          }
        />

        <MetricCard
          label="Training jobs"
          value={
            loading
              ? "..."
              : metrics.retrainingJobs.toString()
          }
          sub="Currently running"
          icon={
            <span>
              ⚡
            </span>
          }
        />
      </section>

      {/* quick actions + activity */}

      <section
        style={{
          display:
            "grid",

          gridTemplateColumns:
            "repeat(auto-fit, minmax(320px, 1fr))",

          gap: "1.5rem",

          alignItems:
            "start",
        }}
      >
        {/* quick actions */}

        <div
          style={
            sectionCardStyle
          }
        >
          <div
            style={{
              marginBottom:
                "1.25rem",
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
              Navigation
            </p>

            <h2
              style={{
                fontFamily:
                  "var(--font-display)",

                fontSize:
                  "1.7rem",

                fontWeight: 400,

                letterSpacing:
                  "-.03em",
              }}
            >
              Quick actions
            </h2>
          </div>

          <div
            style={{
              display:
                "grid",

              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",

              gap: "1rem",
            }}
          >
            {quickLinks.map(
              (item) => (
                <Link
                  key={
                    item.href
                  }
                  href={
                    item.href
                  }
                  style={{
                    borderRadius:
                      "18px",

                    border:
                      "1px solid var(--gray-100)",

                    background:
                      "var(--gray-50)",

                    padding:
                      "1.2rem",

                    textDecoration:
                      "none",

                    transition:
                      ".15s ease",

                    display:
                      "grid",

                    gap: ".65rem",
                  }}
                >
                  <div
                    style={{
                      width: 42,

                      height: 42,

                      borderRadius:
                        "12px",

                      background:
                        "var(--green-100)",

                      display:
                        "flex",

                      alignItems:
                        "center",

                      justifyContent:
                        "center",

                      fontSize:
                        "1.2rem",
                    }}
                  >
                    {
                      item.icon
                    }
                  </div>

                  <div>
                    <p
                      style={{
                        fontWeight: 600,

                        color:
                          "var(--gray-900)",

                        marginBottom:
                          ".25rem",
                      }}
                    >
                      {
                        item.title
                      }
                    </p>

                    <p
                      style={{
                        fontSize:
                          ".85rem",

                        color:
                          "var(--gray-400)",
                      }}
                    >
                      Open
                      workspace
                      →
                    </p>
                  </div>
                </Link>
              )
            )}
          </div>
        </div>

        {/* activity */}

        <div
          style={
            sectionCardStyle
          }
        >
          <div
            style={{
              marginBottom:
                "1.25rem",
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
              Activity
            </p>

            <h2
              style={{
                fontFamily:
                  "var(--font-display)",

                fontSize:
                  "1.7rem",

                fontWeight: 400,

                letterSpacing:
                  "-.03em",
              }}
            >
              Recent
              platform
              events
            </h2>
          </div>

          <div
            style={{
              display:
                "grid",

              gap: "1rem",
            }}
          >
            {activity.map(
              (
                item,
                index
              ) => (
                <div
                  key={index}
                  style={{
                    paddingBottom:
                      "1rem",

                    borderBottom:
                      index !==
                      activity.length -
                        1
                        ? "1px solid var(--gray-100)"
                        : "none",
                  }}
                >
                  <p
                    style={{
                      fontWeight: 600,

                      color:
                        "var(--gray-900)",

                      marginBottom:
                        ".25rem",
                    }}
                  >
                    {
                      item.title
                    }
                  </p>

                  <p
                    style={{
                      fontSize:
                        ".9rem",

                      color:
                        "var(--gray-600)",

                      lineHeight:
                        1.7,

                      marginBottom:
                        ".4rem",
                    }}
                  >
                    {
                      item.desc
                    }
                  </p>

                  <span
                    style={{
                      fontSize:
                        ".78rem",

                      color:
                        "var(--gray-400)",
                    }}
                  >
                    {
                      item.time
                    }
                  </span>
                </div>
              )
            )}

            {!loading &&
              activity.length ===
                0 && (
                <p
                  style={{
                    color:
                      "var(--gray-400)",
                  }}
                >
                  No recent
                  activity.
                </p>
              )}
          </div>
        </div>
      </section>
    </div>
  );
}