import os
import json
from pathlib import Path
import matplotlib.pyplot as plt
import mlflow

PROCESSED_DIR = Path("data/processed")
CROPS = ["tomato", "potato", "corn", "pepper"]


def analyze_crop(crop):
    crop_path = PROCESSED_DIR / crop
    class_counts = {}

    for class_dir in crop_path.iterdir():
        if class_dir.is_dir():
            count = len([f for f in class_dir.iterdir() if f.suffix.lower() in [".jpg", ".png", ".jpeg"]])
            class_counts[class_dir.name] = count

    return class_counts


def plot_distribution(crop, class_counts):
    plt.figure(figsize=(10, 6))
    plt.bar(class_counts.keys(), class_counts.values())
    plt.xticks(rotation=45, ha="right")
    plt.title(f"{crop} class distribution")
    plt.tight_layout()

    output_path = f"{crop}_distribution.png"
    plt.savefig(output_path)
    plt.close()

    return output_path


def detect_imbalance(class_counts):
    values = list(class_counts.values())
    max_v = max(values)
    min_v = min(values)

    imbalance_ratio = max_v / min_v if min_v > 0 else 0

    return {
        "max": max_v,
        "min": min_v,
        "imbalance_ratio": round(imbalance_ratio, 2)
    }


def main():
    mlflow.set_experiment("cropsight-eda")

    for crop in CROPS:
        with mlflow.start_run(run_name=f"eda-{crop}"):
            print(f"\nAnalizando {crop}...")

            class_counts = analyze_crop(crop)
            imbalance_info = detect_imbalance(class_counts)

            # Guardar JSON
            json_path = f"{crop}_counts.json"
            with open(json_path, "w") as f:
                json.dump(class_counts, f, indent=4)

            # Guardar gráfica
            plot_path = plot_distribution(crop, class_counts)

            # Log MLflow
            mlflow.log_param("crop", crop)
            mlflow.log_metric("num_classes", len(class_counts))
            mlflow.log_metric("max_samples", imbalance_info["max"])
            mlflow.log_metric("min_samples", imbalance_info["min"])
            mlflow.log_metric("imbalance_ratio", imbalance_info["imbalance_ratio"])

            mlflow.log_artifact(json_path)
            mlflow.log_artifact(plot_path)

            print(f"Clases: {len(class_counts)}")
            print(f"Desbalance ratio: {imbalance_info['imbalance_ratio']}")


if __name__ == "__main__":
    main()
