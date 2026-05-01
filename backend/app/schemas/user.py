from uuid import UUID
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, model_validator
from app.schemas.common import PaginationMeta


class UserResponse(BaseModel):
    id: UUID
    name: str
    email: str
    role: str
    company_id: Optional[UUID] = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    current_password: Optional[str] = None
    new_password: Optional[str] = Field(None, min_length=8)

    @model_validator(mode="after")
    def new_password_requires_current(self) -> "UpdateProfileRequest":
        if self.new_password and not self.current_password:
            raise ValueError("current_password es requerido para cambiar el password.")
        return self


class UpdateUserStatusRequest(BaseModel):
    is_active: bool


class PaginatedUserResponse(BaseModel):
    data: List[UserResponse]
    meta: PaginationMeta
