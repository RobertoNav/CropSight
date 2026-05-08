"""
Local dev helper — adapt the ``mohitsingh1804/plantvillage`` Kaggle layout to
the per-crop ImageFolder layout that ``src.preprocessing.dataset`` expects.

The source dataset on disk looks like:

    archive/PlantVillage/
        train/<Crop>___<Disease>/*.jpg
        val/<Crop>___<Disease>/*.jpg

The preprocessing contract (``src/preprocessing/dataset.py``) expects:

    <out>/<crop>/<Class>/*.jpg

PlantVillage is captured in bursts (multiple shots of the same leaf seconds
apart). Pouring ``train/`` and ``val/`` into a single pool and re-splitting
randomly tends to leak near-duplicates from the same capture session across
splits and inflate metrics. To avoid that, this script lets you mirror only
one side of the original split:

    --source-split train   →  use only archive train/  (training pool)
    --source-split val     →  use only archive val/    (true held-out test)
    --source-split all     →  merge both (cheap, leaky — discouraged)

Symlinks are created (no copy → no disk duplication). The output directory is
self-contained per crop and ready to be fed straight into ``ImageFolder``.

Usage:
    # build training pool from the source train split
    python tools/prepare_local_data.py \
        --archive ../archive/PlantVillage \
        --out data/processed --source-split train \
        --crops tomato,potato

    # build held-out test pool from the source val split
    python tools/prepare_local_data.py \
        --archive ../archive/PlantVillage \
        --out data/heldout --source-split val \
        --crops tomato,potato
"""
from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path


CROP_PREFIX = {
    "tomato": "Tomato___",
    "potato": "Potato___",
    "corn":   "Corn_(maize)___",
    "grape":  "Grape___",
}

VALID_SPLITS = ("train", "val", "all")


def _link_or_copy(src: Path, dst: Path) -> None:
    if dst.exists() or dst.is_symlink():
        return
    try:
        dst.symlink_to(src)
    except OSError:
        # Filesystem doesn't support symlinks (e.g. some Windows shares) — fall back to copy.
        shutil.copy2(src, dst)


def _splits_to_use(source_split: str) -> list[str]:
    if source_split == "all":
        return ["train", "val"]
    if source_split in VALID_SPLITS:
        return [source_split]
    raise ValueError(f"--source-split must be one of {VALID_SPLITS}, got {source_split!r}")


def prepare_crop(archive_root: Path, out_root: Path, crop: str, source_split: str) -> tuple[int, int]:
    if crop not in CROP_PREFIX:
        raise ValueError(f"Unknown crop {crop!r}. Allowed: {sorted(CROP_PREFIX)}.")

    prefix = CROP_PREFIX[crop]
    classes_seen: set[str] = set()
    images_linked = 0

    for split in _splits_to_use(source_split):
        split_root = archive_root / split
        if not split_root.is_dir():
            print(f"[prep] skipping missing split: {split_root}", file=sys.stderr)
            continue
        for class_dir in sorted(split_root.iterdir()):
            if not class_dir.is_dir() or not class_dir.name.startswith(prefix):
                continue
            class_clean = class_dir.name[len(prefix):]   # e.g. Early_blight
            target_dir = out_root / crop / class_clean
            target_dir.mkdir(parents=True, exist_ok=True)
            classes_seen.add(class_clean)
            for img in class_dir.iterdir():
                if img.suffix.lower() not in (".jpg", ".jpeg", ".png"):
                    continue
                # Prefix split so train and val don't collide on identical filenames
                # when --source-split=all is used.
                _link_or_copy(img.resolve(), target_dir / f"{split}_{img.name}")
                images_linked += 1

    return len(classes_seen), images_linked


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--archive", required=True,
                   help="Path to PlantVillage root containing train/ and val/.")
    p.add_argument("--out", default="data/processed",
                   help="Output root. The script writes <out>/<crop>/<class>/.")
    p.add_argument("--crops", default="tomato,potato",
                   help="Comma-separated crop names.")
    p.add_argument("--source-split", default="all", choices=VALID_SPLITS,
                   help="Which side of the source dataset to mirror. "
                        "Use 'train' for the training pool, 'val' for the held-out "
                        "test pool, 'all' to merge both (leaky, dev-only).")
    args = p.parse_args()

    archive_root = Path(args.archive).resolve()
    out_root = Path(args.out).resolve()

    if not archive_root.is_dir():
        sys.exit(f"archive root does not exist: {archive_root}")

    out_root.mkdir(parents=True, exist_ok=True)
    print(f"[prep] archive={archive_root}")
    print(f"[prep] out={out_root}  source_split={args.source_split}")

    for crop in args.crops.split(","):
        crop = crop.strip().lower()
        if not crop:
            continue
        n_cls, n_img = prepare_crop(archive_root, out_root, crop, args.source_split)
        print(f"[prep] {crop}: {n_cls} classes, {n_img} images linked")

    print("[prep] done.")


if __name__ == "__main__":
    main()
