"use client";

import { StatusBadge } from "@/components/ui/StatusBadge";
import type { CompanyAdminMember } from "@/mocks/data/companyAdmin";

interface CompanyUsersTableProps {
  users: CompanyAdminMember[];
  currentAdminId: string | null;
  onRemoveUser: (user: CompanyAdminMember) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

const tableHeaderStyle: React.CSSProperties = {
  textAlign: "left",
  padding: ".8rem 1rem",
  fontSize: ".72rem",
  fontWeight: 700,
  letterSpacing: ".08em",
  textTransform: "uppercase",
  color: "var(--gray-400)",
  borderBottom: "1px solid var(--gray-100)",
};

const cellStyle: React.CSSProperties = {
  padding: "1rem",
  borderBottom: "1px solid var(--gray-100)",
  verticalAlign: "top",
};

export function CompanyUsersTable({
  users,
  currentAdminId,
  onRemoveUser,
  onClearFilters,
  hasActiveFilters,
}: CompanyUsersTableProps) {
  if (!users.length) {
    return (
      <div
        style={{
          border: "1px dashed var(--gray-200)",
          borderRadius: "18px",
          padding: "2rem 1.25rem",
          background:
            "linear-gradient(180deg, rgba(244,250,244,0.55), var(--white))",
          display: "grid",
          gap: ".65rem",
          justifyItems: "start",
        }}
      >
        <p style={{ fontWeight: 600, color: "var(--gray-900)" }}>
          No members match the current filters.
        </p>
        <p style={{ color: "var(--gray-600)", fontSize: ".92rem" }}>
          Try broadening the search or clear filters to see the full company
          roster again.
        </p>
        {hasActiveFilters ? (
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            style={{ width: "auto" }}
            onClick={onClearFilters}
          >
            Clear filters
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}
      >
        <thead>
          <tr>
            <th style={tableHeaderStyle}>User</th>
            <th style={tableHeaderStyle}>Role</th>
            <th style={tableHeaderStyle}>Status</th>
            <th style={tableHeaderStyle}>Joined</th>
            <th style={{ ...tableHeaderStyle, textAlign: "right" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user, index) => {
            const isLast = index === users.length - 1;
            const isCurrentAdmin = user.id === currentAdminId;

            return (
              <tr key={user.id}>
                <td
                  style={{
                    ...cellStyle,
                    borderBottom: isLast ? "none" : cellStyle.borderBottom,
                  }}
                >
                  <div style={{ display: "grid", gap: ".15rem" }}>
                    <p style={{ fontWeight: 600, color: "var(--gray-900)" }}>
                      {user.name}
                    </p>
                    <p style={{ fontSize: ".86rem", color: "var(--gray-600)" }}>
                      {user.email}
                    </p>
                  </div>
                </td>
                <td
                  style={{
                    ...cellStyle,
                    borderBottom: isLast ? "none" : cellStyle.borderBottom,
                  }}
                >
                  <RoleBadge role={user.role} />
                </td>
                <td
                  style={{
                    ...cellStyle,
                    borderBottom: isLast ? "none" : cellStyle.borderBottom,
                  }}
                >
                  <StatusBadge
                    status={user.is_active ? "high" : "pending"}
                    label={user.is_active ? "Active" : "Inactive"}
                  />
                </td>
                <td
                  style={{
                    ...cellStyle,
                    borderBottom: isLast ? "none" : cellStyle.borderBottom,
                  }}
                >
                  <p style={{ color: "var(--gray-600)", fontSize: ".88rem" }}>
                    {formatDate(user.created_at)}
                  </p>
                </td>
                <td
                  style={{
                    ...cellStyle,
                    borderBottom: isLast ? "none" : cellStyle.borderBottom,
                    textAlign: "right",
                  }}
                >
                  <div
                    style={{
                      display: "inline-flex",
                      gap: ".55rem",
                      flexWrap: "wrap",
                      justifyContent: "flex-end",
                    }}
                  >
                    {isCurrentAdmin ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: ".32rem .65rem",
                          borderRadius: "999px",
                          background: "var(--gray-100)",
                          color: "var(--gray-600)",
                          fontSize: ".75rem",
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                        }}
                      >
                        Current admin
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        style={{ width: "auto" }}
                        onClick={() => onRemoveUser(user)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RoleBadge({ role }: { role: CompanyAdminMember["role"] }) {
  const isAdmin = role === "company_admin";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: ".32rem .65rem",
        borderRadius: "999px",
        background: isAdmin ? "var(--green-50)" : "var(--gray-100)",
        color: isAdmin ? "var(--green-800)" : "var(--gray-600)",
        fontSize: ".75rem",
        fontWeight: 600,
        whiteSpace: "nowrap",
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
