"""
Training script for a single crop model (EfficientNet-B0).

Usage:
    python -m src.training.train --crop tomato --s3_bucket cropsight-bucket
    python -m src.training.train --crop potato --s3_bucket cropsight-bucket
    python -m src.training.train --crop corn   --s3_bucket cropsight-bucket
    python -m src.training.train --crop pepper --s3_bucket cropsight-bucket

Optional flags:
    --epochs      15
    --lr          1e-4
    --batch_size  32
    --unfreeze_epoch  5   (epoch from which all layers are fine-tuned)
"""
import argparse
import os

import numpy as np
import torch
import torch.nn as nn
import mlflow
import mlflow.pytorch
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import f1_score, confusion_matrix

from .model import build_model
from src.preprocessing import build_dataloaders


# ── Training helpers ──────────────────────────────────────────────────────────

def freeze_backbone(model: nn.Module):
    """Freeze all layers except the classifier head."""
    for name, param in model.named_parameters():
        param.requires_grad = "classifier" in name


def unfreeze_all(model: nn.Module):
    """Unfreeze all layers for full fine-tuning."""
    for param in model.parameters():
        param.requires_grad = True


def train_one_epoch(model, loader, optimizer, criterion, device):
    model.train()
    total_loss, correct, total = 0, 0, 0
    for images, labels in loader:
        images, labels = images.to(device), labels.to(device)
        optimizer.zero_grad()
        outputs = model(images)
        loss    = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        total_loss += loss.item()
        correct    += (outputs.argmax(1) == labels).sum().item()
        total      += labels.size(0)
    return total_loss / len(loader), correct / total


def evaluate(model, loader, criterion, device):
    model.eval()
    total_loss, all_preds, all_labels = 0, [], []
    with torch.no_grad():
        for images, labels in loader:
            images, labels = images.to(device), labels.to(device)
            outputs     = model(images)
            total_loss += criterion(outputs, labels).item()
            all_preds.extend(outputs.argmax(1).cpu().numpy())
            all_labels.extend(labels.cpu().numpy())
    acc = np.mean(np.array(all_preds) == np.array(all_labels))
    f1  = f1_score(all_labels, all_preds, average="macro")
    return total_loss / len(loader), acc, f1, all_preds, all_labels


def save_confusion_matrix(labels, preds, class_names, path="confusion_matrix.png"):
    cm = confusion_matrix(labels, preds)
    plt.figure(figsize=(max(8, len(class_names)), max(6, len(class_names) - 2)))
    sns.heatmap(cm, annot=True, fmt="d", xticklabels=class_names, yticklabels=class_names)
    plt.ylabel("True")
    plt.xlabel("Predicted")
    plt.tight_layout()
    plt.savefig(path)
    plt.close()
    return path


# ── Main ──────────────────────────────────────────────────────────────────────

def main(args):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[train] Device: {device} | Crop: {args.crop}")

    train_loader, val_loader, test_loader, class_names = build_dataloaders(
        crop=args.crop,
        s3_bucket=args.s3_bucket,
        batch_size=args.batch_size,
    )
    print(f"[train] Classes ({len(class_names)}): {class_names}")

    model     = build_model(num_classes=len(class_names)).to(device)
    criterion = nn.CrossEntropyLoss()

    # Phase 1: train only the head with higher lr
    freeze_backbone(model)
    optimizer = torch.optim.Adam(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=args.lr,
    )

    mlflow.set_tracking_uri(os.getenv("MLFLOW_TRACKING_URI", "http://localhost:5000"))
    mlflow.set_experiment(f"cropsight-{args.crop}")

    run_name = f"efficientnet_b0_lr{args.lr}_ep{args.epochs}"

    with mlflow.start_run(run_name=run_name):
        mlflow.log_params({
            "crop":            args.crop,
            "architecture":    "efficientnet_b0",
            "epochs":          args.epochs,
            "lr":              args.lr,
            "unfreeze_epoch":  args.unfreeze_epoch,
            "batch_size":      args.batch_size,
            "num_classes":     len(class_names),
            "class_names":     str(class_names),
        })

        for epoch in range(1, args.epochs + 1):

            # Phase 2: unfreeze all layers for full fine-tuning
            if epoch == args.unfreeze_epoch:
                print(f"[train] Epoch {epoch} — unfreezing all layers (lr=1e-5)")
                unfreeze_all(model)
                optimizer = torch.optim.Adam(model.parameters(), lr=1e-5)

            train_loss, train_acc           = train_one_epoch(model, train_loader, optimizer, criterion, device)
            val_loss, val_acc, val_f1, _, _ = evaluate(model, val_loader, criterion, device)

            mlflow.log_metrics({
                "train_loss": round(train_loss, 4),
                "train_acc":  round(train_acc,  4),
                "val_loss":   round(val_loss,   4),
                "val_acc":    round(val_acc,    4),
                "val_f1":     round(val_f1,     4),
            }, step=epoch)

            print(f"  Epoch {epoch:02d}/{args.epochs} | "
                  f"train_loss={train_loss:.4f} train_acc={train_acc:.4f} | "
                  f"val_loss={val_loss:.4f} val_acc={val_acc:.4f} val_f1={val_f1:.4f}")

        # Final evaluation on held-out test set
        _, test_acc, test_f1, test_preds, test_labels = evaluate(model, test_loader, criterion, device)
        mlflow.log_metrics({"test_acc": round(test_acc, 4), "test_f1": round(test_f1, 4)})

        cm_path = save_confusion_matrix(test_labels, test_preds, class_names)
        mlflow.log_artifact(cm_path)

        mlflow.pytorch.log_model(model, artifact_path="model")

        print(f"\n[train] Run complete | test_acc={test_acc:.4f} test_f1={test_f1:.4f}")
        print(f"[train] To register: mlflow.register_model('runs:/<run_id>/model', 'cropsight-{args.crop}')")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--crop",           required=True, choices=["tomato", "potato", "corn", "pepper"])
    parser.add_argument("--s3_bucket",      default=os.getenv("S3_BUCKET"))
    parser.add_argument("--epochs",         type=int,   default=15)
    parser.add_argument("--lr",             type=float, default=1e-4)
    parser.add_argument("--batch_size",     type=int,   default=32)
    parser.add_argument("--unfreeze_epoch", type=int,   default=5,
                        help="Epoch from which all layers are unfrozen for full fine-tuning")
    main(parser.parse_args())
