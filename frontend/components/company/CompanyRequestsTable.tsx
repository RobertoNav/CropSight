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
    fontSize:
      ".72rem",

    color:
      "var(--gray-400)",

    textTransform:
      "uppercase",

    letterSpacing:
      ".08em",

    fontWeight: 700,
  };

export function CompanyRequestsTable({
  requests,
  onApprove,
  onReject,
  onClearFilters,
  hasActiveFilters,
  loading = false,
}: CompanyRequestsTableProps) {
  if (loading) {
    return (
      <div
        style={{
          padding:
            "2rem 0",

          textAlign:
            "center",

          color:
            "var(--gray-400)",
        }}
      >
        Loading requests...
      </div>
    );
  }

  if (!requests.length) {
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

          display:
            "grid",

          gap:
            ".65rem",

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
          No requests found.
        </p>

        <p
          style={{
            color:
              "var(--gray-600)",

            fontSize:
              ".92rem",
          }}
        >
          {hasActiveFilters
            ? "Try adjusting or clearing the filters to view more requests."
            : "There are currently no company join requests available."}
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
        overflowX:
          "auto",
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
            ].map(
              (
                item
              ) => (
                <th
                  key={
                    item
                  }
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
              )
            )}
          </tr>
        </thead>

        <tbody>
          {requests.map(
            (
              request,
              index
            ) => {
              const isLast =
                index ===
                requests.length -
                  1;

              return (
                <tr
                  key={
                    request.id
                  }
                  style={{
                    borderBottom:
                      isLast
                        ? "none"
                        : "1px solid rgba(28,28,26,0.06)",
                  }}
                >
                  <td
                    style={{
                      padding:
                        "1rem .75rem",
                    }}
                  >
                    <div
                      style={{
                        display:
                          "grid",

                        gap:
                          ".2rem",
                      }}
                    >
                      <p
                        style={{
                          fontWeight: 600,

                          color:
                            "var(--gray-900)",
                        }}
                      >
                        {request.user_name ||
                          "Unknown user"}
                      </p>
                    </div>
                  </td>

                  <td
                    style={{
                      padding:
                        "1rem .75rem",

                      color:
                        "var(--gray-600)",

                      fontSize:
                        ".9rem",

                      wordBreak:
                        "break-word",
                    }}
                  >
                    {request.user_email ||
                      "No email"}
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

                          gap:
                            ".55rem",

                          flexWrap:
                            "wrap",
                        }}
                      >
                        <button
                          type="button"
                          className="btn btn--primary btn--sm"
                          style={{
                            width:
                              "auto",
                          }}
                          onClick={() =>
                            onApprove(
                              request
                            )
                          }
                        >
                          Approve
                        </button>

                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          style={{
                            width:
                              "auto",
                          }}
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

                          fontWeight: 500,
                        }}
                      >
                        Processed
                      </span>
                    )}
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

      label:
        "Pending",
    },

    approved: {
      bg:
        "var(--green-100)",

      color:
        "var(--green-800)",

      label:
        "Approved",
    },

    rejected: {
      bg: "#fdf2f2",

      color:
        "var(--error)",

      label:
        "Rejected",
    },
  } as const;

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

        color:
          tone.color,

        fontSize:
          ".75rem",

        fontWeight: 600,

        whiteSpace:
          "nowrap",
      }}
    >
      {tone.label}
    </span>
  );
}

function formatDate(
  value?: string
) {
  if (!value)
    return "-";

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en",
    {
      month:
        "short",

      day: "numeric",

      year:
        "numeric",
    }
  ).format(date);
}