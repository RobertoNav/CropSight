"""
Training script for a single crop model.

Usage:
    python -m src.training.train \
        --crop tomato \
        --data_dir data/processed/tomato \
        --epochs 15 \
        --lr 1e-4 \
        --batch_size 32
"""
import argparse
import torch
import torch.nn as nn
import mlflow
import mlflow.pytorch
import numpy as np
from sklearn.metrics import f1_score, classification_report
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import confusion_matrix

from .model import build_model
from src.preprocessing import build_dataloaders


def train_one_epoch(model, loader, optimizer, criterion, device):
    model.train()
    total_loss = 0
    correct = 0
    total = 0
    for images, labels in loader:
        images, labels = images.to(device), labels.to(device)
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        total_loss += loss.item()
        correct += (outputs.argmax(1) == labels).sum().item()
        total += labels.size(0)
    return total_loss / len(loader), correct / total


def evaluate(model, loader, criterion, device):
    model.eval()
    total_loss = 0
    all_preds = []
    all_labels = []
    with torch.no_grad():
        for images, labels in loader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            loss = criterion(outputs, labels)
            total_loss += loss.item()
            all_preds.extend(outputs.argmax(1).cpu().numpy())
            all_labels.extend(labels.cpu().numpy())
    acc = np.mean(np.array(all_preds) == np.array(all_labels))
    f1  = f1_score(all_labels, all_preds, average="macro")
    return total_loss / len(loader), acc, f1, all_preds, all_labels


def save_confusion_matrix(labels, preds, class_names, path="confusion_matrix.png"):
    cm = confusion_matrix(labels, preds)
    plt.figure(figsize=(10, 8))
    sns.heatmap(cm, annot=True, fmt="d", xticklabels=class_names, yticklabels=class_names)
    plt.ylabel("True")
    plt.xlabel("Predicted")
    plt.tight_layout()
    plt.savefig(path)
    plt.close()
    return path


def main(args):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    train_loader, val_loader, test_loader, class_names = build_dataloaders(
        data_dir=args.data_dir,
        batch_size=args.batch_size,
    )

    model = build_model(num_classes=len(class_names)).to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=args.lr)
    criterion = nn.CrossEntropyLoss()

    mlflow.set_experiment(f"cropsight-{args.crop}")

    with mlflow.start_run(run_name=f"{args.architecture}_lr{args.lr}_ep{args.epochs}"):
        # Log params
        mlflow.log_params({
            "crop": args.crop,
            "architecture": args.architecture,
            "epochs": args.epochs,
            "lr": args.lr,
            "batch_size": args.batch_size,
            "num_classes": len(class_names),
            "class_names": str(class_names),
        })

        for epoch in range(1, args.epochs + 1):
            train_loss, train_acc = train_one_epoch(model, train_loader, optimizer, criterion, device)
            val_loss, val_acc, val_f1, _, _ = evaluate(model, val_loader, criterion, device)

            mlflow.log_metrics({
                "train_loss": train_loss,
                "train_acc":  train_acc,
                "val_loss":   val_loss,
                "val_acc":    val_acc,
                "val_f1":     val_f1,
            }, step=epoch)

            print(f"Epoch {epoch}/{args.epochs} | train_loss={train_loss:.4f} val_acc={val_acc:.4f} val_f1={val_f1:.4f}")

        # Final evaluation on test set
        _, test_acc, test_f1, test_preds, test_labels = evaluate(model, test_loader, criterion, device)
        mlflow.log_metrics({"test_acc": test_acc, "test_f1": test_f1})

        # Confusion matrix artifact
        cm_path = save_confusion_matrix(test_labels, test_preds, class_names)
        mlflow.log_artifact(cm_path)

        # Log model
        mlflow.pytorch.log_model(model, artifact_path="model")
        print(f"Run complete | test_acc={test_acc:.4f} test_f1={test_f1:.4f}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--crop",         required=True)
    parser.add_argument("--data_dir",     required=True)
    parser.add_argument("--epochs",       type=int,   default=15)
    parser.add_argument("--lr",           type=float, default=1e-4)
    parser.add_argument("--batch_size",   type=int,   default=32)
    parser.add_argument("--architecture", default="efficientnet_b0")
    main(parser.parse_args())
