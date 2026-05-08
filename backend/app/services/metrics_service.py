from datetime import date, datetime, time, timedelta, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy import Date, cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.prediction import Prediction, PredictionFeedback
from app.schemas.company import (
    CompanyMetricsResponse,
    PredictionsByDay,
    TopLabel,
)


class MetricsService:
    async def get_company_metrics(
        self,
        db: AsyncSession,
        company_id: UUID,
        from_date: Optional[date] = None,
        to_date: Optional[date] = None,
    ) -> CompanyMetricsResponse:
        filters = _company_prediction_filters(company_id, from_date, to_date)

        total_predictions = await _scalar_int(
            db,
            select(func.count(Prediction.id)).where(*filters),
        )
        feedback_count = await _scalar_int(
            db,
            select(func.count(PredictionFeedback.id))
            .join(Prediction, Prediction.id == PredictionFeedback.prediction_id)
            .where(*filters),
        )

        daily_result = await db.execute(
            select(
                cast(Prediction.created_at, Date).label("prediction_date"),
                func.count(Prediction.id).label("count"),
            )
            .where(*filters)
            .group_by(cast(Prediction.created_at, Date))
            .order_by(cast(Prediction.created_at, Date).asc())
        )
        predictions_by_day = [
            PredictionsByDay(date=_as_date(row.prediction_date), count=row.count)
            for row in daily_result.all()
        ]

        labels_result = await db.execute(
            select(
                Prediction.label,
                func.count(Prediction.id).label("count"),
            )
            .where(*filters)
            .group_by(Prediction.label)
            .order_by(func.count(Prediction.id).desc(), Prediction.label.asc())
            .limit(5)
        )
        top_labels = [
            TopLabel(label=row.label, count=row.count)
            for row in labels_result.all()
        ]

        feedback_rate = feedback_count / total_predictions if total_predictions else 0.0

        return CompanyMetricsResponse(
            total_predictions=total_predictions,
            predictions_by_day=predictions_by_day,
            feedback_rate=round(feedback_rate, 4),
            top_labels=top_labels,
        )


def _company_prediction_filters(
    company_id: UUID,
    from_date: Optional[date],
    to_date: Optional[date],
) -> list:
    filters = [Prediction.company_id == company_id]
    if from_date is not None:
        filters.append(
            Prediction.created_at
            >= datetime.combine(from_date, time.min, tzinfo=timezone.utc)
        )
    if to_date is not None:
        filters.append(
            Prediction.created_at
            < datetime.combine(to_date + timedelta(days=1), time.min, tzinfo=timezone.utc)
        )
    return filters


async def _scalar_int(db: AsyncSession, query) -> int:
    result = await db.execute(query)
    return int(result.scalar_one() or 0)


def _as_date(value) -> date:
    if isinstance(value, date):
        return value
    return date.fromisoformat(str(value))
