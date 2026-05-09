from uuid import UUID

from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_user
from app.models.prediction import Prediction, PredictionFeedback
from app.models.user import User
from app.core.exceptions import ConflictException, ForbiddenException, NotFoundException
from app.schemas.common import PaginationMeta
from app.schemas.prediction import (
    FeedbackRequest,
    FeedbackResponse,
    PredictionListResponse,
    PredictionResponse,
)
from app.services.inference_service import InferenceService
from app.services.s3_service import S3Service

router = APIRouter(prefix="/predictions", tags=["predictions"])


@router.post("/", response_model=PredictionResponse, status_code=status.HTTP_201_CREATED)
async def create_prediction(
    crop: str = Query(..., description="Tipo de cultivo (tomato, potato, corn, pepper)"),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    image_url = await S3Service().upload_image(file, str(current_user.id))
    result = await InferenceService().predict(image_url)

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
    await db.commit()
    await db.refresh(prediction)
    return prediction


@router.get("/", response_model=PredictionListResponse)
async def list_predictions(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    base_q = select(Prediction).options(selectinload(Prediction.feedback))
    if current_user.role != "super_admin":
        base_q = base_q.where(Prediction.user_id == current_user.id)

    total = (
        await db.execute(select(func.count()).select_from(base_q.subquery()))
    ).scalar_one()

    predictions = (
        await db.execute(
            base_q.order_by(Prediction.created_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
        )
    ).scalars().all()

    return PredictionListResponse(
        data=list(predictions),
        meta=PaginationMeta(total=total, page=page, limit=limit),
    )


@router.post("/{id}/feedback", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
async def create_prediction_feedback(
    id: UUID,
    payload: FeedbackRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    prediction = (
        await db.execute(select(Prediction).where(Prediction.id == id))
    ).scalar_one_or_none()
    if not prediction:
        raise NotFoundException("Predicción no encontrada.")

    if current_user.role != "super_admin" and prediction.user_id != current_user.id:
        raise ForbiddenException("No puedes enviar feedback para predicciones de otro usuario.")

    existing_feedback = (
        await db.execute(
            select(PredictionFeedback).where(PredictionFeedback.prediction_id == id)
        )
    ).scalar_one_or_none()
    if existing_feedback:
        raise ConflictException("Ya existe feedback para esta predicción.")

    feedback = PredictionFeedback(
        prediction_id=id,
        is_correct=payload.is_correct,
        correct_label=payload.correct_label,
    )
    db.add(feedback)
    await db.commit()
    await db.refresh(feedback)
    return feedback
