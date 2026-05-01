import httpx
from app.config import settings
from app.core.exceptions import InferenceException

INFERENCE_TIMEOUT = 30.0


class InferenceService:
    def __init__(self):
        self.lambda_url = settings.lambda_inference_url
        self.timeout = INFERENCE_TIMEOUT

    async def predict(self, image_url: str) -> dict:
        """
        Llama al Lambda de inferencia con la URL de la imagen.
        Retorna: {label, confidence, class_probabilities, model_version}
        """
        payload = {"image_url": image_url}
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(self.lambda_url, json=payload)
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
        required_keys = {"label", "confidence", "class_probabilities", "model_version"}
        if not required_keys.issubset(data.keys()):
            raise InferenceException("Respuesta inesperada del servicio de inferencia.")

        return data
