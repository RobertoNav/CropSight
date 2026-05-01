from typing import Any, TypeVar
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

T = TypeVar("T")


async def paginate(
    db: AsyncSession,
    query,
    count_query,
    page: int,
    limit: int,
) -> dict:
    """
    Ejecuta la query con LIMIT/OFFSET y retorna dict con data y meta.
    """
    offset = (page - 1) * limit

    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    paginated_result = await db.execute(query.offset(offset).limit(limit))
    data = paginated_result.scalars().all()

    return {
        "data": data,
        "meta": {
            "total": total,
            "page": page,
            "limit": limit,
        },
    }
