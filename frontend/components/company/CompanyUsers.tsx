"use client";

import { useMemo, useState } from "react";
import { CompanyShell } from "@/components/company/CompanyShell";
import { CompanyUsersTable } from "@/components/company/CompanyUsersTable";
import { InfoTooltip } from "@/components/company/InfoTooltip";
import { Modal } from "@/components/ui/Modal";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import {
  companyAdminMock,
  type CompanyAdminMember,
  type MemberRole,
} from "@/mocks/data/companyAdmin";

type RoleFilter = MemberRole | "all";
type StatusFilter = "active" | "inactive" | "all";

const currentAdminId =
  companyAdminMock.users.find(
    (user) =>
      user.role === "company_admin" &&
      user.company_id === companyAdminMock.company.id,
  )?.id ??
  companyAdminMock.users[0]?.id ??
  null;

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

const detailValueStyle: React.CSSProperties = {
  color: "var(--gray-900)",
  fontWeight: 600,
  fontSize: ".92rem",
  minWidth: 0,
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const toneByStatus = {
  active: "high",
  suspended: "pending",
} as const;

export function CompanyUsers() {
  return (
    <ToastProvider>
      <CompanyUsersContent />
    </ToastProvider>
  );
}

function CompanyUsersContent() {
  const toast = useToast();
  const [users, setUsers] = useState<CompanyAdminMember[]>(() =>
    companyAdminMock.users.map((user) => ({ ...user })),
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [memberToRemove, setMemberToRemove] =
    useState<CompanyAdminMember | null>(null);

  const hasActiveFilters =
    searchTerm.trim().length > 0 ||
    roleFilter !== "all" ||
    statusFilter !== "all";

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        user.name.toLowerCase().includes(normalizedSearch) ||
        user.email.toLowerCase().includes(normalizedSearch);

      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? user.is_active : !user.is_active);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const summary = useMemo(() => {
    const active = users.filter((user) => user.is_active).length;
    const admins = users.filter((user) => user.role === "company_admin").length;

    return {
      total: users.length,
      active,
      inactive: users.length - active,
      admins,
    };
  }, [users]);

  function clearFilters() {
    setSearchTerm("");
    setRoleFilter("all");
    setStatusFilter("all");
  }

  function confirmRemoveMember() {
    if (!memberToRemove) return;

    if (memberToRemove.id === currentAdminId) {
      toast("The current company admin cannot remove themselves.", "warning");
      setMemberToRemove(null);
      return;
    }

    setUsers((currentUsers) =>
      currentUsers.filter((user) => user.id !== memberToRemove.id),
    );
    toast(
      `${memberToRemove.name} was removed from the company roster.`,
      "success",
    );
    setMemberToRemove(null);
  }

  return (
    <CompanyShell
      activePath="/company/users"
      title="Company users"
      description="Review the current company roster, filter members quickly, and remove access when someone should no longer belong to this workspace."
      statusTone={toneByStatus[companyAdminMock.company.status]}
      statusLabel={
        companyAdminMock.company.status === "active"
          ? "Company active"
          : "Company suspended"
      }
    >
      <PanelCard
        eyebrow="Directory"
        title="Team roster"
        description="Search by member identity, inspect company roles, and keep membership aligned with the backend roster contract."
      >
        <div style={{ display: "grid", gap: "1rem" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(220px, 1.4fr) repeat(2, minmax(160px, .8fr)) auto",
              gap: ".85rem",
            }}
          >
            <input
              className="form-input"
              type="search"
              placeholder="Search by name or email"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              aria-label="Search company users"
            />

            <select
              className="form-select"
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(event.target.value as RoleFilter)
              }
              aria-label="Filter users by role"
            >
              <option value="all">All roles</option>
              <option value="company_admin">Company admin</option>
              <option value="user">Field user</option>
            </select>

            <select
              className="form-select"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
              aria-label="Filter users by status"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
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
              <SummaryChip label="Members" value={summary.total} />
              <SummaryChip label="Admins" value={summary.admins} />
              <SummaryChip label="Active" value={summary.active} />
              <SummaryChip label="Inactive" value={summary.inactive} />
            </div>
            <p style={{ ...bodyTextStyle, fontSize: ".84rem" }}>
              Showing {filteredUsers.length} of {users.length} members
            </p>
          </div>
        </div>
      </PanelCard>

      <PanelCard
        eyebrow="Roster"
        title="Current members"
        description="Use the table to review assigned members, confirm active status, and remove people who should no longer belong to the company."
      >
        <CompanyUsersTable
          users={filteredUsers}
          currentAdminId={currentAdminId}
          onRemoveUser={setMemberToRemove}
          onClearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
        />
      </PanelCard>

      <Modal
        open={memberToRemove !== null}
        onClose={() => setMemberToRemove(null)}
        title={
          memberToRemove ? `Remove ${memberToRemove.name}` : "Remove member"
        }
        size="sm"
        footer={
          <>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              style={{ width: "auto" }}
              onClick={() => setMemberToRemove(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              style={{ width: "auto" }}
              onClick={confirmRemoveMember}
            >
              Remove member
            </button>
          </>
        }
      >
        <div style={{ display: "grid", gap: ".95rem" }}>
          <p style={bodyTextStyle}>
            This will remove {memberToRemove?.name} from the company workspace.
            The backend contract defines this as clearing the member from the
            company roster, not editing their role or active flag from here.
          </p>

          {memberToRemove ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: ".85rem",
              }}
            >
              <MemberDetailTile label="Member" value={memberToRemove.name} />
              <MemberDetailTile
                label="Role"
                value={formatMemberRole(memberToRemove.role)}
              />
              <MemberDetailTile
                label="Email"
                value={memberToRemove.email}
                style={{ gridColumn: "1 / -1" }}
              />
              <MemberDetailTile
                label="Status"
                value={memberToRemove.is_active ? "Active" : "Inactive"}
              />
              <MemberDetailTile
                label="Joined"
                value={formatJoinedDate(memberToRemove.created_at)}
              />
            </div>
          ) : null}

          <p style={{ ...bodyTextStyle, fontSize: ".86rem" }}>
            Roles and activation status are read-only here because the current
            company endpoints only support listing members and removing them.
          </p>
        </div>
      </Modal>
    </CompanyShell>
  );
}

function PanelCard({
  eyebrow,
  title,
  description,
  children,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
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
        {actions}
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

function MemberDetailTile({
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
      <span style={detailValueStyle}>{value}</span>
    </div>
  );
}

function formatMemberRole(role: MemberRole) {
  return role === "company_admin" ? "Company admin" : "Field user";
}

function formatJoinedDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
