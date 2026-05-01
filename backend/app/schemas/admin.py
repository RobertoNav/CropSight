from datetime import datetime, date
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel


class ModelVersionResponse(BaseModel):
    version: str
    stage: str
    run_id: str
    accuracy: Optional[float] = None
    f1_score: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None
    dataset_version: Optional[str] = None
    created_at: Optional[datetime] = None


class PerClassMetric(BaseModel):
    label: str
    precision: float
    recall: float
    f1: float
    support: int


class ModelMetricsResponse(BaseModel):
    model_version: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    per_class_metrics: List[PerClassMetric]


class PredictionsByDay(BaseModel):
    date: date
    count: int


class UsageMetricsResponse(BaseModel):
    total_predictions: int
    active_users: int
    active_companies: int
    feedback_rate: float
    predictions_by_day: List[PredictionsByDay]


class ClassDistribution(BaseModel):
    label: str
    proportion: float


class DriftMetricsResponse(BaseModel):
    reference_distribution: List[ClassDistribution]
    current_distribution: List[ClassDistribution]
    drift_score: float


class TriggerRetrainingRequest(BaseModel):
    notes: Optional[str] = None


class RetrainingJobResponse(BaseModel):
    id: UUID
    triggered_by: UUID
    triggered_by_name: str
    status: str
    notes: Optional[str] = None
    github_run_id: Optional[str] = None
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
