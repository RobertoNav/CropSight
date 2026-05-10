// components/company/CompanyRequestsTable.tsx

"use client";

import type { JoinRequest } from "@/services/company.service";

interface CompanyRequestsTableProps {
  requests: JoinRequest[];

  onApprove: (
    request: JoinRequest
  ) => void;

  onReject: (
    request: JoinRequest
  ) => void;

  onClearFilters: () => void;

  hasActiveFilters: boolean;

  loading?: boolean;
}

const labelStyle: React.CSSProperties =
  {
    fontSize: ".72rem",
    color: "var(--gray-400)",
    textTransform: "uppercase",
    letterSpacing: ".08em",
    fontWeight: 700,
  };

export function CompanyRequestsTable({
  requests,
  onApprove,
  onReject,
  onClearFilters,
  hasActiveFilters,
  loading,
}: CompanyRequestsTableProps) {
  if (loading) {
    return (
      <div
        style={{
          padding: "2rem 0",
          textAlign: "center",
          color:
            "var(--gray-400)",
        }}
      >
        Loading requests...
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div
        style={{
          padding: "2rem 0",
          textAlign: "center",
        }}
      >
        <p
          style={{
            color:
              "var(--gray-600)",
            marginBottom:
              ".75rem",
          }}
        >
          No requests found.
        </p>

        {hasActiveFilters && (
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={
              onClearFilters
            }
          >
            Clear filters
          </button>
        )}
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
              "Applicant",
              "Email",
              "Status",
              "Requested",
              "Actions",
            ].map((item) => (
              <th
                key={item}
                style={{
                  textAlign:
                    "left",

                  padding:
                    "1rem .75rem",

                  ...labelStyle,
                }}
              >
                {item}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {requests.map(
            (request) => (
              <tr
                key={request.id}
                style={{
                  borderBottom:
                    "1px solid rgba(28,28,26,0.06)",
                }}
              >
                <td
                  style={{
                    padding:
                      "1rem .75rem",
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
                        request.user_name
                      }
                    </p>
                  </div>
                </td>

                <td
                  style={{
                    padding:
                      "1rem .75rem",

                    color:
                      "var(--gray-600)",
                  }}
                >
                  {
                    request.user_email
                  }
                </td>

                <td
                  style={{
                    padding:
                      "1rem .75rem",
                  }}
                >
                  <StatusPill
                    status={
                      request.status
                    }
                  />
                </td>

                <td
                  style={{
                    padding:
                      "1rem .75rem",

                    color:
                      "var(--gray-600)",

                    fontSize:
                      ".9rem",
                  }}
                >
                  {formatDate(
                    request.created_at
                  )}
                </td>

                <td
                  style={{
                    padding:
                      "1rem .75rem",
                  }}
                >
                  {request.status ===
                  "pending" ? (
                    <div
                      style={{
                        display:
                          "flex",

                        gap: ".55rem",

                        flexWrap:
                          "wrap",
                      }}
                    >
                      <button
                        className="btn btn--primary btn--sm"
                        onClick={() =>
                          onApprove(
                            request
                          )
                        }
                      >
                        Approve
                      </button>

                      <button
                        className="btn btn--ghost btn--sm"
                        onClick={() =>
                          onReject(
                            request
                          )
                        }
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span
                      style={{
                        color:
                          "var(--gray-400)",

                        fontSize:
                          ".82rem",
                      }}
                    >
                      Processed
                    </span>
                  )}
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}

function StatusPill({
  status,
}: {
  status:
    | "pending"
    | "approved"
    | "rejected";
}) {
  const tones = {
    pending: {
      bg: "#fff7e6",
      color:
        "var(--warning)",
      label: "Pending",
    },

    approved: {
      bg: "var(--green-100)",
      color:
        "var(--green-800)",
      label: "Approved",
    },

    rejected: {
      bg: "#fdf2f2",
      color:
        "var(--error)",
      label: "Rejected",
    },
  };

  const tone =
    tones[status];

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
          ".38rem .7rem",

        borderRadius:
          "999px",

        background:
          tone.bg,

        color: tone.color,

        fontSize:
          ".75rem",

        fontWeight: 600,
      }}
    >
      {tone.label}
    </span>
  );
}

function formatDate(
  value: string
) {
  return new Intl.DateTimeFormat(
    "en",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  ).format(new Date(value));
}