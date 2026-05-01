from pydantic import BaseModel


class PaginationMeta(BaseModel):
    total: int
    page: int
    limit: int


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: object | None = None


class ErrorResponse(BaseModel):
    error: ErrorDetail
