"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import { InfoTooltip } from "@/components/company/InfoTooltip";

import { StatusBadge } from "@/components/ui/StatusBadge";

import {
  getCompanyById,
  type Company,
} from "@/services/company.service";

type ShellTone =
  | "high"
  | "medium"
  | "low"
  | "pending"
  | "error";

interface CompanyShellProps {
  activePath: string;
  title: string;
  description: string;
  statusTone: ShellTone;
  statusLabel: string;
  action?: {
    href: string;
    label: string;
  };
  children: React.ReactNode;
}

const navItems = [
  {
    href: "/company",
    label: "Overview",
  },

  {
    href: "/company/users",
    label: "Users",
  },

  {
    href: "/company/requests",
    label: "Requests",
  },

  {
    href: "/company/metrics",
    label: "Metrics",
  },

  {
    href: "/company/settings",
    label: "Settings",
  },
];

export function CompanyShell({
  activePath,
  title,
  description,
  statusTone,
  statusLabel,
  action,
  children,
}: CompanyShellProps) {
  const [company, setCompany] =
    useState<Company | null>(
      null
    );

  /* TEMPORAL */
  const companyId =
    "YOUR_COMPANY_ID";

  useEffect(() => {
    async function loadCompany() {
      try {
        const data =
          await getCompanyById(
            companyId
          );

        setCompany(data);
      } catch (error) {
        console.error(error);
      }
    }

    loadCompany();
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",

        padding:
          "2rem 1rem 3rem",

        background:
          "radial-gradient(circle at top left, rgba(74,143,74,0.10), transparent 28%), var(--gray-50)",
      }}
    >
      <div
        style={{
          maxWidth: 1160,

          margin: "0 auto",

          display: "grid",

          gap: "1.5rem",
        }}
      >
        <section
          style={{
            background:
              "var(--white)",

            borderRadius: "24px",

            padding: "1.5rem",

            border:
              "1px solid rgba(45,106,45,0.08)",

            boxShadow:
              "var(--shadow-card)",

            display: "grid",

            gap: "1.5rem",
          }}
        >
          <div
            style={{
              display: "flex",

              alignItems:
                "center",

              justifyContent:
                "space-between",

              gap: "1rem",

              flexWrap: "wrap",
            }}
          >
            <Link
              href="/"
              className="logo"
              style={{
                justifyContent:
                  "flex-start",

                marginBottom: 0,
              }}
            >
              <img
                src="/logo.png"
                alt="CropSight logo"
                width={32}
                height={32}
              />

              <span className="logo__text">
                CropSight
              </span>
            </Link>

            <span
              style={{
                display:
                  "inline-flex",

                alignItems:
                  "center",

                gap: ".45rem",

                padding:
                  ".45rem .75rem",

                borderRadius:
                  "999px",

                background:
                  "var(--green-50)",

                color:
                  "var(--green-800)",

                fontSize:
                  ".76rem",

                fontWeight: 600,

                letterSpacing:
                  ".06em",

                textTransform:
                  "uppercase",
              }}
            >
              Company Admin
            </span>
          </div>

          <nav
            aria-label="Company section navigation"
            style={{
              display: "flex",

              gap: ".75rem",

              flexWrap: "wrap",
            }}
          >
            {navItems.map(
              (item) => {
                const isActive =
                  activePath ===
                  item.href;

                return (
                  <Link
                    key={
                      item.href
                    }
                    href={
                      item.href
                    }
                    style={{
                      display:
                        "inline-flex",

                      alignItems:
                        "center",

                      justifyContent:
                        "center",

                      padding:
                        ".6rem .95rem",

                      borderRadius:
                        "999px",

                      fontSize:
                        ".88rem",

                      fontWeight: 600,

                      textDecoration:
                        "none",

                      border:
                        isActive
                          ? "1px solid rgba(45,106,45,0.28)"
                          : "1px solid var(--gray-100)",

                      background:
                        isActive
                          ? "var(--green-50)"
                          : "var(--white)",

                      color:
                        isActive
                          ? "var(--green-800)"
                          : "var(--gray-600)",

                      boxShadow:
                        isActive
                          ? "0 6px 18px rgba(45,106,45,0.08)"
                          : "none",
                    }}
                  >
                    {
                      item.label
                    }
                  </Link>
                );
              }
            )}
          </nav>

          <div
            style={{
              display: "flex",

              alignItems:
                "flex-start",

              justifyContent:
                "space-between",

              gap: "1.5rem",

              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                maxWidth: 680,
              }}
            >
              <p
                style={{
                  color:
                    "var(--green-800)",

                  fontSize:
                    ".78rem",

                  fontWeight: 600,

                  letterSpacing:
                    ".08em",

                  textTransform:
                    "uppercase",

                  marginBottom:
                    ".65rem",
                }}
              >
                Company workspace
              </p>

              <div
                style={{
                  display:
                    "inline-flex",

                  alignItems:
                    "center",

                  gap: ".65rem",
                }}
              >
                <h1
                  style={{
                    fontFamily:
                      "var(--font-display)",

                    fontSize:
                      "clamp(2rem, 4vw, 3rem)",

                    fontWeight: 400,

                    lineHeight: 1.05,

                    letterSpacing:
                      "-.03em",
                  }}
                >
                  {company?.name ||
                    title}
                </h1>

                <InfoTooltip
                  text={
                    description
                  }
                />
              </div>
            </div>

            <div
              style={{
                display: "grid",

                justifyItems:
                  "start",

                gap: ".75rem",

                minWidth: 220,
              }}
            >
              <StatusBadge
                status={
                  company?.status ===
                  "suspended"
                    ? "pending"
                    : statusTone
                }
                label={
                  company?.status ===
                  "suspended"
                    ? "Company suspended"
                    : statusLabel
                }
              />

              {action ? (
                <Link
                  href={
                    action.href
                  }
                  className="btn btn--primary btn--sm"
                  style={{
                    width:
                      "auto",

                    minWidth: 0,

                    paddingInline:
                      "1rem",
                  }}
                >
                  {
                    action.label
                  }
                </Link>
              ) : null}
            </div>
          </div>
        </section>

        <div
          style={{
            display: "grid",
            gap: "1.5rem",
          }}
        >
          {children}
        </div>
      </div>
    </main>
  );
}