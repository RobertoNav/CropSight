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
              ? `Grant company access to ${request.name} and move the request out of the pending queue.`
              : `Reject ${request.name}'s access request and keep the roster limited to confirmed members.`}
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: ".85rem",
            }}
          >
            <DetailTile label="Applicant" value={request.name} />
            <DetailTile
              label="Requested role"
              value={formatRole(request.requestedRole)}
            />
            <DetailTile label="Zone" value={request.zone} />
            <DetailTile
              label="Requested on"
              value={formatDate(request.requestedAt)}
            />
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

function DetailTile({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        borderRadius: "16px",
        padding: ".85rem .9rem",
        background: "rgba(244,250,244,0.6)",
        border: "1px solid rgba(45,106,45,0.08)",
        display: "grid",
        gap: ".3rem",
      }}
    >
      <span style={labelStyle}>{label}</span>
      <span style={valueStyle}>{value}</span>
    </div>
  );
}

function formatRole(role: CompanyJoinRequest["requestedRole"]) {
  return role === "company_admin" ? "Company admin" : "Field user";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}
