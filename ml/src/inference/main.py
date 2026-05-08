"""
CropSight Inference Service

Endpoints:
    POST /predict  — Upload a crop image and get a diagnosis.
    GET  /health   — Health check (reports loaded models + their versions).

Environment variables:
    MLFLOW_TRACKING_URI    MLflow tracking server (default http://localhost:5000)
    MLFLOW_MODEL_STAGE     Registry stage to load (default "Production",
                           set to "Staging" for pre-prod environments)
    CROPS                  Comma-separated crops to load on startup
                           (default "tomato,potato,corn,pepper")

The service loads one PyTorch model per crop from the MLflow Model Registry on
startup and caches both the model and its class_names.json (logged as an
artifact at training time) so /predict can return human-readable class names.
"""
from __future__ import annotations

import io
import json
import os
from typing import Dict, List, Optional

import mlflow
import mlflow.artifacts
import mlflow.pytorch
import torch
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from mlflow.tracking import MlflowClient
from PIL import Image
from pydantic import BaseModel

from cropsight.CropSight.merged_ml.src.preprocessing import get_inference_transforms

app = FastAPI(title="CropSight Inference API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Config ──────────────────────────────────────────────────────────────────
CROPS: List[str] = [c.strip() for c in os.getenv("CROPS", "tomato,potato,corn,pepper").split(",") if c.strip()]
MODEL_STAGE: str = os.getenv("MLFLOW_MODEL_STAGE", "Production")
TRACKING_URI: str = os.getenv("MLFLOW_TRACKING_URI", "http://localhost:5000")

MODELS: Dict[str, torch.nn.Module] = {}
CLASS_NAMES: Dict[str, List[str]] = {}
MODEL_VERSIONS: Dict[str, str] = {}


def _model_name(crop: str) -> str:
    return f"cropsight-{crop}"


def _load_class_names(client: MlflowClient, run_id: str) -> Optional[List[str]]:
    """Download class_names.json from the run's artifacts. Returns None on failure."""
    try:
        local_path = mlflow.artifacts.download_artifacts(
            run_id=run_id, artifact_path="class_names.json"
        )
        with open(local_path) as f:
            data = json.load(f)
        if isinstance(data, list):
            return [str(x) for x in data]
        # Defensive: some training scripts log {"classes": [...]} instead.
        if isinstance(data, dict) and "classes" in data:
            return [str(x) for x in data["classes"]]
        return None
    except Exception as exc:
        print(f"[startup] WARN  could not fetch class_names.json for run {run_id}: {exc}")
        return None


@app.on_event("startup")
def load_models() -> None:
    """Load every configured crop model from the registry at the configured stage."""
    mlflow.set_tracking_uri(TRACKING_URI)
    client = MlflowClient()
    print(f"[startup] tracking_uri={TRACKING_URI} stage={MODEL_STAGE} crops={CROPS}")

    for crop in CROPS:
        name = _model_name(crop)
        uri = f"models:/{name}/{MODEL_STAGE}"
        try:
            versions = client.get_latest_versions(name, stages=[MODEL_STAGE])
            if not versions:
                print(f"[startup] SKIP  {name}: no version in stage {MODEL_STAGE}")
                continue

            mv = versions[0]
            model = mlflow.pytorch.load_model(uri, map_location="cpu")
            model.cpu().eval()
            MODELS[crop] = model
            MODEL_VERSIONS[crop] = mv.version

            class_names = _load_class_names(client, mv.run_id)
            if class_names:
                CLASS_NAMES[crop] = class_names

            print(f"[startup] OK    {name} v{mv.version} ({MODEL_STAGE}) — {len(class_names or [])} classes")
        except Exception as exc:
            print(f"[startup] FAIL  {name}/{MODEL_STAGE}: {exc}")


# ── Schemas ──────────────────────────────────────────────────────────────────
class PredictionResponse(BaseModel):
    crop: str
    predicted_class: str
    confidence: float
    model_stage: str
    model_version: str


class HealthResponse(BaseModel):
    status: str
    stage: str
    tracking_uri: str
    models_loaded: List[str]
    model_versions: Dict[str, str]


# ── Routes ───────────────────────────────────────────────────────────────────
@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok" if MODELS else "degraded",
        stage=MODEL_STAGE,
        tracking_uri=TRACKING_URI,
        models_loaded=sorted(MODELS.keys()),
        model_versions=MODEL_VERSIONS,
    )


@app.post("/predict", response_model=PredictionResponse)
async def predict(crop: str, file: UploadFile = File(...)) -> PredictionResponse:
    if crop not in CROPS:
        raise HTTPException(
            status_code=400,
            detail=f"Crop '{crop}' not supported. Choose from: {CROPS}",
        )
    if crop not in MODELS:
        raise HTTPException(
            status_code=503,
            detail=f"Model for '{crop}' is not available at stage {MODEL_STAGE}.",
        )

    contents = await file.read()
    try:
        image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file.")

    tensor = get_inference_transforms()(image).unsqueeze(0)  # (1, C, H, W)

    with torch.no_grad():
        logits = MODELS[crop](tensor)
        probs = torch.softmax(logits, dim=1)
        confidence, pred_idx = probs.max(dim=1)

    idx = int(pred_idx.item())
    names = CLASS_NAMES.get(crop, [])
    predicted_class = names[idx] if 0 <= idx < len(names) else str(idx)

    return PredictionResponse(
        crop=crop,
        predicted_class=predicted_class,
        confidence=round(float(confidence.item()), 4),
        model_stage=MODEL_STAGE,
        model_version=MODEL_VERSIONS.get(crop, "unknown"),
    )
