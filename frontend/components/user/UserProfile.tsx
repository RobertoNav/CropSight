"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  InfoTooltip,
} from "@/components/company/InfoTooltip";

import {
  StatusBadge,
} from "@/components/ui/StatusBadge";

import {
  getMe,
  updateProfile,
  changePassword,
} from "@/services/auth.service";

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

const inputStyle: React.CSSProperties =
  {
    width: "100%",

    marginTop:
      ".45rem",

    padding:
      ".9rem 1rem",

    borderRadius:
      "14px",

    border:
      "1px solid var(--gray-100)",

    background:
      "var(--gray-50)",

    outline: "none",

    fontSize:
      ".95rem",
  };

interface UserProfileData {
  id: string;

  name: string;

  email: string;

  role: string;

  company?: {
    name: string;
  };
}

export function UserProfile() {
  const [
    user,
    setUser,
  ] =
    useState<UserProfileData | null>(
      null
    );

  const [name, setName] =
    useState("");

  const [
    currentPassword,
    setCurrentPassword,
  ] = useState("");

  const [
    newPassword,
    setNewPassword,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    loadingProfile,
    setLoadingProfile,
  ] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const response =
        await getMe();

      setUser(response);

      setName(
        response.name || ""
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingProfile(
        false
      );
    }
  }

  async function handleSave() {
    if (!user) return;

    try {
      setLoading(true);

      await updateProfile({
        name,
      });

      if (
        currentPassword &&
        newPassword
      ) {
        await changePassword(
          {
            current_password:
              currentPassword,

            new_password:
              newPassword,
          }
        );
      }

      setCurrentPassword(
        ""
      );

      setNewPassword("");

      alert(
        "Profile updated successfully"
      );
    } catch (error) {
      console.error(error);

      alert(
        "Failed to update profile"
      );
    } finally {
      setLoading(false);
    }
  }

  if (loadingProfile) {
    return (
      <div
        style={{
          padding: "2rem",
        }}
      >
        Loading profile...
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",

        gap: "1.5rem",

        maxWidth:
          "1100px",

        margin: "0 auto",

        width: "100%",

        padding:
          "0 1rem",
      }}
    >
      <section
        style={
          sectionCardStyle
        }
      >
        <div
          style={{
            display: "flex",

            justifyContent:
              "space-between",

            gap: "1rem",

            flexWrap:
              "wrap",
          }}
        >
          <div>
            <p
              style={
                labelStyle
              }
            >
              Account
            </p>

            <h1
              style={{
                fontFamily:
                  "var(--font-display)",

                fontSize:
                  "2rem",

                fontWeight: 400,

                letterSpacing:
                  "-.03em",

                marginTop:
                  ".2rem",
              }}
            >
              My Profile
            </h1>
          </div>

          <StatusBadge
            status="high"
            label="Active"
          />
        </div>
      </section>

      <section
        style={{
          display: "grid",

          gridTemplateColumns:
            "repeat(auto-fit, minmax(420px, 1fr))",

          gap: "1.5rem",
        }}
      >
        <SectionCard
          eyebrow="Identity"
          title="Personal information"
          description="Basic information visible across your workspace."
        >
          <InputBlock
            label="Full name"
            value={name}
            onChange={
              setName
            }
          />

          <StaticTile
            label="Email"
            value={
              user?.email ||
              "-"
            }
          />

          <StaticTile
            label="Role"
            value={
              user?.role ===
              "company_admin"
                ? "Company Admin"
                : "Field User"
            }
          />

          <StaticTile
            label="Company"
            value={
              user
                ?.company
                ?.name ||
              "No company"
            }
          />
        </SectionCard>

        <SectionCard
          eyebrow="Security"
          title="Update password"
          description="Change your access credentials."
        >
          <InputBlock
            label="Current password"
            type="password"
            value={
              currentPassword
            }
            onChange={
              setCurrentPassword
            }
          />

          <InputBlock
            label="New password"
            type="password"
            value={
              newPassword
            }
            onChange={
              setNewPassword
            }
          />

          <button
            onClick={
              handleSave
            }
            disabled={
              loading
            }
            className="btn btn--primary"
            style={{
              marginTop:
                ".5rem",

              width:
                "fit-content",
            }}
          >
            {loading
              ? "Saving..."
              : "Save changes"}
          </button>
        </SectionCard>
      </section>
    </div>
  );
}

function SectionCard({
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
            "1.2rem",
        }}
      >
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
          <h3
            style={{
              fontFamily:
                "var(--font-display)",

              fontSize:
                "1.35rem",

              fontWeight: 400,
            }}
          >
            {title}
          </h3>

          <InfoTooltip
            text={
              description
            }
          />
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gap: "1rem",
        }}
      >
        {children}
      </div>
    </section>
  );
}

function InputBlock({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;

  value: string;

  onChange: (
    value: string
  ) => void;

  type?: string;
}) {
  return (
    <div>
      <p
        style={labelStyle}
      >
        {label}
      </p>

      <input
        type={type}
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        style={inputStyle}
      />
    </div>
  );
}

function StaticTile({
  label,
  value,
}: {
  label: string;

  value: string;
}) {
  return (
    <div
      style={{
        padding:
          ".95rem 1rem",

        borderRadius:
          "16px",

        background:
          "var(--gray-50)",

        border:
          "1px solid var(--gray-100)",
      }}
    >
      <p
        style={labelStyle}
      >
        {label}
      </p>

      <p
        style={{
          marginTop:
            ".35rem",

          fontWeight: 600,

          color:
            "var(--gray-900)",
        }}
      >
        {value}
      </p>
    </div>
  );
}