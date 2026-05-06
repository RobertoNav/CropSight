"""
Per-crop training script with full MLflow logging.

Consumes the dataset contract from ``src.preprocessing.dataset.build_dataloaders``
exactly as defined by ``src.preprocessing.dataset``. ``data_dir`` is a single
ImageFolder-shaped tree (the **training pool**):

    <data_dir>/
        <Class A>/img1.jpg ...
        <Class B>/img1.jpg ...

Final test metrics are reported on a separate **held-out** ImageFolder passed
via ``--heldout_dir``. PlantVillage is captured in bursts (multiple shots of
the same leaf seconds apart), so we keep the original train/val split of the
source dataset disjoint at the file level: the training pool is mirrored from
the source ``train/`` and the held-out pool is mirrored from the source
``val/``. This avoids the burst-leakage that produces inflated test metrics.

The internal split inside ``data_dir`` is used only for early-stopping
(train_loader + val_loader). The ``test_*`` metrics logged to MLflow come
from ``--heldout_dir``.

Usage:
    python -m src.training.train \
        --crop tomato \
        --data_dir   data/processed/tomato \
        --heldout_dir data/heldout/tomato \
        --epochs 8 --lr 1e-4 --batch_size 64
"""
from __future__ import annotations

import argparse
import json
import os
import random
import re
from collections import Counter
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import mlflow
import mlflow.pytorch
import numpy as np
import seaborn as sns
import torch
import torch.nn as nn
from mlflow.models.signature import infer_signature
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from torch.utils.data import DataLoader, Subset
from torchvision.datasets import ImageFolder

from src.preprocessing import build_dataloaders, get_val_transforms
from src.training.model import build_model


# ── helpers ──────────────────────────────────────────────────────────────────

_MLFLOW_METRIC_NAME_RE = re.compile(r"[^A-Za-z0-9_\-./ ]+")


def _safe_metric_suffix(name: str) -> str:
    """MLflow only accepts alphanumerics, _ - . / and space in metric names.
    PlantVillage classes like 'Esca_(Black_Measles)' contain parentheses, so
    we replace any disallowed run of characters with a single underscore."""
    return _MLFLOW_METRIC_NAME_RE.sub("_", name).strip("_") or "unknown"


def _set_seed(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)


def _train_class_counts(train_loader) -> tuple[list[int], list[str]]:
    """Pull the class names + per-class training counts out of the loader
    ``build_dataloaders`` returns. The dataset is a ``Subset`` over an
    ``ImageFolder``."""
    ds = train_loader.dataset
    underlying = ds.dataset if isinstance(ds, Subset) else ds
    class_names = list(underlying.classes)
    indices = ds.indices if isinstance(ds, Subset) else range(len(underlying))
    targets = [underlying.samples[i][1] for i in indices]
    counts = Counter(targets)
    return [counts.get(i, 0) for i in range(len(class_names))], class_names


def _build_heldout_loader(heldout_dir: str, expected_classes: list[str], batch_size: int, num_workers: int = 4):
    """Build a held-out test DataLoader using the same class ordering as the training pool."""
    ds = ImageFolder(heldout_dir, transform=get_val_transforms())
    if ds.classes != expected_classes:
        raise RuntimeError(
            f"Held-out class list does not match training pool.\n"
            f"  training pool: {expected_classes}\n"
            f"  held-out:      {ds.classes}\n"
            f"Both directories must expose the same class subdirectories."
        )
    return DataLoader(ds, batch_size=batch_size, shuffle=False,
                      num_workers=num_workers, pin_memory=True)


def _save_confusion_matrix(labels, preds, class_names, path: str) -> str:
    cm = confusion_matrix(labels, preds, labels=list(range(len(class_names))))
    plt.figure(figsize=(max(8, len(class_names) * 0.7), max(6, len(class_names) * 0.6)))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
                xticklabels=class_names, yticklabels=class_names)
    plt.ylabel("True")
    plt.xlabel("Predicted")
    plt.title("Confusion matrix (held-out test set)")
    plt.tight_layout()
    plt.savefig(path, dpi=120)
    plt.close()
    return path


def _save_data_distribution(class_counts, class_names, path: str) -> str:
    plt.figure(figsize=(max(8, len(class_names) * 0.7), 4))
    sns.barplot(x=list(class_names), y=class_counts, color="steelblue")
    plt.xticks(rotation=30, ha="right")
    plt.ylabel("Training images")
    plt.title("Class distribution (training pool)")
    plt.tight_layout()
    plt.savefig(path, dpi=120)
    plt.close()
    return path


