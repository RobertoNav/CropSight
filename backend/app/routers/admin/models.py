from fastapi import APIRouter, Depends, status

from app.dependencies import require_super_admin
from app.models.user import User
from app.services.mlflow_service import MLflowService
from app.core.exceptions import NotFoundException, BadRequestException

router = APIRouter(prefix="/admin/models", tags=["Admin - models"])

mlflow_service = MLflowService()


@router.get("")
async def list_models(
    current_user: User = Depends(require_super_admin),
):
    try:
        return mlflow_service.list_versions()
    except Exception as exc:
        raise BadRequestException(f"No se pudieron consultar los modelos en MLflow: {str(exc)}")


@router.get("/{version}")
async def get_model_version(
    version: str,
    current_user: User = Depends(require_super_admin),
):
    try:
        return mlflow_service.get_version_detail(version)
    except Exception:
        raise NotFoundException("Versión de modelo no encontrada en MLflow.")


@router.post("/{version}/promote", status_code=status.HTTP_200_OK)
async def promote_model_version(
    version: str,
    current_user: User = Depends(require_super_admin),
):
    try:
        return mlflow_service.promote_to_production(version)
    except Exception as exc:
        raise BadRequestException(f"No se pudo promover el modelo: {str(exc)}")


@router.post("/{version}/rollback", status_code=status.HTTP_200_OK)
async def rollback_model_version(
    version: str,
    current_user: User = Depends(require_super_admin),
):
    try:
        return mlflow_service.rollback(version)
    except Exception as exc:
        raise BadRequestException(f"No se pudo hacer rollback del modelo: {str(exc)}")