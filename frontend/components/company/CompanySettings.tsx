"use client";

import { useMemo, useState } from "react";
import { CompanyShell } from "@/components/company/CompanyShell";
import { InfoTooltip } from "@/components/company/InfoTooltip";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import {
  companyAdminMock,
  type CompanySettingsSnapshot,
  type MemberRole,
} from "@/mocks/data/companyAdmin";

type FieldErrorKey = "name" | "sector" | "location" | "adminContactEmail";
type ValidationErrors = Partial<Record<FieldErrorKey, string>>;

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

export function CompanySettings() {
  return (
    <ToastProvider>
      <CompanySettingsContent />
    </ToastProvider>
  );
}

function CompanySettingsContent() {
  const toast = useToast();
  const [savedSettings, setSavedSettings] = useState<CompanySettingsSnapshot>(
    () => cloneSettings(companyAdminMock.settings),
  );
  const [draftSettings, setDraftSettings] = useState<CompanySettingsSnapshot>(
    () => cloneSettings(companyAdminMock.settings),
  );
  const [isSaving, setIsSaving] = useState(false);

  const validationErrors = useMemo(
    () => validateSettings(draftSettings),
    [draftSettings],
  );

  const hasValidationErrors = Object.keys(validationErrors).length > 0;
  const isDirty =
    JSON.stringify(draftSettings) !== JSON.stringify(savedSettings);

  function updateProfile<K extends keyof CompanySettingsSnapshot["profile"]>(
    key: K,
    value: CompanySettingsSnapshot["profile"][K],
  ) {
    setDraftSettings((current) => ({
      ...current,
      profile: {
        ...current.profile,
        [key]: value,
      },
    }));
  }

  function updateAccessPolicy<
    K extends keyof CompanySettingsSnapshot["accessPolicy"],
  >(key: K, value: CompanySettingsSnapshot["accessPolicy"][K]) {
    setDraftSettings((current) => ({
      ...current,
      accessPolicy: {
        ...current.accessPolicy,
        [key]: value,
      },
    }));
  }

  function discardChanges() {
    if (!isDirty || isSaving) return;

    setDraftSettings(cloneSettings(savedSettings));
    toast("Unsaved changes were discarded.", "info");
  }

  async function saveChanges() {
    if (!isDirty || isSaving) return;

    if (hasValidationErrors) {
      toast("Complete the required company fields before saving.", "warning");
      return;
    }

    setIsSaving(true);

    await new Promise((resolve) => window.setTimeout(resolve, 350));

    const timestamp = new Date().toISOString();
    const updatedSettings: CompanySettingsSnapshot = {
      ...draftSettings,
      audit: {
        updatedAt: timestamp,
        updatedBy:
          draftSettings.profile.adminName.trim() ||
          savedSettings.audit.updatedBy,
      },
    };

    setSavedSettings(updatedSettings);
    setDraftSettings(updatedSettings);
    setIsSaving(false);
    toast("Company settings saved.", "success");
  }

  return (
    <CompanyShell
      activePath="/company/settings"
      title="Company settings"
      description="Update company profile details and access defaults from one operational settings view."
      statusTone={toneByStatus[companyAdminMock.company.status]}
      statusLabel={
        companyAdminMock.company.status === "active"
          ? "Company active"
          : "Company suspended"
      }
    >
      <PanelCard
        eyebrow="Profile"
        title="Company profile"
        description="Keep the company identity block current so admins and collaborators see the right operational context."
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1rem",
          }}
        >
          <FormField
            label="Company name"
            error={validationErrors.name}
            htmlFor="settings-company-name"
          >
            <input
              id="settings-company-name"
              className={inputClassName(Boolean(validationErrors.name))}
              type="text"
              value={draftSettings.profile.name}
              onChange={(event) => updateProfile("name", event.target.value)}
              aria-invalid={Boolean(validationErrors.name)}
            />
          </FormField>

          <FormField
            label="Sector"
            error={validationErrors.sector}
            htmlFor="settings-sector"
          >
            <input
              id="settings-sector"
              className={inputClassName(Boolean(validationErrors.sector))}
              type="text"
              value={draftSettings.profile.sector}
              onChange={(event) => updateProfile("sector", event.target.value)}
              aria-invalid={Boolean(validationErrors.sector)}
            />
          </FormField>

          <FormField
            label="Location"
            error={validationErrors.location}
            htmlFor="settings-location"
          >
            <input
              id="settings-location"
              className={inputClassName(Boolean(validationErrors.location))}
              type="text"
              value={draftSettings.profile.location}
              onChange={(event) =>
                updateProfile("location", event.target.value)
              }
              aria-invalid={Boolean(validationErrors.location)}
            />
          </FormField>

          <FormField label="Lead admin" htmlFor="settings-admin-name">
            <input
              id="settings-admin-name"
              className="form-input"
              type="text"
              value={draftSettings.profile.adminName}
              onChange={(event) =>
                updateProfile("adminName", event.target.value)
              }
            />
          </FormField>

          <FormField
            label="Admin contact email"
            error={validationErrors.adminContactEmail}
            htmlFor="settings-admin-email"
          >
            <input
              id="settings-admin-email"
              className={inputClassName(
                Boolean(validationErrors.adminContactEmail),
              )}
              type="email"
              value={draftSettings.profile.adminContactEmail}
              onChange={(event) =>
                updateProfile("adminContactEmail", event.target.value)
              }
              aria-invalid={Boolean(validationErrors.adminContactEmail)}
            />
          </FormField>

          <FormField
            label="Description"
            htmlFor="settings-description"
            style={{ gridColumn: "1 / -1" }}
          >
            <textarea
              id="settings-description"
              className="form-textarea"
              rows={5}
              value={draftSettings.profile.description}
              onChange={(event) =>
                updateProfile("description", event.target.value)
              }
            />
          </FormField>
        </div>
      </PanelCard>

      <PanelCard
        eyebrow="Policy"
        title="Access policy"
        description="Define how new members enter the company workspace and what role they receive by default."
      >
        <div style={{ display: "grid", gap: "1rem" }}>
          <PolicyToggle
            label="Allow join requests"
            description="Let collaborators request access to this company workspace from the public join flow."
            checked={draftSettings.accessPolicy.joinRequestsEnabled}
            onChange={(checked) =>
              updateAccessPolicy("joinRequestsEnabled", checked)
            }
          />

          <PolicyToggle
            label="Require admin approval"
            description="Keep every incoming request in the review queue until a company admin approves it."
            checked={draftSettings.accessPolicy.requireAdminApproval}
            onChange={(checked) =>
              updateAccessPolicy("requireAdminApproval", checked)
            }
            disabled={!draftSettings.accessPolicy.joinRequestsEnabled}
          />

          <div
            style={{
              display: "grid",
              gap: ".45rem",
              maxWidth: 320,
            }}
          >
            <label htmlFor="settings-default-role" style={labelStyle}>
              Default member role
            </label>
            <select
              id="settings-default-role"
              className="form-select"
              value={draftSettings.accessPolicy.defaultMemberRole}
              onChange={(event) =>
                updateAccessPolicy(
                  "defaultMemberRole",
                  event.target.value as MemberRole,
                )
              }
            >
              <option value="user">Field user</option>
              <option value="company_admin">Company admin</option>
            </select>
            <p style={{ ...bodyTextStyle, fontSize: ".84rem" }}>
              New approved members will land with this role unless an admin
              edits it later.
            </p>
          </div>
        </div>
      </PanelCard>

      <PanelCard
        eyebrow="Audit"
        title="Audit snapshot"
        description="A compact reference for the latest settings update inside the company workspace."
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1rem",
          }}
        >
          <AuditTile
            label="Last updated by"
            value={draftSettings.audit.updatedBy}
          />
          <AuditTile
            label="Last updated at"
            value={formatDateTime(draftSettings.audit.updatedAt)}
          />
        </div>
      </PanelCard>

      <section
        style={{
          ...sectionCardStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <p style={{ ...bodyTextStyle, fontSize: ".86rem" }}>
          {isDirty
            ? "You have unsaved changes in this settings view."
            : "All changes are up to date for this company workspace."}
        </p>
        <div
          style={{
            display: "inline-flex",
            gap: ".75rem",
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            style={{ width: "auto" }}
            onClick={discardChanges}
            disabled={!isDirty || isSaving}
          >
            Discard
          </button>
          <button
            type="button"
            className="btn btn--primary btn--sm"
            style={{ width: "auto" }}
            onClick={saveChanges}
            disabled={!isDirty || isSaving}
          >
            {isSaving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </section>
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

function FormField({
  label,
  error,
  htmlFor,
  style,
  children,
}: {
  label: string;
  error?: string;
  htmlFor: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "grid", gap: ".45rem", ...style }}>
      <label htmlFor={htmlFor} style={labelStyle}>
        {label}
      </label>
      {children}
      {error ? (
        <p
          style={{
            color: "var(--error)",
            fontSize: ".8rem",
            marginTop: "-.1rem",
          }}
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

function PolicyToggle({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "1rem",
        padding: ".95rem 1rem",
        borderRadius: "18px",
        border: "1px solid rgba(45,106,45,0.08)",
        background: disabled ? "var(--gray-50)" : "rgba(244,250,244,0.45)",
        opacity: disabled ? 0.65 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <div style={{ display: "grid", gap: ".2rem" }}>
        <span style={{ color: "var(--gray-900)", fontWeight: 600 }}>
          {label}
        </span>
        <span style={{ ...bodyTextStyle, fontSize: ".86rem" }}>
          {description}
        </span>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
        style={{
          width: 18,
          height: 18,
          marginTop: 2,
          accentColor: "var(--green-700)",
          flexShrink: 0,
        }}
      />
    </label>
  );
}

function AuditTile({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        borderRadius: "18px",
        padding: "1rem",
        border: "1px solid rgba(45,106,45,0.08)",
        background:
          "linear-gradient(180deg, rgba(244,250,244,0.45), var(--white))",
        display: "grid",
        gap: ".32rem",
      }}
    >
      <span style={labelStyle}>{label}</span>
      <span style={{ color: "var(--gray-900)", fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function validateSettings(settings: CompanySettingsSnapshot): ValidationErrors {
  const errors: ValidationErrors = {};
  const { profile } = settings;

  if (!profile.name.trim()) {
    errors.name = "Company name is required.";
  }

  if (!profile.sector.trim()) {
    errors.sector = "Sector is required.";
  }

  if (!profile.location.trim()) {
    errors.location = "Location is required.";
  }

  if (!profile.adminContactEmail.trim()) {
    errors.adminContactEmail = "Admin contact email is required.";
  } else if (!/^\S+@\S+\.\S+$/.test(profile.adminContactEmail.trim())) {
    errors.adminContactEmail = "Enter a valid email address.";
  }

  return errors;
}

function cloneSettings(
  settings: CompanySettingsSnapshot,
): CompanySettingsSnapshot {
  return {
    profile: { ...settings.profile },
    accessPolicy: { ...settings.accessPolicy },
    audit: { ...settings.audit },
  };
}

function inputClassName(hasError: boolean) {
  return hasError ? "form-input form-input--error" : "form-input";
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
