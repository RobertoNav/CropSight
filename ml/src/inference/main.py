"""
CropSight Inference Service

Endpoints:
    POST /predict  — Upload a crop image and get a diagnosis.
    GET  /health   — Health check.

Environment variables required:
    MLFLOW_TRACKING_URI
    CROPS  (comma-separated list e.g. tomato,potato,corn,grape)
"""
import ast
import os
import io
from typing import Dict

import torch
import mlflow.pytorch
from mlflow.tracking import MlflowClient
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pydantic import BaseModel

from src.preprocessing import get_inference_transforms

app = FastAPI(title="CropSight Inference API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Model registry ──────────────────────────────────────────────────────────
CROPS: list[str] = os.getenv("CROPS", "tomato,potato,corn,grape").split(",")
MODELS: Dict[str, torch.nn.Module] = {}
CLASS_NAMES: Dict[str, list] = {}


@app.on_event("startup")
def load_models():
    """Load all crop models and their class names from MLflow Model Registry."""
    tracking_uri = os.getenv("MLFLOW_TRACKING_URI", "http://localhost:5000")
    mlflow.set_tracking_uri(tracking_uri)
    client = MlflowClient(tracking_uri=tracking_uri)

    for crop in CROPS:
        model_name = f"cropsight-{crop}"
        uri = f"models:/{model_name}/Production"
        try:
            model = mlflow.pytorch.load_model(uri)
            model.eval()
            MODELS[crop] = model

            # Recover class names from the run that produced this Production version
            versions = client.get_latest_versions(model_name, stages=["Production"])
            if versions:
                run_data = client.get_run(versions[0].run_id).data
                raw = run_data.params.get("class_names", "")
                if raw:
                    CLASS_NAMES[crop] = ast.literal_eval(raw)

            print(f"[startup] Loaded model for {crop} | classes={CLASS_NAMES.get(crop, 'unknown')}")
        except Exception as e:
            print(f"[startup] WARNING: Could not load model for {crop}: {e}")


# ── Schemas ──────────────────────────────────────────────────────────────────
class PredictionResponse(BaseModel):
    crop: str
    predicted_class: str
    confidence: float
    model_version: str = "Production"


# ── Routes ───────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    loaded = [c for c in CROPS if c in MODELS]
    return {"status": "ok", "models_loaded": loaded}


@app.post("/predict", response_model=PredictionResponse)
async def predict(crop: str, file: UploadFile = File(...)):
    if crop not in CROPS:
        raise HTTPException(status_code=400, detail=f"Crop '{crop}' not supported. Choose from: {CROPS}")
    if crop not in MODELS:
        raise HTTPException(status_code=503, detail=f"Model for '{crop}' is not available.")

    # Read and preprocess image
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")
    transform = get_inference_transforms()
    tensor = transform(image).unsqueeze(0)  # (1 C H W)

    # Inference
    model = MODELS[crop]
    with torch.no_grad():
        logits = model(tensor)
        probs = torch.softmax(logits, dim=1)
        confidence, pred_idx = probs.max(dim=1)

    # Class name lookup (loaded from MLflow artifact or fallback index)
    names = CLASS_NAMES.get(crop, [])
    predicted_class = names[pred_idx.item()] if names else str(pred_idx.item())

    return PredictionResponse(
        crop=crop,
        predicted_class=predicted_class,
        confidence=round(confidence.item(), 4),
    )
