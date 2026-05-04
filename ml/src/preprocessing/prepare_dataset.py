import os
import shutil
from pathlib import Path

RAW_DIR = Path("data/raw/PlantVillage")
PROCESSED_DIR = Path("data/processed")

CROP_KEYWORDS = {
    "tomato": ["tomato"],
    "potato": ["potato"],
    "corn": ["corn", "maize"],
    "pepper": ["pepper"],
}


def detect_crop(class_folder_name: str):
    name = class_folder_name.lower()
    for crop, keywords in CROP_KEYWORDS.items():
        if any(keyword in name for keyword in keywords):
            return crop
    return None


def main():
    if not RAW_DIR.exists():
        raise FileNotFoundError(f"No existe: {RAW_DIR}")

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

    copied = 0

    for class_folder in RAW_DIR.iterdir():
        if not class_folder.is_dir():
            continue

        crop = detect_crop(class_folder.name)
        if crop is None:
            continue

        target_class_dir = PROCESSED_DIR / crop / class_folder.name
        target_class_dir.mkdir(parents=True, exist_ok=True)

        for image_path in class_folder.iterdir():
            if image_path.suffix.lower() in [".jpg", ".jpeg", ".png"]:
                shutil.copy2(image_path, target_class_dir / image_path.name)
                copied += 1

        print(f"[OK] {class_folder.name} -> {crop}")

    print(f"\nDataset organizado. Imágenes copiadas: {copied}")


if __name__ == "__main__":
    main()
