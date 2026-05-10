"use client";

import { Modal } from "@/components/ui/Modal";
import type { CompanyJoinRequest } from "@/mocks/data/companyAdmin";

interface CompanyRequestDecisionModalProps {
  open: boolean;
  request: CompanyJoinRequest | null;
  decision: "approve" | "reject" | null;
  onClose: () => void;
  onConfirm: () => void;
}

const labelStyle: React.CSSProperties = {
  fontSize: ".72rem",
  color: "var(--gray-400)",
  textTransform: "uppercase",
  letterSpacing: ".08em",
  fontWeight: 700,
};

const valueStyle: React.CSSProperties = {
  color: "var(--gray-900)",
  fontWeight: 600,
  fontSize: ".92rem",
  minWidth: 0,
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

export function CompanyRequestDecisionModal({
  open,
  request,
  decision,
  onClose,
  onConfirm,
}: CompanyRequestDecisionModalProps) {
  const isApprove = decision === "approve";

  return (
    <Modal
      open={open && request !== null && decision !== null}
      onClose={onClose}
      title={isApprove ? "Approve request" : "Reject request"}
      size="sm"
      footer={
        <>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            style={{ width: "auto" }}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className={
              isApprove ? "btn btn--primary btn--sm" : "btn btn--ghost btn--sm"
            }
            style={{ width: "auto" }}
            onClick={onConfirm}
          >
            {isApprove ? "Approve" : "Reject"}
          </button>
        </>
      }
    >
      {request ? (
        <div style={{ display: "grid", gap: ".95rem" }}>
          <p style={{ color: "var(--gray-600)", fontSize: ".94rem" }}>
            {isApprove
              ? `Grant company access to ${request.user_name} and move the request out of the pending queue.`
              : `Reject ${request.user_name}'s access request and keep the roster limited to confirmed members.`}
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: ".85rem",
            }}
          >
            <DetailTile label="Applicant" value={request.user_name} />
            <DetailTile
              label="Email"
              value={request.user_email}
              style={{ gridColumn: "1 / -1" }}
            />
            <DetailTile
              label="Requested on"
              value={formatDateTime(request.created_at)}
            />
            <DetailTile
              label="Current status"
              value={formatStatus(request.status)}
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
  style,
}: {
  label: string;
  value: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        borderRadius: "16px",
        padding: ".85rem .9rem",
        background: "rgba(244,250,244,0.6)",
        border: "1px solid rgba(45,106,45,0.08)",
        display: "grid",
        gap: ".3rem",
        minWidth: 0,
        ...style,
      }}
    >
      <span style={labelStyle}>{label}</span>
      <span style={valueStyle}>{value}</span>
    </div>
  );
}

function formatStatus(status: CompanyJoinRequest["status"]) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
