"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { CompanyShell } from "@/components/company/CompanyShell";
import { InfoTooltip } from "@/components/company/InfoTooltip";

import {
  ToastProvider,
  useToast,
} from "@/components/ui/Toast";

import {
  getCompanyById,
  updateCompany,
  type Company,
} from "@/services/company.service";

import {
  companyAdminMock,
  type CompanySettingsSnapshot,
  type MemberRole,
} from "@/mocks/data/companyAdmin";

type FieldErrorKey =
  | "name"
  | "sector"
  | "location"
  | "adminContactEmail";

type ValidationErrors =
  Partial<
    Record<
      FieldErrorKey,
      string
    >
  >;

const sectionCardStyle: React.CSSProperties =
  {
    background: "var(--white)",
    borderRadius: "20px",
    border:
      "1px solid rgba(45,106,45,0.08)",
    boxShadow:
      "var(--shadow-card)",
    padding: "1.35rem",
  };

const labelStyle: React.CSSProperties =
  {
    fontSize: ".75rem",
    color: "var(--gray-400)",
    textTransform: "uppercase",
    letterSpacing: ".08em",
    fontWeight: 600,
  };

const bodyTextStyle: React.CSSProperties =
  {
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

  const [company, setCompany] =
    useState<Company | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [
    savedSettings,
    setSavedSettings,
  ] = useState<CompanySettingsSnapshot>(
    () =>
      cloneSettings(
        companyAdminMock.settings
      )
  );

  const [
    draftSettings,
    setDraftSettings,
  ] = useState<CompanySettingsSnapshot>(
    () =>
      cloneSettings(
        companyAdminMock.settings
      )
  );

  const [isSaving, setIsSaving] =
    useState(false);

  const validationErrors =
    useMemo(
      () =>
        validateSettings(
          draftSettings
        ),
      [draftSettings]
    );

  const hasValidationErrors =
    Object.keys(
      validationErrors
    ).length > 0;

  const isDirty =
    JSON.stringify(
      draftSettings
    ) !==
    JSON.stringify(
      savedSettings
    );

  /* TEMPORAL */
  const companyId =
    "YOUR_COMPANY_ID";

  useEffect(() => {
    async function loadCompany() {
      try {
        const data =
          await getCompanyById(
            companyId
          );

        setCompany(data);

        const updatedSettings =
          {
            ...cloneSettings(
              companyAdminMock.settings
            ),

            profile: {
              ...companyAdminMock
                .settings.profile,

              name:
                data.name || "",

              sector:
                data.sector ||
                "",
            },
          };

        setSavedSettings(
          updatedSettings
        );

        setDraftSettings(
          updatedSettings
        );
      } catch (error) {
        console.error(error);

        toast(
          "Failed to load company settings.",
          "error"
        );
      } finally {
        setLoading(false);
      }
    }

    loadCompany();
  }, [toast]);

  function updateProfile<
    K extends keyof CompanySettingsSnapshot["profile"]
  >(
    key: K,
    value: CompanySettingsSnapshot["profile"][K]
  ) {
    setDraftSettings(
      (current) => ({
        ...current,

        profile: {
          ...current.profile,

          [key]: value,
        },
      })
    );
  }

  function updateAccessPolicy<
    K extends keyof CompanySettingsSnapshot["accessPolicy"]
  >(
    key: K,
    value: CompanySettingsSnapshot["accessPolicy"][K]
  ) {
    setDraftSettings(
      (current) => ({
        ...current,

        accessPolicy: {
          ...current.accessPolicy,

          [key]: value,
        },
      })
    );
  }

  function discardChanges() {
    if (!isDirty || isSaving)
      return;

    setDraftSettings(
      cloneSettings(
        savedSettings
      )
    );

    toast(
      "Unsaved changes were discarded.",
      "info"
    );
  }

  async function saveChanges() {
    if (!isDirty || isSaving)
      return;

    if (
      hasValidationErrors
    ) {
      toast(
        "Complete the required company fields before saving.",
        "warning"
      );

      return;
    }

    setIsSaving(true);

    try {
      if (company) {
        const updatedCompany =
          await updateCompany(
            company.id,
            {
              name:
                draftSettings
                  .profile.name,
            }
          );

        setCompany(
          updatedCompany
        );
      }

      const timestamp =
        new Date().toISOString();

      const updatedSettings: CompanySettingsSnapshot =
        {
          ...draftSettings,

          audit: {
            updatedAt:
              timestamp,

            updatedBy:
              draftSettings
                .profile.adminName
                .trim() ||
              savedSettings
                .audit
                .updatedBy,
          },
        };

      setSavedSettings(
        updatedSettings
      );

      setDraftSettings(
        updatedSettings
      );

      toast(
        "Company settings saved.",
        "success"
      );
    } catch (error) {
      console.error(error);

      toast(
        "Failed to save company settings.",
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (loading) {
    return (
      <div
        style={{
          padding: "2rem",
        }}
      >
        Loading company
        settings...
      </div>
    );
  }

  return (
    <CompanyShell
      activePath="/company/settings"
      title={
        company?.name ||
        "Company settings"
      }
      description="Update company profile details and access defaults from one operational settings view."
      statusTone={
        toneByStatus[
          company?.status ||
            "active"
        ]
      }
      statusLabel={
        company?.status ===
        "suspended"
          ? "Company suspended"
          : "Company active"
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
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1rem",
          }}
        >
          <FormField
            label="Company name"
            error={
              validationErrors.name
            }
            htmlFor="settings-company-name"
          >
            <input
              id="settings-company-name"
              className={inputClassName(
                Boolean(
                  validationErrors.name
                )
              )}
              type="text"
              value={
                draftSettings.profile
                  .name
              }
              onChange={(
                event
              ) =>
                updateProfile(
                  "name",
                  event.target.value
                )
              }
            />
          </FormField>

          <FormField
            label="Sector"
            error={
              validationErrors.sector
            }
            htmlFor="settings-sector"
          >
            <input
              id="settings-sector"
              className={inputClassName(
                Boolean(
                  validationErrors.sector
                )
              )}
              type="text"
              value={
                draftSettings.profile
                  .sector
              }
              onChange={(
                event
              ) =>
                updateProfile(
                  "sector",
                  event.target.value
                )
              }
            />
          </FormField>

          <FormField
            label="Location"
            error={
              validationErrors.location
            }
            htmlFor="settings-location"
          >
            <input
              id="settings-location"
              className={inputClassName(
                Boolean(
                  validationErrors.location
                )
              )}
              type="text"
              value={
                draftSettings.profile
                  .location
              }
              onChange={(
                event
              ) =>
                updateProfile(
                  "location",
                  event.target.value
                )
              }
            />
          </FormField>

          <FormField
            label="Lead admin"
            htmlFor="settings-admin-name"
          >
            <input
              id="settings-admin-name"
              className="form-input"
              type="text"
              value={
                draftSettings.profile
                  .adminName
              }
              onChange={(
                event
              ) =>
                updateProfile(
                  "adminName",
                  event.target.value
                )
              }
            />
          </FormField>

          <FormField
            label="Admin contact email"
            error={
              validationErrors.adminContactEmail
            }
            htmlFor="settings-admin-email"
          >
            <input
              id="settings-admin-email"
              className={inputClassName(
                Boolean(
                  validationErrors.adminContactEmail
                )
              )}
              type="email"
              value={
                draftSettings.profile
                  .adminContactEmail
              }
              onChange={(
                event
              ) =>
                updateProfile(
                  "adminContactEmail",
                  event.target.value
                )
              }
            />
          </FormField>
        </div>
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
    <section style={sectionCardStyle}>
      <div
        style={{
          marginBottom: "1.15rem",
        }}
      >
        <p
          style={{
            ...labelStyle,
            color:
              "var(--green-800)",
            marginBottom: ".45rem",
          }}
        >
          {eyebrow}
        </p>

        <div
          style={{
            display:
              "inline-flex",
            alignItems: "center",
            gap: ".55rem",
          }}
        >
          <h2
            style={{
              fontFamily:
                "var(--font-display)",
              fontSize: "1.45rem",
              fontWeight: 400,
            }}
          >
            {title}
          </h2>

          <InfoTooltip
            text={description}
          />
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
    <div
      style={{
        display: "grid",
        gap: ".45rem",
        ...style,
      }}
    >
      <label
        htmlFor={htmlFor}
        style={labelStyle}
      >
        {label}
      </label>

      {children}

      {error ? (
        <p
          style={{
            color:
              "var(--error)",
            fontSize: ".8rem",
          }}
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

function validateSettings(
  settings: CompanySettingsSnapshot
): ValidationErrors {
  const errors: ValidationErrors =
    {};

  const { profile } =
    settings;

  if (
    !profile.name.trim()
  ) {
    errors.name =
      "Company name is required.";
  }

  if (
    !profile.sector.trim()
  ) {
    errors.sector =
      "Sector is required.";
  }

  if (
    !profile.location.trim()
  ) {
    errors.location =
      "Location is required.";
  }

  if (
    !profile.adminContactEmail.trim()
  ) {
    errors.adminContactEmail =
      "Admin contact email is required.";
  } else if (
    !/^\S+@\S+\.\S+$/.test(
      profile.adminContactEmail.trim()
    )
  ) {
    errors.adminContactEmail =
      "Enter a valid email address.";
  }

  return errors;
}

function cloneSettings(
  settings: CompanySettingsSnapshot
): CompanySettingsSnapshot {
  return {
    profile: {
      ...settings.profile,
    },

    accessPolicy: {
      ...settings.accessPolicy,
    },

    audit: {
      ...settings.audit,
    },
  };
}

function inputClassName(
  hasError: boolean
) {
  return hasError
    ? "form-input form-input--error"
    : "form-input";
}

function formatDateTime(
  value: string
) {
  return new Intl.DateTimeFormat(
    "en",
    {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  ).format(
    new Date(value)
  );
}