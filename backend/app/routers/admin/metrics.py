import json
import math
from io import StringIO
from datetime import date, datetime, time, timedelta, timezone
from time import monotonic
from typing import Any, Optional

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import Date, cast, distinct, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundException
from app.database import get_db
from app.dependencies import require_super_admin
from app.models.company import Company
from app.models.prediction import Prediction, PredictionFeedback
from app.models.user import User
from app.schemas.admin import (
    ClassDistribution,
    DriftMetricsResponse,
    ModelMetricsResponse,
    PerClassMetric,
    PredictionsByDay,
    UsageMetricsResponse,
)
from app.services.mlflow_service import MLflowService

router = APIRouter(prefix="/admin/metrics", tags=["Admin - metrics"])

METRICS_CACHE_TTL_SECONDS = 60
_metrics_cache: dict[tuple, tuple[float, Any]] = {}


@router.get("/usage", response_model=UsageMetricsResponse)
async def get_usage_metrics(
    from_date: Optional[date] = Query(None, alias="from"),
    to_date: Optional[date] = Query(None, alias="to"),
    current_user: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    cache_key = (
        "usage",
        from_date.isoformat() if from_date else None,
        to_date.isoformat() if to_date else None,
    )
    cached = _get_cached(cache_key)
    if cached is not None:
        return cached

    query_filter = _prediction_date_filter(from_date, to_date)

    total_predictions = await _scalar_int(
        db,
        select(func.count(Prediction.id)).where(*query_filter),
    )
    active_users = await _scalar_int(
        db,
        select(func.count(distinct(Prediction.user_id))).where(*query_filter),
    )
    active_companies = await _scalar_int(
        db,
        select(func.count(Company.id)).where(Company.status == "active"),
    )
    feedback_count = await _scalar_int(
        db,
        select(func.count(PredictionFeedback.id))
        .join(Prediction, Prediction.id == PredictionFeedback.prediction_id)
        .where(*query_filter),
    )

    daily_result = await db.execute(
        select(
            cast(Prediction.created_at, Date).label("prediction_date"),
            func.count(Prediction.id).label("count"),
        )
        .where(*query_filter)
        .group_by(cast(Prediction.created_at, Date))
        .order_by(cast(Prediction.created_at, Date).asc())
    )
    predictions_by_day = [
        PredictionsByDay(date=_as_date(row.prediction_date), count=row.count)
        for row in daily_result.all()
    ]

    feedback_rate = feedback_count / total_predictions if total_predictions else 0.0

    response = UsageMetricsResponse(
        total_predictions=total_predictions,
        active_users=active_users,
        active_companies=active_companies,
        feedback_rate=round(feedback_rate, 4),
        predictions_by_day=predictions_by_day,
    )
    _set_cached(cache_key, response)
    return response


@router.get("/usage/export")
async def export_usage_metrics_csv(
    from_date: Optional[date] = Query(None, alias="from"),
    to_date: Optional[date] = Query(None, alias="to"),
    current_user: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    metrics = await get_usage_metrics(
        from_date=from_date,
        to_date=to_date,
        current_user=current_user,
        db=db,
    )
    csv_content = _usage_metrics_to_csv(metrics)
    filename = _usage_export_filename(from_date, to_date)

    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
        },
    )


