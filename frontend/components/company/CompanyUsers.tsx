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
  type MemberStatus,
} from "@/mocks/data/companyAdmin";

type RoleFilter = MemberRole | "all";
type StatusFilter = MemberStatus | "all";

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
  const [roleModalUser, setRoleModalUser] = useState<CompanyAdminMember | null>(
    null,
  );
  const [statusModalUser, setStatusModalUser] =
    useState<CompanyAdminMember | null>(null);
  const [draftRole, setDraftRole] = useState<MemberRole>("user");

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
        statusFilter === "all" || user.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const summary = useMemo(() => {
    const active = users.filter((user) => user.status === "active").length;
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

  function openRoleModal(user: CompanyAdminMember) {
    setRoleModalUser(user);
    setDraftRole(user.role);
  }

  function saveRoleChange() {
    if (!roleModalUser) return;

    const nextRole = draftRole;
    setUsers((currentUsers) =>
      currentUsers.map((user) =>
        user.id === roleModalUser.id ? { ...user, role: nextRole } : user,
      ),
    );
    toast(
      `${roleModalUser.name} is now ${nextRole === "company_admin" ? "a company admin" : "a field user"}.`,
      "success",
    );
    setRoleModalUser(null);
  }

  function confirmStatusChange() {
    if (!statusModalUser) return;

    const nextStatus: MemberStatus =
      statusModalUser.status === "active" ? "inactive" : "active";
    setUsers((currentUsers) =>
      currentUsers.map((user) =>
        user.id === statusModalUser.id
          ? {
              ...user,
              status: nextStatus,
              lastActiveAt:
                nextStatus === "active"
                  ? new Date().toISOString()
                  : user.lastActiveAt,
            }
          : user,
      ),
    );

    toast(
      nextStatus === "active"
        ? `${statusModalUser.name} has been reactivated.`
        : `${statusModalUser.name} has been deactivated.`,
      nextStatus === "active" ? "success" : "warning",
    );
    setStatusModalUser(null);
  }

  return (
    <CompanyShell
      activePath="/company/users"
      title="Company users"
      description="Manage roles, access status, and the field team assigned to this company from a single clean roster view."
      statusTone={toneByStatus[companyAdminMock.company.status]}
      statusLabel={
        companyAdminMock.company.status === "active"
          ? "Company active"
          : "Company suspended"
      }
    >
      <PanelCard
        eyebrow="Directory"
        title="Team management"
        description="Filter the roster, review access, and keep the company structure aligned with current operations."
        actions={
          <button
            type="button"
            className="btn btn--primary btn--sm"
            style={{ width: "auto" }}
            onClick={() =>
              toast(
                "Invitation flow can be connected once the backend is ready.",
                "info",
              )
            }
          >
            Invite member
          </button>
        }
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
        description="Use the table to adjust roles, review status, and keep the company roster up to date."
      >
        <CompanyUsersTable
          users={filteredUsers}
          onEditRole={openRoleModal}
          onToggleStatus={setStatusModalUser}
          onClearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
        />
      </PanelCard>

      <Modal
        open={roleModalUser !== null}
        onClose={() => setRoleModalUser(null)}
        title={
          roleModalUser ? `Edit role for ${roleModalUser.name}` : "Edit role"
        }
        size="sm"
        footer={
          <>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              style={{ width: "auto" }}
              onClick={() => setRoleModalUser(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn--primary btn--sm"
              style={{ width: "auto" }}
              onClick={saveRoleChange}
            >
              Save role
            </button>
          </>
        }
      >
        <div style={{ display: "grid", gap: ".9rem" }}>
          <p style={bodyTextStyle}>
            Choose the level of access this person should have inside the
            company workspace.
          </p>
          <div>
            <label
              htmlFor="member-role"
              style={{
                ...labelStyle,
                display: "block",
                marginBottom: ".45rem",
              }}
            >
              Role
            </label>
            <select
              id="member-role"
              className="form-select"
              value={draftRole}
              onChange={(event) =>
                setDraftRole(event.target.value as MemberRole)
              }
            >
              <option value="company_admin">Company admin</option>
              <option value="user">Field user</option>
            </select>
          </div>
        </div>
      </Modal>

      <Modal
        open={statusModalUser !== null}
        onClose={() => setStatusModalUser(null)}
        title={
          statusModalUser?.status === "active"
            ? "Deactivate member"
            : "Reactivate member"
        }
        size="sm"
        footer={
          <>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              style={{ width: "auto" }}
              onClick={() => setStatusModalUser(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={
                statusModalUser?.status === "active"
                  ? "btn btn--ghost btn--sm"
                  : "btn btn--primary btn--sm"
              }
              style={{ width: "auto" }}
              onClick={confirmStatusChange}
            >
              {statusModalUser?.status === "active"
                ? "Deactivate"
                : "Reactivate"}
            </button>
          </>
        }
      >
        <div style={{ display: "grid", gap: ".8rem" }}>
          <p style={bodyTextStyle}>
            {statusModalUser?.status === "active"
              ? `This will pause access for ${statusModalUser?.name} until you reactivate the account.`
              : `This will restore access for ${statusModalUser?.name} and mark the member as active again.`}
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
