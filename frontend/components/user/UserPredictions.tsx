"use client";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { MetricCard } from "@/components/ui/MetricCard";

import {
  getPredictions,
} from "@/services/predictions.service";

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

interface PredictionItem {
  id: string;

  label: string;

  confidence: number;

  feedback: boolean;

  created_at: string;

  status:
    | "healthy"
    | "warning"
    | "danger";
}

export function UserPredictions() {
  const [
    predictions,
    setPredictions,
  ] = useState<
    PredictionItem[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  useEffect(() => {
    loadPredictions();
  }, []);

  async function loadPredictions() {
    try {
      const response =
        await getPredictions(
          1,
          50
        );

      const mappedPredictions =
        (
          response?.data ||
          []
        ).map(
          (
            item: any
          ): PredictionItem => ({
            id:
              item.id,

            label:
              item.label ||
              item.predicted_label ||
              "Unknown",

            confidence:
              item.confidence ||
              0,

            feedback:
              Boolean(
                item.feedback
              ),

            created_at:
              item.created_at,

            status:
              item.confidence >=
              0.9
                ? "healthy"
                : item.confidence >=
                  0.75
                ? "warning"
                : "danger",
          })
        );

      setPredictions(
        mappedPredictions
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const feedbackCount =
    useMemo(() => {
      return predictions.filter(
        (
          prediction
        ) =>
          prediction.feedback
      ).length;
    }, [predictions]);

  const averageConfidence =
    useMemo(() => {
      if (
        !predictions.length
      )
        return 0;

      const total =
        predictions.reduce(
          (
            acc,
            current
          ) =>
            acc +
            current.confidence,
          0
        );

      return Math.round(
        (total /
          predictions.length) *
          100
      );
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
            "repeat(auto-fit, minmax(220px, 1fr))",

          gap: "1rem",
        }}
      >
        <MetricCard
          label="Total predictions"
          value={
            predictions.length
          }
          sub="Stored in your history"
          icon={
            <span>📂</span>
          }
        />

        <MetricCard
          label="Feedback submitted"
          value={
            feedbackCount
          }
          sub="Helping improve the AI"
          icon={
            <span>✅</span>
          }
        />

        <MetricCard
          label="Average confidence"
          value={`${averageConfidence}%`}
          sub="Across all analyses"
          icon={
            <span>📈</span>
          }
        />
      </section>

      <section
        style={
          sectionCardStyle
        }
      >
        <div
          style={{
            marginBottom:
              "1.5rem",

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
              Diagnosis
              history
            </p>

            <h2
              style={{
                fontFamily:
                  "var(--font-display)",

                fontSize:
                  "1.7rem",

                fontWeight: 400,

                letterSpacing:
                  "-.03em",

                marginBottom:
                  ".45rem",
              }}
            >
              Previous
              predictions
            </h2>

            <p
              style={{
                ...bodyTextStyle,

                maxWidth: 620,
              }}
            >
              Review
              previous AI
              analyses,
              confidence
              scores, and
              feedback
              submissions
              from your
              field uploads.
            </p>
          </div>

          <Link
            href="/predict"
            className="btn btn--primary btn--sm"
          >
            New prediction
          </Link>
        </div>

        {loading ? (
          <p
            style={
              bodyTextStyle
            }
          >
            Loading
            predictions...
          </p>
        ) : !predictions.length ? (
          <div
            style={{
              padding:
                "2rem 1rem",

              textAlign:
                "center",

              border:
                "1px dashed var(--gray-200)",

              borderRadius:
                "18px",
            }}
          >
            <p
              style={{
                fontWeight: 600,

                color:
                  "var(--gray-900)",

                marginBottom:
                  ".45rem",
              }}
            >
              No predictions
              found
            </p>

            <p
              style={
                bodyTextStyle
              }
            >
              Upload your
              first crop
              image to start
              generating AI
              diagnoses.
            </p>
          </div>
        ) : (
          <>
            <div
              style={{
                overflowX:
                  "auto",
              }}
            >
              <table
                style={{
                  width:
                    "100%",

                  borderCollapse:
                    "collapse",
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom:
                        "1px solid var(--gray-100)",
                    }}
                  >
                    {[
                      "Date",
                      "Diagnosis",
                      "Confidence",
                      "Feedback",
                      "Status",
                      "Action",
                    ].map(
                      (
                        head
                      ) => (
                        <th
                          key={
                            head
                          }
                          style={{
                            textAlign:
                              "left",

                            padding:
                              "1rem",

                            fontSize:
                              ".76rem",

                            textTransform:
                              "uppercase",

                            letterSpacing:
                              ".08em",

                            color:
                              "var(--gray-400)",

                            fontWeight: 700,
                          }}
                        >
                          {
                            head
                          }
                        </th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody>
                  {predictions.map(
                    (
                      item
                    ) => (
                      <tr
                        key={
                          item.id
                        }
                        style={{
                          borderBottom:
                            "1px solid rgba(28,28,26,0.06)",

                          transition:
                            ".15s",
                        }}
                      >
                        <td
                          style={{
                            padding:
                              "1rem",

                            color:
                              "var(--gray-600)",

                            fontSize:
                              ".9rem",
                          }}
                        >
                          {formatDate(
                            item.created_at
                          )}
                        </td>

                        <td
                          style={{
                            padding:
                              "1rem",
                          }}
                        >
                          <div
                            style={{
                              display:
                                "grid",

                              gap: ".2rem",
                            }}
                          >
                            <p
                              style={{
                                fontWeight: 600,

                                color:
                                  "var(--gray-900)",
                              }}
                            >
                              {
                                item.label
                              }
                            </p>

                            <p
                              style={{
                                fontSize:
                                  ".82rem",

                                color:
                                  "var(--gray-400)",
                              }}
                            >
                              AI
                              disease
                              classification
                            </p>
                          </div>
                        </td>

                        <td
                          style={{
                            padding:
                              "1rem",

                            minWidth: 180,
                          }}
                        >
                          <div
                            style={{
                              display:
                                "grid",

                              gap: ".45rem",
                            }}
                          >
                            <div
                              style={{
                                height: 8,

                                borderRadius: 999,

                                background:
                                  "rgba(28,28,26,0.08)",

                                overflow:
                                  "hidden",
                              }}
                            >
                              <div
                                style={{
                                  width: `${
                                    item.confidence *
                                    100
                                  }%`,

                                  height:
                                    "100%",

                                  borderRadius: 999,

                                  background:
                                    "linear-gradient(90deg, var(--green-700), var(--green-600))",
                                }}
                              />
                            </div>

                            <span
                              style={{
                                fontSize:
                                  ".82rem",

                                fontWeight: 600,

                                color:
                                  "var(--green-800)",
                              }}
                            >
                              {(
                                item.confidence *
                                100
                              ).toFixed(
                                1
                              )}
                              %
                            </span>
                          </div>
                        </td>

                        <td
                          style={{
                            padding:
                              "1rem",
                          }}
                        >
                          <StatusPill
                            tone={
                              item.feedback
                                ? "success"
                                : "pending"
                            }
                            label={
                              item.feedback
                                ? "Submitted"
                                : "Pending"
                            }
                          />
                        </td>

                        <td
                          style={{
                            padding:
                              "1rem",
                          }}
                        >
                          <StatusPill
                            tone={
                              item.status
                            }
                            label={
                              item.status ===
                              "healthy"
                                ? "Healthy"
                                : item.status ===
                                  "warning"
                                ? "Warning"
                                : "Critical"
                            }
                          />
                        </td>

                        <td
                          style={{
                            padding:
                              "1rem",
                          }}
                        >
                          <Link
                            href={`/predictions/${item.id}`}
                            className="link"
                            style={{
                              fontSize:
                                ".9rem",
                            }}
                          >
                            View
                            details
                            →
                          </Link>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            <div
              style={{
                marginTop:
                  "1.25rem",

                paddingTop:
                  "1rem",

                borderTop:
                  "1px solid var(--gray-100)",

                display: "flex",

                justifyContent:
                  "space-between",

                gap: "1rem",

                flexWrap:
                  "wrap",
              }}
            >
              <p
                style={{
                  fontSize:
                    ".85rem",

                  color:
                    "var(--gray-400)",
                }}
              >
                Showing{" "}
                {
                  predictions.length
                }{" "}
                stored
                predictions
              </p>

              <button className="btn btn--ghost btn--sm">
                Export
                history
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function StatusPill({
  tone,
  label,
}: {
  tone: string;
  label: string;
}) {
  const tones: Record<
    string,
    {
      bg: string;
      color: string;
    }
  > = {
    success: {
      bg: "rgba(74,143,74,0.1)",
      color:
        "var(--green-800)",
    },

    pending: {
      bg: "rgba(214,137,16,0.12)",
      color:
        "var(--warning)",
    },

    healthy: {
      bg: "rgba(74,143,74,0.1)",
      color:
        "var(--green-800)",
    },

    warning: {
      bg: "rgba(214,137,16,0.12)",
      color:
        "var(--warning)",
    },

    danger: {
      bg: "rgba(209,63,63,0.1)",
      color:
        "var(--error)",
    },
  };

  const current =
    tones[tone];

  return (
    <span
      style={{
        display:
          "inline-flex",

        alignItems:
          "center",

        justifyContent:
          "center",

        padding:
          ".35rem .7rem",

        borderRadius:
          999,

        background:
          current.bg,

        color:
          current.color,

        fontSize:
          ".75rem",

        fontWeight: 700,
      }}
    >
      {label}
    </span>
  );
}

function formatDate(
  date: string
) {
  return new Intl.DateTimeFormat(
    "en",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  ).format(
    new Date(date)
  );
}