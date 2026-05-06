import io
import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import httpx
from PIL import Image, ImageDraw, ImageFont

INFERENCE_URL = os.getenv("INFERENCE_URL", "http://localhost:8000").rstrip("/")
CROPS = os.getenv("CROPS", "tomato,potato,corn,grape").split(",")

_ML_ROOT = Path(__file__).resolve().parent.parent
OUT_PREDICTIONS = _ML_ROOT / "data" / "predictions"
OUT_FEEDBACK = _ML_ROOT / "data" / "feedback"

CROP_COLORS: dict[str, tuple[int, int, int]] = {
    "tomato": (200, 50, 50),
    "potato": (160, 120, 60),
    "corn":   (220, 190, 30),
    "grape":  (90,  40, 140),
}

def make_test_image(crop: str) -> bytes:
    color = CROP_COLORS.get(crop, (128, 128, 128))
    img = Image.new("RGB", (224, 224), color=color)
    draw = ImageDraw.Draw(img)
    font = ImageFont.load_default()
    draw.text((60, 100), crop.upper(), fill=(255, 255, 255), font=font)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def save_json(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False))

def run_crop(client: httpx.Client, crop: str) -> dict:
    print(f"\n{'─'*52}")
    print(f"  CROP: {crop.upper()}")
    print(f"{'─'*52}")
    image_bytes = make_test_image(crop)
    print(f"  [1/4] Image prepared   ({len(image_bytes):,} bytes)")
    response = client.post(
        f"{INFERENCE_URL}/predict",
        params={"crop": crop},
        files={"file": (f"{crop}_test.jpg", image_bytes, "image/jpeg")},
        timeout=30.0,
    )
    if response.status_code != 200:
        print(f"  [2/4] ERROR {response.status_code}: {response.text}")
        raise RuntimeError(f"Inference failed for '{crop}'")
    prediction = response.json()
    print(
        f"  [2/4] Inference done   "
        f"class={prediction['predicted_class']}  "
        f"conf={prediction['confidence']:.2%}  "
        f"model={prediction['model_version']}"
    )
    record_id = f"{crop}-{int(time.time())}"
    prediction_record = {
        "id": record_id,
        "created_at": now_iso(),
        "crop": crop,
        "image": f"{crop}_test.jpg",
        "predicted_class": prediction["predicted_class"],
        "confidence": prediction["confidence"],
        "model_version": prediction["model_version"],
        "feedback": None,
    }
    pred_path = OUT_PREDICTIONS / f"{crop}.json"
    save_json(pred_path, prediction_record)
    print(f"  [3/4] Prediction saved → {pred_path}")
    feedback_record = {
        "prediction_id": record_id,
        "submitted_at": now_iso(),
        "is_correct": True,       
        "correct_label": None,   
    }
    feedback_path = OUT_FEEDBACK / f"{crop}.json"
    save_json(feedback_path, feedback_record)
    prediction_record["feedback"] = feedback_record
    save_json(pred_path, prediction_record)
    print(f"  [4/4] Feedback saved   → {feedback_path}")

    return prediction_record

def main() -> None:
    OUT_PREDICTIONS.mkdir(parents=True, exist_ok=True)
    OUT_FEEDBACK.mkdir(parents=True, exist_ok=True)

    print(f"\nCropSight E2E Flow")
    print(f"Inference URL : {INFERENCE_URL}")
    print(f"Crops         : {', '.join(CROPS)}")

    with httpx.Client() as client:
        try:
            health = client.get(f"{INFERENCE_URL}/health", timeout=10.0)
            health.raise_for_status()
            info = health.json()
            loaded = info.get("models_loaded", [])
            print(f"Server health : ok  |  models loaded: {loaded or 'none'}")
            if not loaded:
                print("\n  WARNING: No models are loaded. Make sure Production models exist in the registry.")
        except Exception as exc:
            print(f"\nERROR: Could not reach inference server at {INFERENCE_URL}")
            print(f"  {exc}")
            print("  Start the inference service with:  docker compose up  OR  uvicorn src.inference.main:app")
            sys.exit(1)

        results = []
        errors = []
        for crop in CROPS:
            try:
                record = run_crop(client, crop)
                results.append(record)
            except Exception as exc:
                print(f"  ERROR for {crop}: {exc}")
                errors.append(crop)

    print(f"\n{'═'*52}")
    print("  SUMMARY")
    print(f"{'═'*52}")
    for r in results:
        status = "ok " if r["feedback"] else "err"
        print(
            f"  [{status}]  {r['crop']:8s}  "
            f"{r['predicted_class']:40s}  "
            f"conf={r['confidence']:.2%}"
        )
    for crop in errors:
        print(f"  [err]  {crop:8s}  (inference failed — model may not be in Production stage)")

    print(f"\nPredictions : {OUT_PREDICTIONS}/")
    print(f"Feedback    : {OUT_FEEDBACK}/")

    if errors:
        sys.exit(1)


if __name__ == "__main__":
    main()
