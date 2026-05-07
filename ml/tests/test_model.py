import torch
from PIL import Image
import numpy as np


def test_inference_transform_output_shape():
    from cropsight.CropSight.merged_ml.src.preprocessing.transforms import get_inference_transforms
    transform = get_inference_transforms()
    dummy_image = Image.fromarray(np.uint8(np.random.rand(256, 256, 3) * 255))
    tensor = transform(dummy_image)
    assert tensor.shape == (3, 224, 224), f"Unexpected shape: {tensor.shape}"


def test_build_model_output_shape():
    from cropsight.CropSight.merged_ml.src.training.model import build_model
    model = build_model(num_classes=5)
    model.eval()
    dummy_input = torch.randn(2, 3, 224, 224)
    with torch.no_grad():
        output = model(dummy_input)
    assert output.shape == (2, 5), f"Unexpected output shape: {output.shape}"
