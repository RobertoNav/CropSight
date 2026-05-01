from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class JoinRequestCreate(BaseModel):
    company_id: UUID


class ResolveJoinRequest(BaseModel):
    action: str = Field(..., pattern="^(approve|reject)$")


class JoinRequestResponse(BaseModel):
    id: UUID
    user_id: UUID
    user_name: str
    user_email: str
    company_id: UUID
    status: str
    created_at: datetime
    resolved_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
