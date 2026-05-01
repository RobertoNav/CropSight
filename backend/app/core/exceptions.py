from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError


class CropSightException(Exception):
    def __init__(
        self,
        code: str,
        message: str,
        status_code: int,
        details=None,
    ):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details
        super().__init__(message)


# ── Excepciones específicas del dominio ───────────────────────────────────────

class NotFoundException(CropSightException):
    def __init__(self, message: str = "El recurso solicitado no existe."):
        super().__init__("NOT_FOUND", message, 404)


class UnauthorizedException(CropSightException):
    def __init__(self, message: str = "No autorizado."):
        super().__init__("UNAUTHORIZED", message, 401)


class ForbiddenException(CropSightException):
    def __init__(self, message: str = "Acceso denegado."):
        super().__init__("FORBIDDEN", message, 403)


class ConflictException(CropSightException):
    def __init__(self, message: str = "El recurso ya existe."):
        super().__init__("CONFLICT", message, 409)


class FileTooLargeException(CropSightException):
    def __init__(self):
        super().__init__("FILE_TOO_LARGE", "La imagen no debe superar los 5 MB.", 413)


class UnsupportedMediaTypeException(CropSightException):
    def __init__(self):
        super().__init__(
            "UNSUPPORTED_MEDIA_TYPE",
            "Solo se aceptan imágenes JPG y PNG.",
            415,
        )


class InferenceException(CropSightException):
    def __init__(self, message: str = "Error al procesar la imagen con el modelo."):
        super().__init__("INFERENCE_ERROR", message, 502)


class InvalidTokenException(CropSightException):
    def __init__(self, message: str = "Token inválido o expirado."):
        super().__init__("INVALID_TOKEN", message, 400)


# ── Handlers registrados en main.py ──────────────────────────────────────────

async def cropsight_exception_handler(
    request: Request, exc: CropSightException
) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
            }
        },
    )


async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Los datos enviados son inválidos.",
                "details": exc.errors(),
            }
        },
    )


async def generic_exception_handler(
    request: Request, exc: Exception
) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "Error interno del servidor.",
                "details": None,
            }
        },
    )
