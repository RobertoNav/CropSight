"use client";

import { useEffect, useState } from "react";

import { MetricCard } from "@/components/ui/MetricCard";

import {
  getUsers,
  updateUserStatus,
} from "@/services/admin.service";

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

type User = {
  id: string;
  name: string;
  email: string;
  role:
    | "super_admin"
    | "company_admin"
    | "user";

  company_id: string | null;

  is_active: boolean;

  created_at: string;
};

export function AdminUsers() {
  const [loading, setLoading] =
    useState(true);

  const [users, setUsers] =
    useState<User[]>([]);

  const [search, setSearch] =
    useState("");

  async function loadUsers() {
    try {
      const response =
  await getUsers({
    page: 1,
    limit: 100,
  });

      setUsers(
        response?.data || []
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleToggleStatus(
    user: User
  ) {
    try {
      await updateUserStatus(
        user.id,
        !user.is_active
      );

      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? {
                ...u,
                is_active:
                  !u.is_active,
              }
            : u
        )
      );
    } catch (error) {
      console.error(error);
    }
  }

  const filteredUsers =
    users.filter((user) => {
      const q =
        search.toLowerCase();

      return (
        user.name
          .toLowerCase()
          .includes(q) ||
        user.email
          .toLowerCase()
          .includes(q)
      );
    });

  const totalUsers =
    users.length;

  const totalAdmins =
    users.filter((u) =>
      [
        "super_admin",
        "company_admin",
      ].includes(u.role)
    ).length;

  const activeUsers =
    users.filter(
      (u) => u.is_active
    ).length;

  const suspendedUsers =
    users.filter(
      (u) => !u.is_active
    ).length;

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
          justifyContent:
            "space-between",

          alignItems: "flex-start",

          gap: "1rem",

          flexWrap: "wrap",
        }}
      >
        <div>
          <p
            style={{
              ...labelStyle,
              color:
                "var(--green-800)",

              marginBottom: ".55rem",
            }}
          >
            Platform administration
          </p>

          <h1
            style={{
              fontFamily:
                "var(--font-display)",

              fontSize: "3rem",

              lineHeight: 1,

              letterSpacing:
                "-.04em",

              fontWeight: 400,

              marginBottom: ".9rem",
            }}
          >
            User management
          </h1>

          <p
            style={{
              color:
                "var(--gray-600)",

              maxWidth: 760,

              lineHeight: 1.8,

              fontSize: ".98rem",
            }}
          >
            Supervise
            platform-wide
            accounts, manage
            access permissions,
            and monitor
            operational activity
            across all
            registered
            companies.
          </p>
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
          label="Total users"
          value={
            loading
              ? "..."
              : totalUsers.toString()
          }
          sub="Across all companies"
          icon={<span>👥</span>}
        />

        <MetricCard
          label="Admins"
          value={
            loading
              ? "..."
              : totalAdmins.toString()
          }
          sub="Platform + company admins"
          icon={<span>🛡️</span>}
        />

        <MetricCard
          label="Active users"
          value={
            loading
              ? "..."
              : activeUsers.toString()
          }
          sub="Enabled accounts"
          icon={<span>✅</span>}
        />

        <MetricCard
          label="Suspended users"
          value={
            loading
              ? "..."
              : suspendedUsers.toString()
          }
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

            justifyContent:
              "space-between",

            alignItems: "center",

            gap: "1rem",

            flexWrap: "wrap",
          }}
        >
          <div>
            <p
              style={{
                ...labelStyle,
                color:
                  "var(--green-800)",

                marginBottom:
                  ".35rem",
              }}
            >
              Accounts
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
              Platform users
            </h2>
          </div>

          <input
            placeholder="Search users..."
            className="form-input"
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
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
                  "User",
                  "Role",
                  "Company",
                  "Status",
                  "Actions",
                ].map((item) => (
                  <th
                    key={item}
                    style={{
                      textAlign:
                        "left",

                      padding: "1rem",

                      fontSize:
                        ".75rem",

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
              {filteredUsers.map(
                (user) => (
                  <tr
                    key={user.id}
                    style={{
                      borderBottom:
                        "1px solid rgba(28,28,26,0.06)",
                    }}
                  >
                    <td
                      style={{
                        padding:
                          "1rem",
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
                          {user.name}
                        </p>

                        <span
                          style={{
                            color:
                              "var(--gray-400)",

                            fontSize:
                              ".84rem",
                          }}
                        >
                          {
                            user.email
                          }
                        </span>
                      </div>
                    </td>

                    <td
                      style={{
                        padding:
                          "1rem",
                      }}
                    >
                      <RolePill
                        role={
                          user.role
                        }
                      />
                    </td>

                    <td
                      style={{
                        padding:
                          "1rem",

                        color:
                          "var(--gray-600)",
                      }}
                    >
                      {user.company_id ||
                        "No company"}
                    </td>

                    <td
                      style={{
                        padding:
                          "1rem",
                      }}
                    >
                      <StatusPill
                        active={
                          user.is_active
                        }
                      />
                    </td>

                    <td
                      style={{
                        padding:
                          "1rem",
                      }}
                    >
                      <button
                        className="btn btn--ghost btn--sm"
                        onClick={() =>
                          handleToggleStatus(
                            user
                          )
                        }
                      >
                        {user.is_active
                          ? "Suspend"
                          : "Activate"}
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>

          {!loading &&
            filteredUsers.length ===
              0 && (
              <div
                style={{
                  padding: "2rem",
                  textAlign:
                    "center",

                  color:
                    "var(--gray-400)",
                }}
              >
                No users found.
              </div>
            )}
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
    | "user";
}) {
  const tones = {
    super_admin: {
      bg: "#eef7ff",
      color: "#1a4480",
      label: "Super admin",
    },

    company_admin: {
      bg: "var(--green-100)",
      color:
        "var(--green-800)",
      label: "Company admin",
    },

    user: {
      bg: "var(--gray-100)",
      color:
        "var(--gray-600)",
      label: "User",
    },
  };

  const tone = tones[role];

  return (
    <span
      style={{
        display: "inline-flex",

        alignItems: "center",

        justifyContent:
          "center",

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
  active,
}: {
  active: boolean;
}) {
  return (
    <span
      style={{
        display: "inline-flex",

        alignItems: "center",

        justifyContent:
          "center",

        padding: ".38rem .7rem",

        borderRadius: "999px",

        background: active
          ? "var(--green-100)"
          : "#fdf2f2",

        color: active
          ? "var(--green-800)"
          : "var(--error)",

        fontSize: ".75rem",

        fontWeight: 600,
      }}
    >
      {active
        ? "Active"
        : "Suspended"}
    </span>
  );
}