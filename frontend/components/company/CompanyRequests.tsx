"use client";

import { useMemo, useState } from "react";
import { CompanyRequestDecisionModal } from "@/components/company/CompanyRequestDecisionModal";
import { CompanyRequestsTable } from "@/components/company/CompanyRequestsTable";
import { CompanyShell } from "@/components/company/CompanyShell";
import { InfoTooltip } from "@/components/company/InfoTooltip";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import {
  companyAdminMock,
  type CompanyJoinRequest,
  type JoinRequestStatus,
} from "@/mocks/data/companyAdmin";

type RequestFilter = JoinRequestStatus | "all";
type DecisionType = "approve" | "reject";

const sectionCardStyle: React.CSSProperties = {
  background: "var(--white)",
  borderRadius: "20px",
  border: "1px solid rgba(45,106,45,0.08)",
  boxShadow: "var(--shadow-card)",
  padding: "1.35rem",
};

const labelStyle: React.CSSProperties = {
  fontSize: ".75rem",
  color: "var(--gray-400)",
  textTransform: "uppercase",
  letterSpacing: ".08em",
  fontWeight: 600,
};

const bodyTextStyle: React.CSSProperties = {
  color: "var(--gray-600)",
  fontSize: ".92rem",
};

const toneByStatus = {
  active: "high",
  suspended: "pending",
} as const;

const requestPriority = {
  pending: 0,
  approved: 1,
  rejected: 2,
} as const;

export function CompanyRequests() {
  return (
    <ToastProvider>
      <CompanyRequestsContent />
    </ToastProvider>
  );
}

function CompanyRequestsContent() {
  const toast = useToast();
  const [requests, setRequests] = useState<CompanyJoinRequest[]>(() =>
    companyAdminMock.requests.map((request) => ({ ...request })),
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<RequestFilter>("all");
  const [selectedRequest, setSelectedRequest] =
    useState<CompanyJoinRequest | null>(null);
  const [decisionType, setDecisionType] = useState<DecisionType | null>(null);

  const hasActiveFilters =
    searchTerm.trim().length > 0 || statusFilter !== "all";

  const filteredRequests = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return [...requests]
      .filter((request) => {
        const matchesSearch =
          normalizedSearch.length === 0 ||
          request.name.toLowerCase().includes(normalizedSearch) ||
          request.email.toLowerCase().includes(normalizedSearch);

        const matchesStatus =
          statusFilter === "all" || request.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((left, right) => {
        const priorityDifference =
          requestPriority[left.status] - requestPriority[right.status];

        if (priorityDifference !== 0) return priorityDifference;

        return (
          new Date(right.requestedAt).getTime() -
          new Date(left.requestedAt).getTime()
        );
      });
  }, [requests, searchTerm, statusFilter]);

  const summary = useMemo(() => {
    const pending = requests.filter(
      (request) => request.status === "pending",
    ).length;
    const approved = requests.filter(
      (request) => request.status === "approved",
    ).length;

    return {
      total: requests.length,
      pending,
      approved,
      rejected: requests.length - pending - approved,
    };
  }, [requests]);

  function clearFilters() {
    setSearchTerm("");
    setStatusFilter("all");
  }

  function openDecisionModal(
    request: CompanyJoinRequest,
    decision: DecisionType,
  ) {
    setSelectedRequest(request);
    setDecisionType(decision);
  }

  function closeDecisionModal() {
    setSelectedRequest(null);
    setDecisionType(null);
  }

  function confirmDecision() {
    if (!selectedRequest || !decisionType) return;

    const nextStatus: JoinRequestStatus =
      decisionType === "approve" ? "approved" : "rejected";

    setRequests((currentRequests) =>
      currentRequests.map((request) =>
        request.id === selectedRequest.id
          ? { ...request, status: nextStatus }
          : request,
      ),
    );

    toast(
      nextStatus === "approved"
        ? `Request approved for ${selectedRequest.name}.`
        : `Request rejected for ${selectedRequest.name}.`,
      nextStatus === "approved" ? "success" : "warning",
    );

    closeDecisionModal();
  }

  return (
    <CompanyShell
      activePath="/company/requests"
      title="Join requests"
      description="Review incoming access requests, keep the pending queue moving, and decide who should enter the company workspace."
      statusTone={toneByStatus[companyAdminMock.company.status]}
      statusLabel={
        companyAdminMock.company.status === "active"
          ? "Company active"
          : "Company suspended"
      }
    >
      <PanelCard
        eyebrow="Queue"
        title="Review pipeline"
        description="Search by applicant, focus on pending access, and keep the company onboarding queue clean."
      >
        <div style={{ display: "grid", gap: "1rem" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(220px, 1.3fr) minmax(180px, .7fr) auto",
              gap: ".85rem",
            }}
          >
            <input
              className="form-input"
              type="search"
              placeholder="Search by name or email"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              aria-label="Search company join requests"
            />

            <select
              className="form-select"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as RequestFilter)
              }
              aria-label="Filter requests by status"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <button
              type="button"
              className="btn btn--ghost btn--sm"
              style={{ width: "auto", alignSelf: "center" }}
              onClick={clearFilters}
              disabled={!hasActiveFilters}
            >
              Clear
            </button>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", flexWrap: "wrap", gap: ".6rem" }}>
              <SummaryChip label="Requests" value={summary.total} />
              <SummaryChip label="Pending" value={summary.pending} />
              <SummaryChip label="Approved" value={summary.approved} />
              <SummaryChip label="Rejected" value={summary.rejected} />
            </div>
            <p style={{ ...bodyTextStyle, fontSize: ".84rem" }}>
              Showing {filteredRequests.length} of {requests.length} requests
            </p>
          </div>
        </div>
      </PanelCard>

      <PanelCard
        eyebrow="Requests"
        title="Incoming access requests"
        description="Resolve pending entries quickly while keeping the review history visible for the company team."
      >
        <CompanyRequestsTable
          requests={filteredRequests}
          onApprove={(request) => openDecisionModal(request, "approve")}
          onReject={(request) => openDecisionModal(request, "reject")}
          onClearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
        />
      </PanelCard>

      <CompanyRequestDecisionModal
        open={selectedRequest !== null && decisionType !== null}
        request={selectedRequest}
        decision={decisionType}
        onClose={closeDecisionModal}
        onConfirm={confirmDecision}
      />
    </CompanyShell>
  );
}

function PanelCard({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section style={sectionCardStyle}>
      <div
        style={{
          marginBottom: "1.15rem",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div>
          <p
            style={{
              ...labelStyle,
              color: "var(--green-800)",
              marginBottom: ".45rem",
            }}
          >
            {eyebrow}
          </p>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: ".55rem",
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.45rem",
                fontWeight: 400,
                lineHeight: 1.1,
                letterSpacing: "-.02em",
              }}
            >
              {title}
            </h2>
            <InfoTooltip text={description} />
          </div>
        </div>
      </div>
      {children}
    </section>
  );
}

function SummaryChip({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: ".45rem",
        padding: ".4rem .72rem",
        borderRadius: "999px",
        background: "var(--green-50)",
        border: "1px solid rgba(45,106,45,0.08)",
      }}
    >
      <span
        style={{ ...labelStyle, color: "var(--green-800)", fontSize: ".68rem" }}
      >
        {label}
      </span>
      <span style={{ fontWeight: 700, color: "var(--green-900)" }}>
        {value}
      </span>
    </div>
  );
}
