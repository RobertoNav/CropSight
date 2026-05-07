from uuid import UUID

from fastapi import APIRouter, Depends, UploadFile, File, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_user
from app.models.prediction import Prediction, PredictionFeedback
from app.models.user import User

from app.schemas.prediction import (
    PredictionResponse,
    PredictionListResponse,
    FeedbackRequest,
    FeedbackResponse,
)

from app.services.s3_service import S3Service
from app.services.inference_service import InferenceService
from app.utils.pagination import paginate

from app.core.exceptions import (
    NotFoundException,
    ForbiddenException,
    BadRequestException,
    ConflictException,
)

router = APIRouter(prefix="/predictions", tags=["predictions"])

s3_service = S3Service()
inference_service = InferenceService()


# ─────────────────────────────────────────────
# Crear predicción (UPLOAD + INFERENCE)
# Responsable: Jaime Galindo
# ─────────────────────────────────────────────
@router.post(
    "",
    response_model=PredictionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_prediction(
    image: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    image_url = await s3_service.upload_image(image, str(current_user.id))
    result = await inference_service.predict(image_url)

    prediction = Prediction(
        user_id=current_user.id,
        company_id=current_user.company_id,
        image_url=image_url,
        label=result["label"],
        confidence=result["confidence"],
        class_probabilities=result["class_probabilities"],
        model_version=result["model_version"],
    )

    db.add(prediction)
    await db.flush()
    await db.refresh(prediction)

    return prediction


# ─────────────────────────────────────────────
# Listar predicciones del usuario autenticado
# Responsable: Jaime Galindo
# ─────────────────────────────────────────────
@router.get("", response_model=PredictionListResponse)
async def list_predictions(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        select(Prediction)
        .options(selectinload(Prediction.feedback))
        .where(Prediction.user_id == current_user.id)
        .order_by(desc(Prediction.created_at))
    )

    return await paginate(db, query, page, limit)


# ─────────────────────────────────────────────
# Obtener detalle de predicción
# Responsable: Jaime Galindo
# ─────────────────────────────────────────────
@router.get("/{prediction_id}", response_model=PredictionResponse)
async def get_prediction(
    prediction_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Prediction)
        .options(selectinload(Prediction.feedback))
        .where(Prediction.id == prediction_id)
    )
    prediction = result.scalar_one_or_none()

    if prediction is None:
        raise NotFoundException("Predicción no encontrada.")

    if prediction.user_id != current_user.id:
        raise ForbiddenException("No puedes ver una predicción de otro usuario.")

    return prediction


# ─────────────────────────────────────────────
# Crear feedback para una predicción
# Responsable: Jose Angel Leon
# ─────────────────────────────────────────────
@router.post(
    "/{prediction_id}/feedback",
    response_model=FeedbackResponse,
    status_code=status.HTTP_201_CREATED,
)
async def give_feedback(
    prediction_id: UUID,
    payload: FeedbackRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Prediction)
        .options(selectinload(Prediction.feedback))
        .where(Prediction.id == prediction_id)
    )
    prediction = result.scalar_one_or_none()

    if prediction is None:
        raise NotFoundException("Predicción no encontrada.")

    if prediction.user_id != current_user.id:
        raise ForbiddenException(
            "No puedes dar feedback sobre una predicción de otro usuario."
        )

    if prediction.feedback is not None:
        raise ConflictException("Ya existe feedback para esta predicción.")

    if payload.is_correct is False and not payload.correct_label:
        raise BadRequestException(
            "correct_label es requerido cuando is_correct es false."
        )

    feedback = PredictionFeedback(
        prediction_id=prediction.id,
        is_correct=payload.is_correct,
        correct_label=payload.correct_label if payload.is_correct is False else None,
    )

    db.add(feedback)
    await db.flush()
    await db.refresh(feedback)

    return feedback