import httpx
from app.config import settings
from app.core.exceptions import InferenceException

INFERENCE_TIMEOUT = 30.0


class InferenceService:
    def __init__(self):
        self.base_url = settings.lambda_inference_url.rstrip("/")
        self.timeout = INFERENCE_TIMEOUT

    async def predict(self, image_bytes: bytes, content_type: str, crop: str) -> dict:
        """
        Manda la imagen al servicio de inferencia ML.
        Retorna: {label, confidence, class_probabilities, model_version}
        """
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/predict",
                    params={"crop": crop},
                    files={"file": ("image.jpg", image_bytes, content_type)},
                )
                response.raise_for_status()
            except httpx.TimeoutException:
                raise InferenceException("El servicio de inferencia tardó demasiado en responder.")
            except httpx.HTTPStatusError as e:
                raise InferenceException(
                    f"Error del servicio de inferencia: HTTP {e.response.status_code}"
                )
            except httpx.RequestError as e:
                raise InferenceException(f"No se pudo conectar al servicio de inferencia: {str(e)}")

        data = response.json()
        if "predicted_class" not in data:
            raise InferenceException("Respuesta inesperada del servicio de inferencia.")

        label = data["predicted_class"]
        confidence = data["confidence"]
        return {
            "label": label,
            "confidence": confidence,
            "class_probabilities": {label: confidence},
            "model_version": data.get("model_version", "unknown"),
        }
