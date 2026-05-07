"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ReactNode,
  useEffect,
  useState,
} from "react";

import { Logo } from "@/components/ui/Logo";

/* ───────────────── USER NAV ───────────────── */

const userNavItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: "ti ti-home",
  },
  {
    href: "/predict",
    label: "Crop Planning",
    icon: "ti ti-seeding",
  },
  {
    href: "/predictions",
    label: "Diagnosis History",
    icon: "ti ti-history",
  },
];

/* ───────────────── COMPANY NAV ───────────────── */

const companyNavItems = [
  {
    href: "/company",
    label: "Company",
    icon: "ti ti-building",
  },
  {
    href: "/company/users",
    label: "Users",
    icon: "ti ti-users",
  },
  {
    href: "/company/requests",
    label: "Requests",
    icon: "ti ti-mail",
  },
  {
    href: "/company/metrics",
    label: "Metrics",
    icon: "ti ti-chart-bar",
  },
];

/* ───────────────── ADMIN NAV ───────────────── */

const adminNavItems = [
  {
    href: "/admin",
    label: "Overview",
    icon: "ti ti-layout-dashboard",
  },
  {
    href: "/admin/models",
    label: "Models",
    icon: "ti ti-brain",
  },
  {
    href: "/admin/metrics",
    label: "Metrics",
    icon: "ti ti-chart-bar",
  },
  {
    href: "/admin/retraining",
    label: "Retraining",
    icon: "ti ti-refresh",
  },
  {
    href: "/admin/companies",
    label: "Companies",
    icon: "ti ti-building",
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: "ti ti-users",
  },
  {
    href: "/admin/experiments",
    label: "Experiments",
    icon: "ti ti-flask",
  },
];

/* ───────────────── BOTTOM NAV ───────────────── */

