"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { CompanyShell } from "@/components/company/CompanyShell";

import { CompanyUsersTable } from "@/components/company/CompanyUsersTable";

import { InfoTooltip } from "@/components/company/InfoTooltip";

import { Modal } from "@/components/ui/Modal";

import {
  ToastProvider,
  useToast,
} from "@/components/ui/Toast";

import {
  getCompanyUsers,
  removeCompanyUser,
} from "@/services/company.service";

type MemberRole =
  | "company_admin"
  | "user";

type MemberStatus =
  | "active"
  | "inactive";

interface CompanyAdminMember {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  status: MemberStatus;
  zone: string;
  lastActiveAt: string;
}

type RoleFilter =
  | MemberRole
  | "all";

type StatusFilter =
  | MemberStatus
  | "all";

const sectionCardStyle: React.CSSProperties =
  {
    background:
      "var(--white)",

    borderRadius:
      "20px",

    border:
      "1px solid rgba(45,106,45,0.08)",

    boxShadow:
      "var(--shadow-card)",

    padding: "1.35rem",
  };

const labelStyle: React.CSSProperties =
  {
    fontSize: ".75rem",

    color:
      "var(--gray-400)",

    textTransform:
      "uppercase",

    letterSpacing:
      ".08em",

    fontWeight: 600,
  };

const bodyTextStyle: React.CSSProperties =
  {
    color:
      "var(--gray-600)",

    fontSize: ".92rem",
  };

export function CompanyUsers() {
  return (
    <ToastProvider>
      <CompanyUsersContent />
    </ToastProvider>
  );
}

