import asyncio
from contextlib import asynccontextmanager, suppress
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

import app.models  # noqa: F401 — registers all ORM classes before any relationship is resolved

from app.core.exceptions import (
    CropSightException,
    cropsight_exception_handler,
    validation_exception_handler,
    generic_exception_handler,
)
from app.core.rate_limit import limiter, rate_limit_exceeded_handler
from app.database import AsyncSessionLocal
from app.routers import auth, users, companies, join_requests, predictions
from app.routers.admin import models as admin_models, retraining, metrics as admin_metrics
from app.services.refresh_token_cleanup import (
    delete_expired_refresh_tokens,
    run_refresh_token_cleanup,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🌱 CropSight Backend iniciando...")
    try:
        async with AsyncSessionLocal() as db:
            await delete_expired_refresh_tokens(db)
    except Exception as exc:
        print(f"⚠️  Startup cleanup skipped (DB not ready?): {exc}")

    cleanup_task = asyncio.create_task(run_refresh_token_cleanup())
    try:
        yield
    finally:
        cleanup_task.cancel()
        with suppress(asyncio.CancelledError):
            await cleanup_task
        # Shutdown
        print("🛑 CropSight Backend cerrando...")


app = FastAPI(
    title="CropSight API",
    description="API REST para diagnóstico de enfermedades y plagas en cultivos mediante visión computacional.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",          # Next.js dev
        "https://cropsight.io",           # Producción
        "https://staging.cropsight.io",   # Staging
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Exception handlers ────────────────────────────────────────────────────────
app.add_exception_handler(CropSightException, cropsight_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)
app.add_exception_handler(Exception, generic_exception_handler)
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

# ── Routers ───────────────────────────────────────────────────────────────────
PREFIX = "/api/v1"

app.include_router(auth.router,         prefix=PREFIX)
app.include_router(users.router,        prefix=PREFIX)
app.include_router(companies.router,    prefix=PREFIX)
app.include_router(join_requests.router,prefix=PREFIX)
app.include_router(predictions.router,  prefix=PREFIX)
app.include_router(admin_models.router, prefix=PREFIX)
app.include_router(retraining.router,   prefix=PREFIX)
app.include_router(admin_metrics.router,prefix=PREFIX)


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/api/v1/health", tags=["System"])
async def health_check():
    return {"status": "ok", "version": "1.0.0"}
