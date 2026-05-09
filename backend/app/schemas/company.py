from uuid import UUID
from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field
from app.schemas.common import PaginationMeta


class CreateCompanyRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    sector: Optional[str] = Field(None, max_length=100)


class UpdateCompanyRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    logo_url: Optional[str] = None


class UpdateCompanyStatusRequest(BaseModel):
    status: str = Field(..., pattern="^(active|suspended)$")


class CompanyResponse(BaseModel):
    id: UUID
    name: str
    sector: Optional[str] = None
    logo_url: Optional[str] = None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class CompanySearchResult(BaseModel):
    id: UUID
    name: str
    sector: Optional[str] = None
    logo_url: Optional[str] = None

    model_config = {"from_attributes": True}


class PaginatedCompanyResponse(BaseModel):
    data: List[CompanyResponse]
    meta: PaginationMeta


class PredictionsByDay(BaseModel):
    date: date
    count: int


class TopLabel(BaseModel):
    label: str
    count: int


class CompanyMetricsResponse(BaseModel):
    total_predictions: int
    predictions_by_day: List[PredictionsByDay]
    feedback_rate: float
    top_labels: List[TopLabel]
