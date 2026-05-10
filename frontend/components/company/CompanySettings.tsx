"use client";

import { useMemo, useState } from "react";
import { CompanyShell } from "@/components/company/CompanyShell";
import { InfoTooltip } from "@/components/company/InfoTooltip";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import {
  companyAdminMock,
  type CompanySettingsSnapshot,
} from "@/mocks/data/companyAdmin";

type FieldErrorKey = "name" | "logo_url";
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
  const [companyRecord, setCompanyRecord] = useState(() => ({
    ...companyAdminMock.company,
  }));
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

  function updateSetting<K extends keyof CompanySettingsSnapshot>(
    key: K,
    value: CompanySettingsSnapshot[K],
  ) {
    setDraftSettings((current) => ({
      ...current,
      [key]: value,
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
      toast("Complete the supported company fields before saving.", "warning");
      return;
    }

    setIsSaving(true);
    await new Promise((resolve) => window.setTimeout(resolve, 350));

    const updatedSettings: CompanySettingsSnapshot = {
      name: draftSettings.name.trim(),
      logo_url: normalizeLogoUrl(draftSettings.logo_url),
    };

    setSavedSettings(updatedSettings);
    setDraftSettings(updatedSettings);
    setCompanyRecord((current) => ({
      ...current,
      name: updatedSettings.name,
      logo_url: updatedSettings.logo_url || null,
    }));
    setIsSaving(false);
    toast("Company update payload saved.", "success");
  }

  return (
    <CompanyShell
      activePath="/company/settings"
      title="Company settings"
      description="Edit the company payload supported today and review the rest of the company record as read-only metadata."
      statusTone={toneByStatus[companyAdminMock.company.status]}
      statusLabel={
        companyAdminMock.company.status === "active"
          ? "Company active"
          : "Company suspended"
      }
    >
      <PanelCard
        eyebrow="Update request"
        title="Editable company fields"
        description="This screen is aligned to PUT /companies/:id, which currently supports only the company name and logo URL."
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
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
              value={draftSettings.name}
              onChange={(event) => updateSetting("name", event.target.value)}
              aria-invalid={Boolean(validationErrors.name)}
            />
          </FormField>

          <FormField
            label="Logo URL"
            error={validationErrors.logo_url}
            htmlFor="settings-logo-url"
          >
            <input
              id="settings-logo-url"
              className={inputClassName(Boolean(validationErrors.logo_url))}
              type="url"
              placeholder="https://example.com/logo.png"
              value={draftSettings.logo_url}
              onChange={(event) =>
                updateSetting("logo_url", event.target.value)
              }
              aria-invalid={Boolean(validationErrors.logo_url)}
            />
          </FormField>

          <LogoPreviewCard logoUrl={draftSettings.logo_url} />
        </div>
      </PanelCard>

      <PanelCard
        eyebrow="Read only"
        title="Company record"
        description="These fields come from the company response and are not editable from this screen under the current backend contract."
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1rem",
          }}
        >
          <ReadOnlyTile
            label="Sector"
            value={companyRecord.sector || "Not provided"}
          />
          <ReadOnlyTile
            label="Status"
            value={companyRecord.status === "active" ? "Active" : "Suspended"}
          />
          <ReadOnlyTile
            label="Created"
            value={formatDate(companyRecord.created_at)}
          />
          <ReadOnlyTile
            label="Logo state"
            value={companyRecord.logo_url ? "Configured" : "Missing"}
          />
        </div>
      </PanelCard>

      {isDirty ? (
        <>
          <div aria-hidden style={{ height: "4.75rem" }} />
          <section
            style={{
              position: "fixed",
              right: "max(1rem, calc(50% - 580px + 1rem))",
              bottom: "1.5rem",
              zIndex: 40,
              width: "fit-content",
              maxWidth: "calc(100vw - 2rem)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: ".4rem",
              flexWrap: "wrap",
              padding: ".6rem .65rem",
              borderRadius: "16px",
              border: "1px solid rgba(45,106,45,0.12)",
              background: "rgba(255,255,255,0.94)",
              boxShadow: "0 18px 48px rgba(28,28,26,0.14)",
              backdropFilter: "blur(14px)",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                gap: ".55rem",
                flexWrap: "wrap",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                style={{ width: "auto" }}
                onClick={discardChanges}
                disabled={isSaving}
              >
                Discard
              </button>
              <button
                type="button"
                className="btn btn--primary btn--sm"
                style={{ width: "auto" }}
                onClick={saveChanges}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </section>
        </>
      ) : null}
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

function LogoPreviewCard({ logoUrl }: { logoUrl: string }) {
  const normalizedLogoUrl = normalizeLogoUrl(logoUrl);

  return (
    <div
      style={{
        display: "grid",
        gap: ".55rem",
        padding: "1rem",
        borderRadius: "18px",
        border: "1px solid rgba(45,106,45,0.08)",
        background:
          "linear-gradient(180deg, rgba(244,250,244,0.45), var(--white))",
      }}
    >
      <span style={{ ...labelStyle, color: "var(--green-800)" }}>
        Logo preview
      </span>
      {normalizedLogoUrl ? (
        <>
          <p style={{ color: "var(--gray-900)", fontWeight: 600 }}>
            Configured logo URL
          </p>
          <a
            href={normalizedLogoUrl}
            target="_blank"
            rel="noreferrer"
            className="link"
            style={{ fontSize: ".88rem", wordBreak: "break-all" }}
          >
            {normalizedLogoUrl}
          </a>
        </>
      ) : (
        <div style={{ display: "grid", gap: ".2rem" }}>
          <p style={{ color: "var(--gray-900)", fontWeight: 600 }}>
            No logo configured
          </p>
          <p style={{ ...bodyTextStyle, fontSize: ".86rem" }}>
            Leave the field empty until the company has a public logo asset.
          </p>
        </div>
      )}
    </div>
  );
}

function ReadOnlyTile({ label, value }: { label: string; value: string }) {
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

  if (!settings.name.trim()) {
    errors.name = "Company name is required.";
  }

  if (settings.logo_url.trim() && !isValidHttpUrl(settings.logo_url.trim())) {
    errors.logo_url = "Enter a valid http or https URL.";
  }

  return errors;
}

function cloneSettings(
  settings: CompanySettingsSnapshot,
): CompanySettingsSnapshot {
  return {
    name: settings.name,
    logo_url: settings.logo_url,
  };
}

function inputClassName(hasError: boolean) {
  return hasError ? "form-input form-input--error" : "form-input";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function normalizeLogoUrl(value: string) {
  return value.trim();
}

function isValidHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