@router.get("/export")
async def export_metrics_csv(
    from_date: Optional[date] = Query(None, alias="from"),
    to_date: Optional[date] = Query(None, alias="to"),
    current_user: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    return await export_usage_metrics_csv(
        from_date=from_date,
        to_date=to_date,
        current_user=current_user,
        db=db,
    )


@router.get("/model", response_model=ModelMetricsResponse)
async def get_model_metrics(
    model_version: Optional[str] = Query(None),
    current_user: User = Depends(require_super_admin),
):
    cache_key = ("model", model_version or "production")
    cached = _get_cached(cache_key)
    if cached is not None:
        return cached

    service = MLflowService()
    version = model_version or service._get_production_version()
    if version is None:
        raise NotFoundException("No hay un modelo en Production.")

    model = service.get_version_detail(version)
    run = service.client.get_run(model["run_id"])

    response = ModelMetricsResponse(
        model_version=model["version"],
        accuracy=_required_metric(model, "accuracy"),
        precision=_required_metric(model, "precision"),
        recall=_required_metric(model, "recall"),
        f1_score=_required_metric(model, "f1_score"),
        per_class_metrics=_extract_per_class_metrics(run.data.metrics),
    )
    _set_cached(cache_key, response)
    return response


@router.get("/drift", response_model=DriftMetricsResponse)
async def get_drift_metrics(
    current_user: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    cache_key = ("drift",)
    cached = _get_cached(cache_key)
    if cached is not None:
        return cached

    service = MLflowService()
    version = service._get_production_version()
    if version is None:
        raise NotFoundException("No hay un modelo en Production.")

    model = service.get_version_detail(version)
    run = service.client.get_run(model["run_id"])
    reference_distribution = _extract_reference_distribution(run.data.params)
    current_distribution = await _get_current_distribution(db)

    response = DriftMetricsResponse(
        reference_distribution=reference_distribution,
        current_distribution=current_distribution,
        drift_score=round(_psi(reference_distribution, current_distribution), 4),
    )
    _set_cached(cache_key, response)
    return response


def _get_cached(key: tuple):
    cached = _metrics_cache.get(key)
    if cached is None:
        return None

    expires_at, value = cached
    if expires_at <= monotonic():
        _metrics_cache.pop(key, None)
        return None

    return value


def _set_cached(key: tuple, value) -> None:
    _metrics_cache[key] = (monotonic() + METRICS_CACHE_TTL_SECONDS, value)


def _usage_metrics_to_csv(metrics: UsageMetricsResponse) -> str:
    output = StringIO()
    output.write("metric,value\n")
    output.write(f"total_predictions,{metrics.total_predictions}\n")
    output.write(f"active_users,{metrics.active_users}\n")
    output.write(f"active_companies,{metrics.active_companies}\n")
    output.write(f"feedback_rate,{metrics.feedback_rate}\n")
    output.write("\n")
    output.write("date,predictions\n")
    for item in metrics.predictions_by_day:
        output.write(f"{item.date.isoformat()},{item.count}\n")
    return output.getvalue()


def _usage_export_filename(
    from_date: Optional[date],
    to_date: Optional[date],
) -> str:
    from_part = from_date.isoformat() if from_date else "all"
    to_part = to_date.isoformat() if to_date else "all"
    return f"cropsight_usage_metrics_{from_part}_{to_part}.csv"


def _prediction_date_filter(
    from_date: Optional[date],
    to_date: Optional[date],
) -> list:
    filters = []
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


def _required_metric(model: dict, key: str) -> float:
    value = model.get(key)
    if value is None:
        raise NotFoundException(f"La metrica '{key}' no esta disponible para este modelo.")
    return float(value)


def _extract_per_class_metrics(metrics: dict) -> list[PerClassMetric]:
    labels = sorted(
        {
            key.rsplit("_", 1)[0]
            for key in metrics
            if key.endswith("_precision")
        }
    )

    per_class_metrics = []
    for label in labels:
        precision = metrics.get(f"{label}_precision")
        recall = metrics.get(f"{label}_recall")
        f1 = metrics.get(f"{label}_f1")
        support = metrics.get(f"{label}_support")
        if None in (precision, recall, f1, support):
            continue
        per_class_metrics.append(
            PerClassMetric(
                label=label,
                precision=float(precision),
                recall=float(recall),
                f1=float(f1),
                support=int(support),
            )
        )
    return per_class_metrics


def _extract_reference_distribution(params: dict) -> list[ClassDistribution]:
    raw_distribution = (
        params.get("reference_distribution")
        or params.get("class_distribution")
        or params.get("training_distribution")
    )
    if not raw_distribution:
        return []

    distribution = json.loads(raw_distribution)
    if isinstance(distribution, dict):
        return [
            ClassDistribution(label=label, proportion=float(proportion))
            for label, proportion in distribution.items()
        ]

    return [
        ClassDistribution(
            label=item["label"],
            proportion=float(item["proportion"]),
        )
        for item in distribution
    ]


async def _get_current_distribution(db: AsyncSession) -> list[ClassDistribution]:
    result = await db.execute(
        select(Prediction.label, func.count(Prediction.id))
        .group_by(Prediction.label)
        .order_by(Prediction.label.asc())
    )
    counts = [(label, int(count)) for label, count in result.all()]
    total = sum(count for _, count in counts)
    if total == 0:
        return []

    return [
        ClassDistribution(label=label, proportion=count / total)
        for label, count in counts
    ]


def _psi(
    reference_distribution: list[ClassDistribution],
    current_distribution: list[ClassDistribution],
) -> float:
    reference = {item.label: item.proportion for item in reference_distribution}
    current = {item.label: item.proportion for item in current_distribution}
    labels = set(reference) | set(current)
    if not labels:
        return 0.0

    epsilon = 0.0001
    score = 0.0
    for label in labels:
        expected = max(reference.get(label, 0.0), epsilon)
        actual = max(current.get(label, 0.0), epsilon)
        score += (actual - expected) * math.log(actual / expected)
    return score