def _train_one_epoch(model, loader, optimizer, criterion, device):
    model.train()
    total_loss, correct, total = 0.0, 0, 0
    for images, labels in loader:
        images = images.to(device, non_blocking=True)
        labels = labels.to(device, non_blocking=True)
        optimizer.zero_grad(set_to_none=True)
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        total_loss += loss.item() * labels.size(0)
        correct += (outputs.argmax(1) == labels).sum().item()
        total += labels.size(0)
    return total_loss / total, correct / total


@torch.no_grad()
def _evaluate(model, loader, criterion, device):
    model.eval()
    total_loss, total = 0.0, 0
    all_preds, all_labels = [], []
    for images, labels in loader:
        images = images.to(device, non_blocking=True)
        labels = labels.to(device, non_blocking=True)
        outputs = model(images)
        loss = criterion(outputs, labels)
        total_loss += loss.item() * labels.size(0)
        total += labels.size(0)
        all_preds.extend(outputs.argmax(1).cpu().tolist())
        all_labels.extend(labels.cpu().tolist())
    preds = np.array(all_preds)
    labels = np.array(all_labels)
    acc = (preds == labels).mean() if total else 0.0
    f1 = f1_score(labels, preds, average="macro", zero_division=0) if total else 0.0
    return total_loss / max(total, 1), acc, f1, preds, labels


# ── main ────────────────────────────────────────────────────────────────────

