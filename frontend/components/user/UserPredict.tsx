"use client";

import {
  useRef,
  useState,
} from "react";

import { MetricCard } from "@/components/ui/MetricCard";

import {
  createPrediction,
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

interface PredictionResult {
  id: string;

  label: string;

  confidence: number;

  image_url: string;

  model_version: string;

  recommendation?: string;
}

export function UserPredict() {
  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [prediction, setPrediction] =
    useState<PredictionResult | null>(
      null
    );

  const [selectedFile, setSelectedFile] =
    useState<File | null>(
      null
    );

  const [previewUrl, setPreviewUrl] =
    useState<string>("");

  const [loading, setLoading] =
    useState(false);

async function handlePrediction() {
  if (!selectedFile)
    return;

  try {
    setLoading(true);

    const response =
      await createPrediction(
        selectedFile
      );

    setPrediction({
      id:
        response.id,

      label:
        response.label ||
        response.predicted_label ||
        "Unknown",

      confidence:
        response.confidence ||
        0,

      image_url:
        response.image_url ||
        previewUrl,

      model_version:
        response.model_version ||
        "v1.0.0",

      recommendation:
        response.recommendation,
    });
  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
}
  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    setSelectedFile(file);

    setPreviewUrl(
      URL.createObjectURL(file)
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gap: "1.5rem",
      }}
    >
      {/* metrics */}
      <section
        style={{
          display: "grid",

          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",

          gap: "1rem",
        }}
      >
        <MetricCard
          label="Analyses this week"
          value="18"
          sub="Uploaded by your account"
          icon={
            <span>
              🌿
            </span>
          }
        />

        <MetricCard
          label="Most common issue"
          value="Leaf Spot"
          sub="Detected in recent uploads"
          icon={
            <span>
              🦠
            </span>
          }
        />

        <MetricCard
          label="Average confidence"
          value="92%"
          sub="Across all predictions"
          icon={
            <span>
              📈
            </span>
          }
        />
      </section>

      {!prediction ? (
        <section
          style={
            sectionCardStyle
          }
        >
          <div
            style={{
              marginBottom:
                "1.5rem",
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
              New prediction
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
                  ".55rem",
              }}
            >
              Upload a crop image
            </h2>

            <p
              style={{
                ...bodyTextStyle,

                maxWidth: 620,

                lineHeight: 1.7,
              }}
            >
              Add a field image
              to receive an
              instant
              AI-powered
              diagnosis and
              confidence score
              for possible crop
              diseases.
            </p>
          </div>

          {/* upload zone */}
          <div
            style={{
              border:
                "2px dashed var(--gray-200)",

              borderRadius:
                "20px",

              background:
                "linear-gradient(180deg, rgba(244,250,244,0.8), var(--white))",

              padding:
                "4rem 2rem",

              display:
                "grid",

              placeItems:
                "center",

              textAlign:
                "center",
            }}
          >
            <input
              ref={
                fileInputRef
              }
              type="file"
              accept="image/*"
              hidden
              onChange={
                handleFileChange
              }
            />

            <div
              style={{
                width: 72,

                height: 72,

                borderRadius:
                  "20px",

                background:
                  "var(--green-100)",

                display:
                  "grid",

                placeItems:
                  "center",

                fontSize:
                  "2rem",

                marginBottom:
                  "1rem",
              }}
            >
              🌱
            </div>

            <h3
              style={{
                fontSize:
                  "1.2rem",

                fontWeight: 600,

                color:
                  "var(--gray-900)",

                marginBottom:
                  ".45rem",
              }}
            >
              Drag & drop your
              image
            </h3>

            <p
              style={{
                ...bodyTextStyle,

                maxWidth: 420,

                marginBottom:
                  "1.5rem",
              }}
            >
              Supports JPG,
              PNG and
              high-resolution
              field photos
              captured directly
              from mobile
              devices.
            </p>

            {selectedFile ? (
              <p
                style={{
                  marginBottom:
                    "1rem",

                  fontWeight: 600,

                  color:
                    "var(--green-800)",
                }}
              >
                {
                  selectedFile.name
                }
              </p>
            ) : null}

            <div
              style={{
                display:
                  "flex",

                gap: "1rem",

                flexWrap:
                  "wrap",

                justifyContent:
                  "center",
              }}
            >
              <button
                className="btn btn--ghost"
                style={{
                  width:
                    "auto",
                }}
                onClick={() =>
                  fileInputRef.current?.click()
                }
              >
                Select image
              </button>

              <button
                className="btn btn--primary"
                style={{
                  width:
                    "auto",

                  padding:
                    ".8rem 1.5rem",
                }}
                disabled={
                  !selectedFile ||
                  loading
                }
                onClick={
                  handlePrediction
                }
              >
                {loading
                  ? "Analyzing..."
                  : "Upload and analyze"}
              </button>
            </div>
          </div>
        </section>
      ) : (
        <section
          style={{
            display: "grid",
            gap: "1.5rem",
          }}
        >
          {/* result card */}
          <section
            style={
              sectionCardStyle
            }
          >
            <div
              style={{
                marginBottom:
                  "1.5rem",
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
                Diagnosis
                result
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
                }}
              >
                AI prediction
                summary
              </h2>
            </div>

            <div
              style={{
                display:
                  "grid",

                gridTemplateColumns:
                  "repeat(auto-fit, minmax(320px, 1fr))",

                gap: "2rem",

                alignItems:
                  "start",
              }}
            >
              <img
                src={
                  prediction.image_url
                }
                alt="Prediction"
                style={{
                  width: "100%",

                  borderRadius:
                    "18px",

                  objectFit:
                    "cover",

                  border:
                    "1px solid var(--gray-100)",

                  boxShadow:
                    "var(--shadow-card)",
                }}
              />

              <div
                style={{
                  display:
                    "grid",

                  gap: "1.25rem",
                }}
              >
                <InfoTile
                  label="Detected disease"
                  value={
                    prediction.label
                  }
                />

                <InfoTile
                  label="Model version"
                  value={
                    prediction.model_version
                  }
                />

                {/* confidence */}
                <div
                  style={{
                    padding:
                      "1rem",

                    borderRadius:
                      "18px",

                    background:
                      "var(--gray-50)",

                    border:
                      "1px solid var(--gray-100)",
                  }}
                >
                  <div
                    style={{
                      display:
                        "flex",

                      justifyContent:
                        "space-between",

                      marginBottom:
                        ".7rem",
                    }}
                  >
                    <p
                      style={
                        labelStyle
                      }
                    >
                      Confidence
                    </p>

                    <p
                      style={{
                        fontWeight: 700,

                        color:
                          "var(--green-800)",
                      }}
                    >
                      {(
                        prediction.confidence *
                        100
                      ).toFixed(
                        1
                      )}
                      %
                    </p>
                  </div>

                  <div
                    style={{
                      height: 10,

                      borderRadius:
                        999,

                      background:
                        "rgba(28,28,26,0.08)",

                      overflow:
                        "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${prediction.confidence * 100}%`,

                        height:
                          "100%",

                        borderRadius:
                          999,

                        background:
                          "linear-gradient(90deg, var(--green-700), var(--green-600))",
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    padding:
                      "1rem",

                    borderRadius:
                      "18px",

                    background:
                      "linear-gradient(180deg, rgba(244,250,244,0.5), var(--white))",

                    border:
                      "1px solid rgba(45,106,45,0.08)",
                  }}
                >
                  <p
                    style={{
                      fontWeight: 600,

                      marginBottom:
                        ".35rem",

                      color:
                        "var(--gray-900)",
                    }}
                  >
                    Recommendation
                  </p>

                  <p
                    style={
                      bodyTextStyle
                    }
                  >
                    {prediction.recommendation ||
                      "Monitor the affected crop area and continue preventive treatment if symptoms persist."}
                  </p>
                </div>

                <button
                  className="btn btn--ghost"
                  style={{
                    width:
                      "auto",
                  }}
                  onClick={() => {
                    setPrediction(
                      null
                    );

                    setSelectedFile(
                      null
                    );

                    setPreviewUrl(
                      ""
                    );
                  }}
                >
                  ← Run another
                  analysis
                </button>
              </div>
            </div>
          </section>
        </section>
      )}
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

        borderRadius:
          "18px",

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
            ".4rem",

          fontWeight: 600,

          color:
            "var(--gray-900)",

          fontSize: "1rem",
        }}
      >
        {value}
      </p>
    </div>
  );
}