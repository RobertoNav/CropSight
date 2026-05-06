"use client";

import { StatusBadge } from "@/components/ui/StatusBadge";
import type { CompanyJoinRequest } from "@/mocks/data/companyAdmin";

interface CompanyRequestsTableProps {
  requests: CompanyJoinRequest[];
  onApprove: (request: CompanyJoinRequest) => void;
  onReject: (request: CompanyJoinRequest) => void;
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

const toneByStatus = {
  pending: { status: "pending", label: "Pending" },
  approved: { status: "high", label: "Approved" },
  rejected: { status: "error", label: "Rejected" },
} as const;

export function CompanyRequestsTable({
  requests,
  onApprove,
  onReject,
  onClearFilters,
  hasActiveFilters,
}: CompanyRequestsTableProps) {
  if (!requests.length) {
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
          No requests match the current filters.
        </p>
        <p style={{ color: "var(--gray-600)", fontSize: ".92rem" }}>
          Broaden the search or clear filters to bring the full queue back into
          view.
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
            <th style={tableHeaderStyle}>Applicant</th>
            <th style={tableHeaderStyle}>Requested role</th>
            <th style={tableHeaderStyle}>Zone</th>
            <th style={tableHeaderStyle}>Requested on</th>
            <th style={tableHeaderStyle}>Status</th>
            <th style={{ ...tableHeaderStyle, textAlign: "right" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request, index) => {
            const isLast = index === requests.length - 1;
            const tone = toneByStatus[request.status];

            return (
              <tr key={request.id}>
                <td
                  style={{
                    ...cellStyle,
                    borderBottom: isLast ? "none" : cellStyle.borderBottom,
                  }}
                >
                  <div style={{ display: "grid", gap: ".15rem" }}>
                    <p style={{ fontWeight: 600, color: "var(--gray-900)" }}>
                      {request.name}
                    </p>
                    <p style={{ fontSize: ".86rem", color: "var(--gray-600)" }}>
                      {request.email}
                    </p>
                  </div>
                </td>
                <td
                  style={{
                    ...cellStyle,
                    borderBottom: isLast ? "none" : cellStyle.borderBottom,
                  }}
                >
                  <RoleBadge role={request.requestedRole} />
                </td>
                <td
                  style={{
                    ...cellStyle,
                    borderBottom: isLast ? "none" : cellStyle.borderBottom,
                  }}
                >
                  <p style={{ color: "var(--gray-900)", fontWeight: 500 }}>
                    {request.zone}
                  </p>
                </td>
                <td
                  style={{
                    ...cellStyle,
                    borderBottom: isLast ? "none" : cellStyle.borderBottom,
                  }}
                >
                  <p style={{ color: "var(--gray-600)", fontSize: ".88rem" }}>
                    {formatDate(request.requestedAt)}
                  </p>
                </td>
                <td
                  style={{
                    ...cellStyle,
                    borderBottom: isLast ? "none" : cellStyle.borderBottom,
                  }}
                >
                  <StatusBadge status={tone.status} label={tone.label} />
                </td>
                <td
                  style={{
                    ...cellStyle,
                    borderBottom: isLast ? "none" : cellStyle.borderBottom,
                    textAlign: "right",
                  }}
                >
                  {request.status === "pending" ? (
                    <div
                      style={{
                        display: "inline-flex",
                        gap: ".55rem",
                        flexWrap: "wrap",
                        justifyContent: "flex-end",
                      }}
                    >
                      <button
                        type="button"
                        className="btn btn--secondary btn--sm"
                        style={{ width: "auto" }}
                        onClick={() => onApprove(request)}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        style={{ width: "auto" }}
                        onClick={() => onReject(request)}
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span
                      style={{
                        color: "var(--gray-500)",
                        fontSize: ".82rem",
                        fontWeight: 600,
                      }}
                    >
                      Resolved
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RoleBadge({ role }: { role: CompanyJoinRequest["requestedRole"] }) {
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
  }).format(new Date(value));
}
