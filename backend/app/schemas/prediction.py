from uuid import UUID
from datetime import datetime
from typing import Optional, Dict, List
from pydantic import BaseModel
from app.schemas.common import PaginationMeta


class FeedbackResponse(BaseModel):
    id: UUID
    prediction_id: UUID
    is_correct: bool
    correct_label: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class PredictionResponse(BaseModel):
    id: UUID
    user_id: UUID
    company_id: Optional[UUID] = None
    image_url: str
    label: str
    confidence: float
    class_probabilities: Dict[str, float]
    model_version: str
    feedback: Optional[FeedbackResponse] = None
    created_at: datetime

    model_config = {"from_attributes": True, "protected_namespaces": ()}


class PredictionListResponse(BaseModel):
    data: List[PredictionResponse]
    meta: PaginationMeta


class FeedbackRequest(BaseModel):
    is_correct: bool
    correct_label: Optional[str] = None
