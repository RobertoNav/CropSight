from datetime import datetime, timezone
from typing import List

import httpx
from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import CropSightException
from app.database import get_db
from app.dependencies import require_super_admin
from app.models.retraining_job import RetrainingJob
from app.models.user import User
from app.schemas.admin import TriggerRetrainingRequest, RetrainingJobResponse
from app.services.github_service import GitHubService

router = APIRouter(prefix="/admin/retraining", tags=["Admin - retraining"])


@router.post(
    "/",
    response_model=RetrainingJobResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def trigger_retraining(
    payload: TriggerRetrainingRequest,
    current_user: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    service = GitHubService()
    now = datetime.now(timezone.utc)

    job = RetrainingJob(
        triggered_by=current_user.id,
        status="pending",
        notes=payload.notes,
        started_at=now,
    )
    db.add(job)
    await db.flush()

    try:
        github_run_id = await service.trigger_workflow(payload.notes)
    except httpx.HTTPError as exc:
        job.status = "failed"
        job.finished_at = datetime.now(timezone.utc)
        await db.commit()
        raise CropSightException(
            code="RETRAINING_TRIGGER_FAILED",
            message="No se pudo disparar el workflow de reentrenamiento.",
            status_code=502,
            details=str(exc),
        )

    job.github_run_id = github_run_id
    job.status = "running" if github_run_id else "pending"
    await db.commit()
    await db.refresh(job)

    return _to_response(job, current_user)


@router.get("/", response_model=List[RetrainingJobResponse])
async def list_retraining_jobs(
    current_user: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(RetrainingJob)
        .options(selectinload(RetrainingJob.triggered_by_user))
        .order_by(RetrainingJob.started_at.desc().nullslast())
    )
    jobs = list(result.scalars().all())

    await _refresh_active_jobs(jobs, db)

    return [
        _to_response(job, job.triggered_by_user)
        for job in jobs
    ]


async def _refresh_active_jobs(
    jobs: list[RetrainingJob],
    db: AsyncSession,
) -> None:
    active_jobs = [
        job
        for job in jobs
        if job.github_run_id and job.status in ("pending", "running")
    ]
    if not active_jobs:
        return

    service = GitHubService()
    changed = False
    for job in active_jobs:
        try:
            new_status = await service.get_run_status(job.github_run_id)
        except httpx.HTTPError:
            continue

        if job.status != new_status:
            job.status = new_status
            changed = True

        if new_status in ("success", "failed") and job.finished_at is None:
            job.finished_at = datetime.now(timezone.utc)
            changed = True

    if changed:
        await db.commit()


def _to_response(job: RetrainingJob, user: User) -> RetrainingJobResponse:
    return RetrainingJobResponse(
        id=job.id,
        triggered_by=job.triggered_by,
        triggered_by_name=user.name,
        status=job.status,
        notes=job.notes,
        github_run_id=job.github_run_id,
        started_at=job.started_at,
        finished_at=job.finished_at,
    )