const bottomItems = [
  {
    href: "/profile",
    label: "Account Settings",
    icon: "ti ti-settings",
  },
];

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({
  children,
}: AppShellProps) {
  const pathname = usePathname();

  const [role, setRole] =
    useState("user");

  const [mounted, setMounted] =
    useState(false);

  useEffect(() => {
    setMounted(true);

    const savedRole =
      localStorage.getItem("role");

    if (savedRole) {
      setRole(savedRole);
    }
  }, []);

  /* FIX HYDRATION */

  if (!mounted) {
    return null;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--gray-50)",
        display: "flex",
        height: "100vh",
      }}
    >
      {/* ───────────── SIDEBAR ───────────── */}

      <aside
        style={{
          width: 260,
          background: "var(--white)",
          borderRight:
            "1px solid var(--gray-100)",
          padding: "1.2rem",
          display: "flex",
          flexDirection: "column",
          gap: ".45rem",
          overflowY: "auto",
          minHeight: 0,
          flexShrink: 0,
        }}
      >
        {/* logo */}

        <div
          style={{
            padding: ".25rem .5rem 1.5rem",
            marginBottom: ".5rem",
          }}
        >
          <Logo />
        </div>

        {/* NAV */}

        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: ".35rem",
          }}
        >
          {/* USER NAV */}

          {userNavItems.map((item) => {
            const active =
              pathname === item.href ||
              pathname.startsWith(
                item.href + "/"
              );

            return (
              <SidebarLink
                key={item.href}
                item={item}
                active={active}
              />
            );
          })}

          {/* COMPANY NAV */}

          {(role === "company_admin" ||
            role === "super_admin") && (
            <>
              <Divider />

              <SidebarSectionLabel>
                Company
              </SidebarSectionLabel>

              {companyNavItems.map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(
                    item.href + "/"
                  );

                return (
                  <SidebarLink
                    key={item.href}
                    item={item}
                    active={active}
                  />
                );
              })}
            </>
          )}

          {/* ADMIN NAV */}

          {role === "super_admin" && (
            <>
              <Divider />

              <SidebarSectionLabel>
                Platform Admin
              </SidebarSectionLabel>

              {adminNavItems.map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(
                    item.href + "/"
                  );

                return (
                  <SidebarLink
                    key={item.href}
                    item={item}
                    active={active}
                  />
                );
              })}
            </>
          )}
        </nav>

        <div style={{ flex: 1 }} />

        {/* bottom nav */}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: ".35rem",
            paddingTop: "1rem",
            borderTop:
              "1px solid var(--gray-100)",
          }}
        >
          {bottomItems.map((item) => {
            const active =
              pathname === item.href ||
              pathname.startsWith(
                item.href + "/"
              );

            return (
              <SidebarLink
                key={item.href}
                item={item}
                active={active}
              />
            );
          })}
        </div>
      </aside>

      {/* ───────────── RIGHT SIDE ───────────── */}

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        {/* TOPBAR */}

        <header
          style={{
            height: 76,
            background:
              "rgba(255,255,255,.92)",
            backdropFilter: "blur(10px)",
            borderBottom:
              "1px solid var(--gray-100)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 2rem",
            position: "sticky",
            top: 0,
            zIndex: 40,
          }}
        >
          {/* SEARCH */}

          <div
            style={{
              width: "100%",
              maxWidth: 540,
              height: 48,
              borderRadius: "16px",
              border:
                "1px solid var(--gray-200)",
              background: "var(--white)",
              display: "flex",
              alignItems: "center",
              gap: ".75rem",
              padding: "0 1rem",
              color: "var(--gray-400)",
            }}
          >
            <i className="ti ti-search" />

            <input
              placeholder="Search..."
              style={{
                border: "none",
                outline: "none",
                background: "transparent",
                width: "100%",
                fontFamily:
                  "var(--font-body)",
                fontSize: ".95rem",
                color: "var(--gray-900)",
              }}
            />
          </div>

          {/* ACTIONS */}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              marginLeft: "2rem",
            }}
          >
            {/* notifications */}

            <button
              style={{
                width: 42,
                height: 42,
                borderRadius: "14px",
                border:
                  "1px solid var(--gray-200)",
                background: "var(--white)",
                color: "var(--gray-600)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <i
                className="ti ti-bell"
                style={{
                  fontSize: "1.1rem",
                }}
              />
            </button>

            {/* profile */}

            <Link
              href="/profile"
              style={{
                width: 42,
                height: 42,
                borderRadius: "14px",
                border:
                  "1px solid var(--gray-200)",
                background: "var(--white)",
                color: "var(--gray-600)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
              }}
            >
              <i
                className="ti ti-user-circle"
                style={{
                  fontSize: "1.2rem",
                }}
              />
            </Link>
          </div>
        </header>

        {/* CONTENT */}

        <main
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "2rem",
            width: "100%",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 1320,
              margin: "0 auto",
            }}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ───────────────── COMPONENTS ───────────────── */

function SidebarLink({
  item,
  active,
}: {
  item: {
    href: string;
    label: string;
    icon: string;
  };
  active: boolean;
}) {
  return (
    <Link
      href={item.href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: ".9rem",
        padding: ".9rem 1rem",
        borderRadius: "16px",
        textDecoration: "none",
        background: active
          ? "var(--green-100)"
          : "transparent",
        color: active
          ? "var(--green-800)"
          : "var(--gray-600)",
        fontWeight: active ? 600 : 500,
        transition: "all .15s ease",
        fontSize: ".96rem",
      }}
    >
      <i
        className={item.icon}
        style={{
          fontSize: "1.1rem",
          flexShrink: 0,
        }}
      />

      <span>{item.label}</span>
    </Link>
  );
}

function Divider() {
  return (
    <div
      style={{
        height: 1,
        background: "var(--gray-100)",
        margin: "1rem .5rem",
      }}
    />
  );
}

function SidebarSectionLabel({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <p
      style={{
        fontSize: ".72rem",
        fontWeight: 700,
        letterSpacing: ".08em",
        textTransform: "uppercase",
        color: "var(--gray-400)",
        padding: "0 1rem",
        marginBottom: ".35rem",
      }}
    >
      {children}
    </p>
  );
}