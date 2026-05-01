import torch
import torch.nn as nn
import timm


def build_model(num_classes: int, architecture: str = "efficientnet_b0", pretrained: bool = True) -> nn.Module:
    """
    Builds a fine-tunable EfficientNet-B0 (default) with a custom classifier head.

    Args:
        num_classes:  Number of disease classes for this crop.
        architecture: timm model name. Default: efficientnet_b0.
        pretrained:   Load ImageNet weights. Default: True.

    Returns:
        PyTorch model ready for training.
    """
    model = timm.create_model(architecture, pretrained=pretrained)

    # Replace classifier head
    in_features = model.classifier.in_features
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(in_features, num_classes),
    )
    return model


def load_model_from_mlflow(crop: str, num_classes: int, mlflow_model_uri: str) -> nn.Module:
    """
    Loads a registered model from MLflow Model Registry.

    Args:
        crop:            Crop name (used for logging only).
        num_classes:     Number of classes for this crop.
        mlflow_model_uri: e.g. 'models:/cropsight-tomato/Production'

    Returns:
        Loaded PyTorch model in eval mode.
    """
    import mlflow.pytorch
    model = mlflow.pytorch.load_model(mlflow_model_uri)
    model.eval()
    print(f"[{crop}] Model loaded from {mlflow_model_uri}")
    return model
