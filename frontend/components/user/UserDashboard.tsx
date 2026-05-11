"use client";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import { MetricCard } from "@/components/ui/MetricCard";

import { Badge } from "@/components/ui/Badge";

import {
  getMe,
} from "@/services/auth.service";

import {
  getPredictions,
} from "@/services/predictions.service";

interface UserProfile {
  id: string;
  name: string;
  email: string;

  company?: {
    name: string;
  };

  created_at?: string;
}

interface PredictionItem {
  id: string;
  label: string;
  confidence: number;
  created_at: string;
}

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

export function UserDashboard() {
  const router =
    useRouter();

  const [user, setUser] =
    useState<UserProfile | null>(
      null
    );

  const [
    predictions,
    setPredictions,
  ] = useState<
    PredictionItem[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const token =
      localStorage.getItem(
        "access_token"
      );

    if (!token) {
      router.replace(
        "/login"
      );

      return;
    }

    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const [
        userResponse,
        predictionsResponse,
      ] =
        await Promise.all([
          getMe(),

          getPredictions(
            1,
            10
          ),
        ]);

      setUser(userResponse);

      setPredictions(
        (
          predictionsResponse
            ?.data || []
        ).map(
          (
            prediction: any
          ) => ({
            id:
              prediction.id,

            label:
              prediction.label ||
              prediction.predicted_label ||
              "Unknown",

            confidence:
              prediction.confidence ||
              0,

            created_at:
              prediction.created_at,
          })
        )
      );
    } catch (error: any) {
      console.error(error);

      if (
        error?.response
          ?.status === 401
      ) {
        localStorage.removeItem(
          "access_token"
        );

        localStorage.removeItem(
          "refresh_token"
        );

        localStorage.removeItem(
          "user"
        );

        localStorage.removeItem(
          "role"
        );

        router.replace(
          "/login"
        );
      }
    } finally {
      setLoading(false);
    }
  }

  const bestConfidence =
    useMemo(() => {
      if (
        !predictions.length
      )
        return 0;

      return Math.max(
        ...predictions.map(
          (
            prediction
          ) =>
            prediction.confidence
        )
      );
    }, [predictions]);

  const uniqueLabels =
    useMemo(() => {
      return new Set(
        predictions.map(
          (
            prediction
          ) =>
            prediction.label
        )
      ).size;
    }, [predictions]);

  return (
    <div
      style={{
        display: "grid",
        gap: "1.5rem",
      }}
    >
      <section
        style={{
          display: "grid",

          gridTemplateColumns:
            "repeat(auto-fit,minmax(320px,1fr))",

          gap: "1.5rem",
        }}
      >
        <SectionCard
          eyebrow="Profile"
          title="Field user overview"
          description="A quick operational snapshot of your account and prediction activity."
        >
          <div
            style={{
              display: "grid",
              gap: "1.25rem",
            }}
          >
            <div>
              <p
                style={
                  labelStyle
                }
              >
                Welcome back
              </p>

              <h2
                style={{
                  fontFamily:
                    "var(--font-display)",

                  fontSize:
                    "2rem",

                  fontWeight: 400,

                  lineHeight: 1.05,

                  letterSpacing:
                    "-.03em",

                  marginTop:
                    ".2rem",
                }}
              >
                {loading
                  ? "Loading..."
                  : user?.name ||
                    "User"}
              </h2>
            </div>

            <div
              style={{
                display:
                  "grid",

                gridTemplateColumns:
                  "repeat(auto-fit, minmax(190px,1fr))",

                gap: "1rem",
              }}
            >
              <InfoTile
                label="Company"
                value={
                  user
                    ?.company
                    ?.name ||
                  "No company"
                }
              />

              <InfoTile
                label="Email"
                value={
                  user?.email ||
                  "-"
                }
              />

              <InfoTile
                label="Member since"
                value={
                  user?.created_at
                    ? formatDate(
                        user.created_at
                      )
                    : "-"
                }
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Quick actions"
          title="Continue your workflow"
          description="Jump into the next actions without leaving your dashboard."
        >
          <div
            style={{
              display: "grid",
              gap: "1rem",
            }}
          >
            <QuickLink
              href="/predict"
              label="Run a new prediction"
            />

            <QuickLink
              href="/predictions"
              label="Review prediction history"
            />

            <QuickLink
              href="/profile"
              label="Update your profile"
            />
          </div>
        </SectionCard>
      </section>

      <section
        style={{
          display: "grid",

          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px,1fr))",

          gap: "1rem",
        }}
      >
        <MetricCard
          label="Total predictions"
          value={
            predictions.length
          }
          sub="Captured analyses"
          trend={{
            label:
              "Latest activity",

            up: true,
          }}
          icon={
            <span>
              🌿
            </span>
          }
        />

        <MetricCard
          label="Best confidence"
          value={`${(
            bestConfidence *
            100
          ).toFixed(1)}%`}
          sub="Latest model"
          trend={{
            label:
              "Stable",

            up: true,
          }}
          icon={
            <span>
              🎯
            </span>
          }
        />

        <MetricCard
          label="Detected diseases"
          value={
            uniqueLabels
          }
          sub="Unique labels"
          icon={
            <span>
              🦠
            </span>
          }
        />

        <MetricCard
          label="Feedback rate"
          value="94%"
          sub="Validated predictions"
          icon={
            <span>
              ✅
            </span>
          }
        />
      </section>

      <SectionCard
        eyebrow="Prediction history"
        title="Recent predictions"
        description="A compact timeline of your latest crop analyses."
      >
        <div
          style={{
            display: "grid",
            gap: ".9rem",
          }}
        >
          {!predictions.length &&
          !loading ? (
            <p
              style={
                bodyTextStyle
              }
            >
              No predictions
              yet.
            </p>
          ) : null}

          {predictions.map(
            (
              prediction
            ) => (
              <div
                key={
                  prediction.id
                }
                style={{
                  display:
                    "flex",

                  justifyContent:
                    "space-between",

                  alignItems:
                    "center",

                  paddingBottom:
                    ".9rem",

                  borderBottom:
                    "1px solid var(--gray-100)",
                }}
              >
                <div>
                  <p
                    style={{
                      fontWeight: 600,

                      color:
                        "var(--gray-900)",
                    }}
                  >
                    {
                      prediction.label
                    }
                  </p>

                  <p
                    style={{
                      ...bodyTextStyle,

                      fontSize:
                        ".85rem",
                    }}
                  >
                    {formatDate(
                      prediction.created_at
                    )}
                  </p>
                </div>

                <Badge>
                  {(
                    prediction.confidence *
                    100
                  ).toFixed(
                    1
                  )}
                  %
                </Badge>
              </div>
            )
          )}
        </div>
      </SectionCard>
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
            "1.15rem",
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

        <h3
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
        </h3>

        <p
          style={{
            ...bodyTextStyle,

            marginTop:
              ".45rem",
          }}
        >
          {description}
        </p>
      </div>

      {children}
    </section>
  );
}

function InfoTile({
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
        style={
          labelStyle
        }
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

function QuickLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="link"
      style={{
        textDecoration:
          "none",

        fontWeight: 600,
      }}
    >
      {label} →
    </Link>
  );
}

function formatDate(
  value: string
) {
  return new Intl.DateTimeFormat(
    "en",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  ).format(
    new Date(value)
  );
}