function CompanyUsersContent() {
  const toast = useToast();

  const [users, setUsers] =
    useState<
      CompanyAdminMember[]
    >([]);

  const [loading, setLoading] =
    useState(true);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [roleFilter, setRoleFilter] =
    useState<RoleFilter>(
      "all"
    );

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<StatusFilter>(
    "all"
  );

  const [
    roleModalUser,
    setRoleModalUser,
  ] =
    useState<CompanyAdminMember | null>(
      null
    );

  const [
    statusModalUser,
    setStatusModalUser,
  ] =
    useState<CompanyAdminMember | null>(
      null
    );

  const [draftRole, setDraftRole] =
    useState<MemberRole>(
      "user"
    );

  const [companyId, setCompanyId] =
    useState<string | null>(
      null
    );

  useEffect(() => {
    const storedUser =
      localStorage.getItem(
        "user"
      );

    if (!storedUser) {
      setLoading(false);

      return;
    }

    try {
      const parsedUser =
        JSON.parse(storedUser);

      if (
        parsedUser?.company_id
      ) {
        setCompanyId(
          parsedUser.company_id
        );
      } else {
        toast(
          "No company assigned.",
          "warning"
        );

        setLoading(false);
      }
    } catch (error) {
      console.error(error);

      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!companyId) return;

    loadUsers();
  }, [companyId]);

  async function loadUsers() {
    if (!companyId) return;

    try {
      setLoading(true);

      const response =
        await getCompanyUsers(
          companyId
        );

      const mappedUsers =
        (
          response || []
        ).map(
          (
            user: any
          ): CompanyAdminMember => ({
            id:
              user.id ||
              user.user_id,

            name:
              user.name ||
              user.full_name ||
              "Unknown user",

            email:
              user.email ||
              "No email",

            role:
              user.role ===
              "company_admin"
                ? "company_admin"
                : "user",

            status:
              user.is_active ===
              false
                ? "inactive"
                : "active",

            zone:
              user.zone ||
              "Unassigned",

            lastActiveAt:
              user.last_active_at ||
              new Date().toISOString(),
          })
        );

      setUsers(mappedUsers);
    } catch (error) {
      console.error(error);

      toast(
        "Failed to load company users.",
        "warning"
      );
    } finally {
      setLoading(false);
    }
  }

  const hasActiveFilters =
    searchTerm.trim().length >
      0 ||
    roleFilter !== "all" ||
    statusFilter !== "all";

  const filteredUsers =
    useMemo(() => {
      const normalizedSearch =
        searchTerm
          .trim()
          .toLowerCase();

      return users.filter(
        (user) => {
          const matchesSearch =
            normalizedSearch.length ===
              0 ||
            user.name
              .toLowerCase()
              .includes(
                normalizedSearch
              ) ||
            user.email
              .toLowerCase()
              .includes(
                normalizedSearch
              );

          const matchesRole =
            roleFilter ===
              "all" ||
            user.role ===
              roleFilter;

          const matchesStatus =
            statusFilter ===
              "all" ||
            user.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesRole &&
            matchesStatus
          );
        }
      );
    }, [
      users,
      searchTerm,
      roleFilter,
      statusFilter,
    ]);

  const summary =
    useMemo(() => {
      const active =
        users.filter(
          (user) =>
            user.status ===
            "active"
        ).length;

      const admins =
        users.filter(
          (user) =>
            user.role ===
            "company_admin"
        ).length;

      return {
        total:
          users.length,

        active,

        inactive:
          users.length -
          active,

        admins,
      };
    }, [users]);

  function clearFilters() {
    setSearchTerm("");
    setRoleFilter("all");
    setStatusFilter("all");
  }

  function openRoleModal(
    user: CompanyAdminMember
  ) {
    setRoleModalUser(user);

    setDraftRole(user.role);
  }

  function saveRoleChange() {
    if (!roleModalUser)
      return;

    const nextRole =
      draftRole;

    setUsers(
      (currentUsers) =>
        currentUsers.map(
          (user) =>
            user.id ===
            roleModalUser.id
              ? {
                  ...user,
                  role: nextRole,
                }
              : user
        )
    );

    toast(
      `${roleModalUser.name} role updated.`,
      "success"
    );

    setRoleModalUser(null);
  }

  async function confirmStatusChange() {
    if (
      !statusModalUser ||
      !companyId
    )
      return;

    try {
      await removeCompanyUser(
        companyId,
        statusModalUser.id
      );

      setUsers(
        (currentUsers) =>
          currentUsers.filter(
            (user) =>
              user.id !==
              statusModalUser.id
          )
      );

      toast(
        `${statusModalUser.name} removed from company.`,
        "success"
      );

      setStatusModalUser(
        null
      );
    } catch (error) {
      console.error(error);

      toast(
        "Failed to update user.",
        "warning"
      );
    }
  }

  return (
    <CompanyShell
      activePath="/company/users"
      title="Company users"
      description="Manage roles, access status, and the field team assigned to this company from a single clean roster view."
      statusTone="high"
      statusLabel="Company active"
    >
      <PanelCard
        eyebrow="Directory"
        title="Team management"
        description="Filter the roster, review access, and keep the company structure aligned with current operations."
      >
        <div
          style={{
            display: "grid",
            gap: "1rem",
          }}
        >
          <div
            style={{
              display:
                "grid",

              gridTemplateColumns:
                "minmax(220px, 1.4fr) repeat(2, minmax(160px, .8fr)) auto",

              gap: ".85rem",
            }}
          >
            <input
              className="form-input"
              type="search"
              placeholder="Search by name or email"
              value={
                searchTerm
              }
              onChange={(
                event
              ) =>
                setSearchTerm(
                  event.target
                    .value
                )
              }
            />

            <select
              className="form-select"
              value={
                roleFilter
              }
              onChange={(
                event
              ) =>
                setRoleFilter(
                  event.target
                    .value as RoleFilter
                )
              }
            >
              <option value="all">
                All roles
              </option>

              <option value="company_admin">
                Company admin
              </option>

              <option value="user">
                Field user
              </option>
            </select>

            <select
              className="form-select"
              value={
                statusFilter
              }
              onChange={(
                event
              ) =>
                setStatusFilter(
                  event.target
                    .value as StatusFilter
                )
              }
            >
              <option value="all">
                All statuses
              </option>

              <option value="active">
                Active
              </option>

              <option value="inactive">
                Inactive
              </option>
            </select>

            <button
              type="button"
              className="btn btn--ghost btn--sm"
              style={{
                width:
                  "auto",

                alignSelf:
                  "center",
              }}
              onClick={
                clearFilters
              }
              disabled={
                !hasActiveFilters
              }
            >
              Clear
            </button>
          </div>

          <div
            style={{
              display: "flex",

              alignItems:
                "center",

              justifyContent:
                "space-between",

              gap: "1rem",

              flexWrap:
                "wrap",
            }}
          >
            <div
              style={{
                display:
                  "flex",

                flexWrap:
                  "wrap",

                gap: ".6rem",
              }}
            >
              <SummaryChip
                label="Members"
                value={
                  summary.total
                }
              />

              <SummaryChip
                label="Admins"
                value={
                  summary.admins
                }
              />

              <SummaryChip
                label="Active"
                value={
                  summary.active
                }
              />

              <SummaryChip
                label="Inactive"
                value={
                  summary.inactive
                }
              />
            </div>

            <p
              style={{
                ...bodyTextStyle,

                fontSize:
                  ".84rem",
              }}
            >
              {loading
                ? "Loading users..."
                : `Showing ${filteredUsers.length} of ${users.length} members`}
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
          users={
            filteredUsers
          }
          onEditRole={
            openRoleModal
          }
          onToggleStatus={
            setStatusModalUser
          }
          onClearFilters={
            clearFilters
          }
          hasActiveFilters={
            hasActiveFilters
          }
        />
      </PanelCard>
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
    <section
      style={
        sectionCardStyle
      }
    >
      <div
        style={{
          marginBottom:
            "1.15rem",

          display: "flex",

          alignItems:
            "flex-start",

          justifyContent:
            "space-between",

          gap: "1rem",

          flexWrap:
            "wrap",
        }}
      >
        <div>
          <p
            style={{
              ...labelStyle,

              color:
                "var(--green-800)",

              marginBottom:
                ".45rem",
            }}
          >
            {eyebrow}
          </p>

          <div
            style={{
              display:
                "inline-flex",

              alignItems:
                "center",

              gap: ".55rem",
            }}
          >
            <h2
              style={{
                fontFamily:
                  "var(--font-display)",

                fontSize:
                  "1.45rem",

                fontWeight: 400,

                lineHeight: 1.1,

                letterSpacing:
                  "-.02em",
              }}
            >
              {title}
            </h2>

            <InfoTooltip
              text={
                description
              }
            />
          </div>
        </div>
      </div>

      {children}
    </section>
  );
}

function SummaryChip({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div
      style={{
        display:
          "inline-flex",

        alignItems:
          "center",

        gap: ".45rem",

        padding:
          ".4rem .72rem",

        borderRadius:
          "999px",

        background:
          "var(--green-50)",

        border:
          "1px solid rgba(45,106,45,0.08)",
      }}
    >
      <span
        style={{
          ...labelStyle,

          color:
            "var(--green-800)",

          fontSize:
            ".68rem",
        }}
      >
        {label}
      </span>

      <span
        style={{
          fontWeight: 700,

          color:
            "var(--green-900)",
        }}
      >
        {value}
      </span>
    </div>
  );
}