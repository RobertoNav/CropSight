# TODO: Implementar por el equipo asignado
# Ver: /docs/CropSight_Backend_Tasks.md para detalle de cada endpoint
from fastapi import APIRouter
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.prediction import Prediction, PredictionFeedback
from app.models.user import User
from app.core.exceptions import ConflictException, ForbiddenException, NotFoundException
from app.schemas.prediction import FeedbackRequest, FeedbackResponse

router = APIRouter(prefix="/predictions", tags=["predictions"])

# Placeholder — implementar endpoints según el plan de tareas
@router.post("/{id}/feedback", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
async def create_prediction_feedback(
    id: UUID,
    payload: FeedbackRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    prediction_result = await db.execute(select(Prediction).where(Prediction.id == id))
    prediction = prediction_result.scalar_one_or_none()
    if not prediction:
        raise NotFoundException("Predicción no encontrada.")

    if current_user.role != "super_admin" and prediction.user_id != current_user.id:
        raise ForbiddenException("No puedes enviar feedback para predicciones de otro usuario.")

    feedback_result = await db.execute(
        select(PredictionFeedback).where(PredictionFeedback.prediction_id == id)
    )
    existing_feedback = feedback_result.scalar_one_or_none()
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
