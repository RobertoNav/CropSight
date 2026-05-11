"use client";

import { Modal } from "@/components/ui/Modal";

import type { JoinRequest } from "@/services/company.service";

interface CompanyRequestDecisionModalProps {
  open: boolean;

  request: JoinRequest | null;

  decision:
    | "approve"
    | "reject"
    | null;

  onClose: () => void;

  onConfirm: () => void;

  loading?: boolean;
}

const labelStyle: React.CSSProperties =
  {
    fontSize: ".72rem",

    color:
      "var(--gray-400)",

    textTransform:
      "uppercase",

    letterSpacing:
      ".08em",

    fontWeight: 700,
  };

const valueStyle: React.CSSProperties =
  {
    color:
      "var(--gray-900)",

    fontWeight: 600,

    fontSize:
      ".92rem",

    wordBreak:
      "break-word",
  };

export function CompanyRequestDecisionModal({
  open,
  request,
  decision,
  onClose,
  onConfirm,
  loading = false,
}: CompanyRequestDecisionModalProps) {
  const isApprove =
    decision ===
    "approve";

  return (
    <Modal
      open={
        open &&
        request !==
          null &&
        decision !==
          null
      }
      onClose={
        loading
          ? () => {}
          : onClose
      }
      title={
        isApprove
          ? "Approve request"
          : "Reject request"
      }
      size="sm"
      footer={
        <>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            style={{
              width:
                "auto",
            }}
            onClick={
              onClose
            }
            disabled={
              loading
            }
          >
            Cancel
          </button>

          <button
            type="button"
            className={
              isApprove
                ? "btn btn--primary btn--sm"
                : "btn btn--ghost btn--sm"
            }
            style={{
              width:
                "auto",
            }}
            onClick={
              onConfirm
            }
            disabled={
              loading
            }
          >
            {loading
              ? isApprove
                ? "Approving..."
                : "Rejecting..."
              : isApprove
                ? "Approve"
                : "Reject"}
          </button>
        </>
      }
    >
      {request ? (
        <div
          style={{
            display:
              "grid",

            gap:
              ".95rem",
          }}
        >
          <p
            style={{
              color:
                "var(--gray-600)",

              fontSize:
                ".94rem",

              lineHeight:
                1.5,
            }}
          >
            {isApprove
              ? `Grant company access to ${request.user_name} and move the request out of the pending queue.`
              : `Reject ${request.user_name}'s access request and keep the roster limited to confirmed members.`}
          </p>

          <div
            style={{
              display:
                "grid",

              gridTemplateColumns:
                "repeat(2, minmax(0, 1fr))",

              gap:
                ".85rem",
            }}
          >
            <DetailTile
              label="Applicant"
              value={
                request.user_name ||
                "Unknown user"
              }
            />

            <DetailTile
              label="Email"
              value={
                request.user_email ||
                "No email"
              }
            />

            <DetailTile
              label="Status"
              value={capitalize(
                request.status ||
                  "pending"
              )}
            />

            <DetailTile
              label="Requested on"
              value={formatDate(
                request.created_at
              )}
            />
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

function DetailTile({
  label,
  value,
}: {
  label: string;

  value: string;
}) {
  return (
    <div
      style={{
        borderRadius:
          "16px",

        padding:
          ".85rem .9rem",

        background:
          "rgba(244,250,244,0.6)",

        border:
          "1px solid rgba(45,106,45,0.08)",

        display:
          "grid",

        gap:
          ".3rem",
      }}
    >
      <span
        style={
          labelStyle
        }
      >
        {label}
      </span>

      <span
        style={
          valueStyle
        }
      >
        {value}
      </span>
    </div>
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

function capitalize(
  value: string
) {
  if (!value)
    return "";

  return (
    value
      .charAt(0)
      .toUpperCase() +
    value.slice(1)
  );
}