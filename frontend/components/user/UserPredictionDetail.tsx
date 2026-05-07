// components/user/UserPredictionDetail.tsx

"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

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

const mockPrediction = {
  id: "pred_001",
  label: "Tomato Early Blight",
  confidence: 0.94,
  image_url:
    "https://images.unsplash.com/photo-1592841200221-a6898f307baa?q=80&w=1200&auto=format&fit=crop",
  model_version: "v2.3.1",
  created_at: "2026-05-04",
  feedback: {
    is_correct: false,
    correct_label: "Leaf Mold",
  },
};

export function UserPredictionDetail() {
  const { id } = useParams();

  const prediction = {
    ...mockPrediction,
    id: String(id),
  };

  return (
    
    
    <div
  style={{
    width: "100%",
    maxWidth: 1280,
    margin: "0 auto",
  }}
>
      {/* top actions */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
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
            Prediction detail
          </p>

          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "2.1rem",
              fontWeight: 400,
              letterSpacing: "-.03em",
              lineHeight: 1.1,
              marginBottom: ".45rem",
            }}
          >
            AI diagnosis report
          </h1>

          <p
            style={{
              ...bodyTextStyle,
              maxWidth: 680,
            }}
          >
            Review the uploaded crop image, prediction
            confidence, feedback status, and metadata generated
            during the diagnosis process.
          </p>
        </div>

        <Link
          href="/predictions"
          className="btn btn--ghost btn--sm"
        >
          ← Back to history
        </Link>
      </div>

      {/* main layout */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(0, 1.1fr) minmax(320px, .9fr)",
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        {/* image */}
        <section style={sectionCardStyle}>
          <div
            style={{
              marginBottom: "1rem",
            }}
          >
            <p
              style={{
                ...labelStyle,
                marginBottom: ".35rem",
              }}
            >
              Uploaded image
            </p>

            <h2
              style={{
                fontSize: "1.2rem",
                fontWeight: 600,
                color: "var(--gray-900)",
              }}
            >
              Field capture preview
            </h2>
          </div>

          <img
            src={prediction.image_url}
            alt="Prediction image"
            style={{
              width: "100%",
              borderRadius: "18px",
              objectFit: "cover",
              border: "1px solid var(--gray-100)",
            }}
          />
        </section>

        {/* info */}
        <div
          style={{
            display: "grid",
            gap: "1.5rem",
          }}
        >
          {/* summary */}
          <section style={sectionCardStyle}>
            <div
              style={{
                marginBottom: "1rem",
              }}
            >
              <p
                style={{
                  ...labelStyle,
                  color: "var(--green-800)",
                  marginBottom: ".35rem",
                }}
              >
                Diagnosis
              </p>

              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.6rem",
                  fontWeight: 400,
                  letterSpacing: "-.03em",
                }}
              >
                {prediction.label}
              </h2>
            </div>

            <div
              style={{
                display: "grid",
                gap: "1rem",
              }}
            >
              <InfoTile
                label="Prediction ID"
                value={prediction.id}
              />

              <InfoTile
                label="Model version"
                value={prediction.model_version}
              />

              <InfoTile
                label="Created at"
                value={formatDate(prediction.created_at)}
              />

              {/* confidence */}
              <div
                style={{
                  padding: "1rem",
                  borderRadius: "18px",
                  background: "var(--gray-50)",
                  border: "1px solid var(--gray-100)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: ".7rem",
                  }}
                >
                  <p style={labelStyle}>Confidence</p>

                  <p
                    style={{
                      fontWeight: 700,
                      color: "var(--green-800)",
                    }}
                  >
                    {(prediction.confidence * 100).toFixed(1)}%
                  </p>
                </div>

                <div
                  style={{
                    height: 10,
                    borderRadius: 999,
                    background: "rgba(28,28,26,0.08)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${
                        prediction.confidence * 100
                      }%`,
                      height: "100%",
                      borderRadius: 999,
                      background:
                        "linear-gradient(90deg, var(--green-700), var(--green-600))",
                    }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* feedback */}
          {prediction.feedback && (
            <section style={sectionCardStyle}>
              <div
                style={{
                  marginBottom: "1rem",
                }}
              >
                <p
                  style={{
                    ...labelStyle,
                    color: "var(--green-800)",
                    marginBottom: ".35rem",
                  }}
                >
                  User feedback
                </p>

                <h2
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.4rem",
                    fontWeight: 400,
                    letterSpacing: "-.03em",
                  }}
                >
                  Validation result
                </h2>
              </div>

              <div
                style={{
                  display: "grid",
                  gap: "1rem",
                }}
              >
                <FeedbackPill
                  correct={
                    prediction.feedback.is_correct
                  }
                />

                {!prediction.feedback.is_correct && (
                  <div
                    style={{
                      padding: "1rem",
                      borderRadius: "18px",
                      background:
                        "linear-gradient(180deg, rgba(244,250,244,0.5), var(--white))",
                      border:
                        "1px solid rgba(45,106,45,0.08)",
                    }}
                  >
                    <p style={labelStyle}>
                      Correct label
                    </p>

                    <p
                      style={{
                        marginTop: ".45rem",
                        fontWeight: 600,
                        color: "var(--gray-900)",
                      }}
                    >
                      {
                        prediction.feedback
                          .correct_label
                      }
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </section>
    </div>
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
        padding: "1rem",
        borderRadius: "18px",
        background: "var(--gray-50)",
        border: "1px solid var(--gray-100)",
      }}
    >
      <p style={labelStyle}>{label}</p>

      <p
        style={{
          marginTop: ".4rem",
          fontWeight: 600,
          color: "var(--gray-900)",
          wordBreak: "break-word",
        }}
      >
        {value}
      </p>
    </div>
  );
}

function FeedbackPill({
  correct,
}: {
  correct: boolean;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "fit-content",
        padding: ".45rem .8rem",
        borderRadius: 999,
        background: correct
          ? "rgba(74,143,74,0.1)"
          : "rgba(214,137,16,0.12)",
        color: correct
          ? "var(--green-800)"
          : "var(--warning)",
        fontSize: ".78rem",
        fontWeight: 700,
      }}
    >
      {correct
        ? "✓ Prediction validated"
        : "⚠ Prediction corrected"}
    </span>
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}