def main(args):
    _set_seed(args.seed)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[{args.crop}] device={device}, seed={args.seed}")

    tracking_uri = os.getenv("MLFLOW_TRACKING_URI", "http://127.0.0.1:5000")
    mlflow.set_tracking_uri(tracking_uri)
    mlflow.set_experiment(f"cropsight-{args.crop}")

    # Training pool (data_dir) gets split into train + val for early stopping.
    # We disable the internal test slice — the real test is the held-out pool.
    train_loader, val_loader, _unused_test, class_names = build_dataloaders(
        data_dir=args.data_dir,
        batch_size=args.batch_size,
        val_split=args.val_split,
        test_split=0.0,
    )
    num_classes = len(class_names)
    class_counts, _ = _train_class_counts(train_loader)

    test_loader = _build_heldout_loader(
        args.heldout_dir, class_names, args.batch_size, num_workers=args.num_workers,
    )

    model = build_model(num_classes=num_classes, architecture=args.architecture).to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=args.weight_decay)
    criterion = nn.CrossEntropyLoss()

    run_name = f"{args.architecture}_lr{args.lr:.0e}_bs{args.batch_size}_ep{args.epochs}"
    with mlflow.start_run(run_name=run_name) as run:
        run_id = run.info.run_id
        print(f"[{args.crop}] run_id={run_id} experiment={run.info.experiment_id}")

        mlflow.set_tags({
            "crop": args.crop,
            "architecture": args.architecture,
            "framework": "pytorch",
            "device": str(device),
            "test_set": "heldout-original-val",
        })
        mlflow.log_params({
            "crop": args.crop,
            "architecture": args.architecture,
            "epochs": args.epochs,
            "lr": args.lr,
            "weight_decay": args.weight_decay,
            "batch_size": args.batch_size,
            "num_classes": num_classes,
            "random_seed": args.seed,
            "train_size":   len(train_loader.dataset),
            "val_size":     len(val_loader.dataset),
            "heldout_size": len(test_loader.dataset),
            "val_split":    args.val_split,
            "image_size":   224,
            "optimizer":    "AdamW",
            "data_dir":     args.data_dir,
            "heldout_dir":  args.heldout_dir,
        })

        artifacts_dir = Path(f".artifacts/{args.crop}_{run_id}")
        artifacts_dir.mkdir(parents=True, exist_ok=True)

        with open(artifacts_dir / "class_names.json", "w") as f:
            json.dump(class_names, f, indent=2)
        mlflow.log_artifact(str(artifacts_dir / "class_names.json"))

        _save_data_distribution(
            class_counts, class_names, str(artifacts_dir / "data_distribution.png")
        )
        mlflow.log_artifact(str(artifacts_dir / "data_distribution.png"))
        for c, n in zip(class_names, class_counts):
            mlflow.log_metric(f"train_count_{_safe_metric_suffix(c)}", float(n))

        best_val_f1, best_epoch = -1.0, 0
        for epoch in range(1, args.epochs + 1):
            train_loss, train_acc = _train_one_epoch(model, train_loader, optimizer, criterion, device)
            val_loss, val_acc, val_f1, _, _ = _evaluate(model, val_loader, criterion, device)

            mlflow.log_metrics({
                "train_loss": train_loss,
                "train_acc":  train_acc,
                "val_loss":   val_loss,
                "val_acc":    val_acc,
                "val_f1":     val_f1,
            }, step=epoch)

            if val_f1 > best_val_f1:
                best_val_f1, best_epoch = val_f1, epoch

            print(
                f"[{args.crop}] epoch {epoch:02d}/{args.epochs} "
                f"train_loss={train_loss:.4f} train_acc={train_acc:.4f} "
                f"val_loss={val_loss:.4f} val_acc={val_acc:.4f} val_f1={val_f1:.4f}"
            )

        mlflow.log_metric("best_val_f1", best_val_f1)
        mlflow.log_metric("best_val_epoch", best_epoch)

        # Final evaluation on the held-out test set (original-val split)
        test_loss, test_acc, test_f1, test_preds, test_labels = _evaluate(
            model, test_loader, criterion, device
        )
        test_precision = precision_score(test_labels, test_preds, average="macro", zero_division=0)
        test_recall    = recall_score(test_labels, test_preds, average="macro", zero_division=0)
        mlflow.log_metrics({
            "test_loss":      test_loss,
            "test_acc":       test_acc,
            "test_f1":        test_f1,
            "test_precision": test_precision,
            "test_recall":    test_recall,
        })

        per_class_f1 = f1_score(test_labels, test_preds,
                                labels=list(range(num_classes)), average=None, zero_division=0)
        per_class_p  = precision_score(test_labels, test_preds,
                                       labels=list(range(num_classes)), average=None, zero_division=0)
        per_class_r  = recall_score(test_labels, test_preds,
                                    labels=list(range(num_classes)), average=None, zero_division=0)
        for cls, f1c, pc, rc in zip(class_names, per_class_f1, per_class_p, per_class_r):
            cls_safe = _safe_metric_suffix(cls)
            mlflow.log_metric(f"test_f1_{cls_safe}",        float(f1c))
            mlflow.log_metric(f"test_precision_{cls_safe}", float(pc))
            mlflow.log_metric(f"test_recall_{cls_safe}",    float(rc))

        report = classification_report(
            test_labels, test_preds,
            labels=list(range(num_classes)), target_names=class_names,
            output_dict=True, zero_division=0,
        )
        with open(artifacts_dir / "classification_report.json", "w") as f:
            json.dump(report, f, indent=2)
        mlflow.log_artifact(str(artifacts_dir / "classification_report.json"))

        cm_path = _save_confusion_matrix(
            test_labels, test_preds, class_names,
            str(artifacts_dir / "confusion_matrix.png"),
        )
        mlflow.log_artifact(cm_path)

        # Sample input from the held-out loader for the model signature
        sample_batch, _ = next(iter(test_loader))
        sample_input = sample_batch[:1].cpu().numpy()
        model.eval()
        with torch.no_grad():
            sample_output = model(sample_batch[:1].to(device)).cpu().numpy()
        signature = infer_signature(sample_input, sample_output)

        mlflow.pytorch.log_model(
            pytorch_model=model,
            artifact_path="model",
            signature=signature,
            input_example=sample_input,
        )

        print(
            f"[{args.crop}] DONE  best_val_f1={best_val_f1:.4f} "
            f"test_acc={test_acc:.4f} test_f1={test_f1:.4f} run_id={run_id}"
        )


def _parse_args():
    p = argparse.ArgumentParser()
    p.add_argument("--crop",         required=True, choices=["tomato", "potato", "corn", "grape"])
    p.add_argument("--data_dir",     required=True,
                   help="Training pool — ImageFolder-shaped per-crop directory "
                        "(e.g. data/processed/tomato/).")
    p.add_argument("--heldout_dir",  required=True,
                   help="Held-out test pool — ImageFolder-shaped per-crop directory "
                        "with the same classes (e.g. data/heldout/tomato/).")
    p.add_argument("--epochs",       type=int,   default=10)
    p.add_argument("--lr",           type=float, default=1e-4)
    p.add_argument("--weight_decay", type=float, default=1e-4)
    p.add_argument("--batch_size",   type=int,   default=32)
    p.add_argument("--val_split",    type=float, default=0.15)
    p.add_argument("--num_workers",  type=int,   default=4)
    p.add_argument("--architecture", default="efficientnet_b0")
    p.add_argument("--seed",         type=int,   default=42)
    return p.parse_args()


if __name__ == "__main__":
    main(_parse_args())
