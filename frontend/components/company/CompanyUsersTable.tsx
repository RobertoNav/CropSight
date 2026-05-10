"use client";

import { StatusBadge } from "@/components/ui/StatusBadge";

export type MemberRole =
  | "company_admin"
  | "user";

export type MemberStatus =
  | "active"
  | "inactive";

export interface CompanyAdminMember {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  status: MemberStatus;
  zone: string;
  lastActiveAt: string;
}

interface CompanyUsersTableProps {
  users: CompanyAdminMember[];

  onEditRole: (
    user: CompanyAdminMember
  ) => void;

  onToggleStatus: (
    user: CompanyAdminMember
  ) => void;

  onClearFilters: () => void;

  hasActiveFilters: boolean;
}

const tableHeaderStyle: React.CSSProperties =
  {
    textAlign: "left",

    padding:
      ".8rem 1rem",

    fontSize: ".72rem",

    fontWeight: 700,

    letterSpacing:
      ".08em",

    textTransform:
      "uppercase",

    color:
      "var(--gray-400)",

    borderBottom:
      "1px solid var(--gray-100)",
  };

const cellStyle: React.CSSProperties =
  {
    padding: "1rem",

    borderBottom:
      "1px solid var(--gray-100)",

    verticalAlign: "top",
  };

export function CompanyUsersTable({
  users,
  onEditRole,
  onToggleStatus,
  onClearFilters,
  hasActiveFilters,
}: CompanyUsersTableProps) {
  if (!users.length) {
    return (
      <div
        style={{
          border:
            "1px dashed var(--gray-200)",

          borderRadius:
            "18px",

          padding:
            "2rem 1.25rem",

          background:
            "linear-gradient(180deg, rgba(244,250,244,0.55), var(--white))",

          display: "grid",

          gap: ".65rem",

          justifyItems:
            "start",
        }}
      >
        <p
          style={{
            fontWeight: 600,

            color:
              "var(--gray-900)",
          }}
        >
          No members match the
          current filters.
        </p>

        <p
          style={{
            color:
              "var(--gray-600)",

            fontSize:
              ".92rem",
          }}
        >
          Try broadening the
          search or clear filters
          to see the full company
          roster again.
        </p>

        {hasActiveFilters ? (
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            style={{
              width:
                "auto",
            }}
            onClick={
              onClearFilters
            }
          >
            Clear filters
          </button>
        ) : null}
      </div>
    );
  }

  return (
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

          minWidth: 760,
        }}
      >
        <thead>
          <tr>
            <th
              style={
                tableHeaderStyle
              }
            >
              User
            </th>

            <th
              style={
                tableHeaderStyle
              }
            >
              Role
            </th>

            <th
              style={
                tableHeaderStyle
              }
            >
              Status
            </th>

            <th
              style={
                tableHeaderStyle
              }
            >
              Zone
            </th>

            <th
              style={
                tableHeaderStyle
              }
            >
              Last active
            </th>

            <th
              style={{
                ...tableHeaderStyle,

                textAlign:
                  "right",
              }}
            >
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {users.map(
            (
              user,
              index
            ) => {
              const isLast =
                index ===
                users.length -
                  1;

              return (
                <tr
                  key={
                    user.id
                  }
                >
                  <td
                    style={{
                      ...cellStyle,

                      borderBottom:
                        isLast
                          ? "none"
                          : cellStyle.borderBottom,
                    }}
                  >
                    <div
                      style={{
                        display:
                          "grid",

                        gap: ".15rem",
                      }}
                    >
                      <p
                        style={{
                          fontWeight: 600,

                          color:
                            "var(--gray-900)",
                        }}
                      >
                        {
                          user.name
                        }
                      </p>

                      <p
                        style={{
                          fontSize:
                            ".86rem",

                          color:
                            "var(--gray-600)",
                        }}
                      >
                        {
                          user.email
                        }
                      </p>
                    </div>
                  </td>

                  <td
                    style={{
                      ...cellStyle,

                      borderBottom:
                        isLast
                          ? "none"
                          : cellStyle.borderBottom,
                    }}
                  >
                    <RoleBadge
                      role={
                        user.role
                      }
                    />
                  </td>

                  <td
                    style={{
                      ...cellStyle,

                      borderBottom:
                        isLast
                          ? "none"
                          : cellStyle.borderBottom,
                    }}
                  >
                    <StatusBadge
                      status={
                        user.status ===
                        "active"
                          ? "high"
                          : "pending"
                      }
                      label={
                        user.status ===
                        "active"
                          ? "Active"
                          : "Inactive"
                      }
                    />
                  </td>

                  <td
                    style={{
                      ...cellStyle,

                      borderBottom:
                        isLast
                          ? "none"
                          : cellStyle.borderBottom,
                    }}
                  >
                    <p
                      style={{
                        color:
                          "var(--gray-900)",

                        fontWeight: 500,
                      }}
                    >
                      {
                        user.zone
                      }
                    </p>
                  </td>

                  <td
                    style={{
                      ...cellStyle,

                      borderBottom:
                        isLast
                          ? "none"
                          : cellStyle.borderBottom,
                    }}
                  >
                    <p
                      style={{
                        color:
                          "var(--gray-600)",

                        fontSize:
                          ".88rem",
                      }}
                    >
                      {formatDateTime(
                        user.lastActiveAt
                      )}
                    </p>
                  </td>

                  <td
                    style={{
                      ...cellStyle,

                      borderBottom:
                        isLast
                          ? "none"
                          : cellStyle.borderBottom,

                      textAlign:
                        "right",
                    }}
                  >
                    <div
                      style={{
                        display:
                          "inline-flex",

                        gap: ".55rem",

                        flexWrap:
                          "wrap",

                        justifyContent:
                          "flex-end",
                      }}
                    >
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        style={{
                          width:
                            "auto",
                        }}
                        onClick={() =>
                          onEditRole(
                            user
                          )
                        }
                      >
                        Edit role
                      </button>

                      <button
                        type="button"
                        className={
                          user.status ===
                          "active"
                            ? "btn btn--ghost btn--sm"
                            : "btn btn--secondary btn--sm"
                        }
                        style={{
                          width:
                            "auto",
                        }}
                        onClick={() =>
                          onToggleStatus(
                            user
                          )
                        }
                      >
                        {user.status ===
                        "active"
                          ? "Deactivate"
                          : "Reactivate"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            }
          )}
        </tbody>
      </table>
    </div>
  );
}

function RoleBadge({
  role,
}: {
  role: CompanyAdminMember["role"];
}) {
  const isAdmin =
    role ===
    "company_admin";

  return (
    <span
      style={{
        display:
          "inline-flex",

        alignItems:
          "center",

        justifyContent:
          "center",

        padding:
          ".32rem .65rem",

        borderRadius:
          "999px",

        background:
          isAdmin
            ? "var(--green-50)"
            : "var(--gray-100)",

        color:
          isAdmin
            ? "var(--green-800)"
            : "var(--gray-600)",

        fontSize:
          ".75rem",

        fontWeight: 600,

        whiteSpace:
          "nowrap",
      }}
    >
      {isAdmin
        ? "Company admin"
        : "Field user"}
    </span>
  );
}

function formatDateTime(
  value: string
) {
  return new Intl.DateTimeFormat(
    "en",
    {
      month: "short",

      day: "numeric",

      hour: "numeric",

      minute: "2-digit",
    }
  ).format(
    new Date(value)
  );
}