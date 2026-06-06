"""NIHUB Attendance System — FastAPI entry point.

This module is intentionally small.  All HTTP handlers live under
:mod:`routers`, all business logic under :mod:`services`, and all
pydantic models under :mod:`models`.

Wiring responsibilities kept here:
- ``load_dotenv`` before any service singleton is constructed
- structured logging configuration
- CORS / static file middleware
- request-id propagation and per-request structured logging
- lifespan (startup/shutdown) hooks
"""

from __future__ import annotations

import logging
import time
from contextlib import asynccontextmanager
from pathlib import Path
from uuid import uuid4

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

# Load .env from the server directory during local development so the
# environment variables defined in .env are available via os.getenv().
# This MUST happen before the service singletons below are constructed,
# because they read JWT_SECRET and SMTP_* at import time.
load_dotenv(dotenv_path=Path(__file__).parent / ".env")

from db import UPLOAD_DIR  # noqa: E402  (after load_dotenv intentionally)

from logging_config import configure_logging, request_id_ctx  # noqa: E402
from routers import (  # noqa: E402, F401
    _legacy_courses_shim,
    admin,
    attendance,
    auth,
    departments,
    internal,
    registrants,
)

logger = logging.getLogger("nihub.main")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    configure_logging()
    Path(__file__).parent.joinpath("logs").mkdir(parents=True, exist_ok=True)
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    logger.info("server.startup", extra={"app": "nihub-attendance"})
    try:
        yield
    finally:
        logger.info("server.shutdown")


app = FastAPI(lifespan=lifespan, title="NIHUB Attendance API")

# Add CORS middleware to allow requests from mobile app
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8081",  # Web
        "http://localhost:8100",  # Web (alt)
        "http://127.0.0.1:8081",
        "http://10.0.2.2:8081",   # Android emulator (points to host)
        "http://10.1.1.240:8081", # Expo LAN host IP + dev server port
        "http://10.1.1.240:8000", # Expo LAN host IP + API port
        "*",  # For development; restrict in production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files as static files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.middleware("http")
async def request_context_middleware(request: Request, call_next):
    """Attach a per-request id, log request start/end, and surface 500s.

    The ``X-Request-ID`` request header is honoured if the caller supplies
    one.  Otherwise a UUID4 is generated.  The id is attached to every
    log record produced while the request is in flight and is echoed back
    in the response's ``X-Request-ID`` header.
    """

    rid = request.headers.get("X-Request-ID") or str(uuid4())
    ctx_token = request_id_ctx.set(rid)
    start = time.perf_counter()
    client_ip = request.client.host if request.client else None
    logger.info(
        "request.start",
        extra={
            "method": request.method,
            "path": request.url.path,
            "client_ip": client_ip,
        },
    )
    try:
        response = await call_next(request)
    except Exception:
        duration_ms = round((time.perf_counter() - start) * 1000, 2)
        logger.exception(
            "request.error",
            extra={
                "method": request.method,
                "path": request.url.path,
                "duration_ms": duration_ms,
            },
        )
        response = JSONResponse(
            {"detail": "Internal server error", "request_id": rid},
            status_code=500,
            headers={"X-Request-ID": rid},
        )
    else:
        duration_ms = round((time.perf_counter() - start) * 1000, 2)
        logger.info(
            "request.end",
            extra={
                "method": request.method,
                "path": request.url.path,
                "status": response.status_code,
                "duration_ms": duration_ms,
            },
        )
        response.headers["X-Request-ID"] = rid
    finally:
        request_id_ctx.reset(ctx_token)
    return response


@app.get("/")
async def root() -> dict:
    return {"message": "Attendance API"}


# Routers
app.include_router(internal.router)
app.include_router(auth.router)
app.include_router(departments.router)
app.include_router(registrants.router)
app.include_router(attendance.router)
app.include_router(admin.router)
# Phase 2: legacy /courses/* → /departments/* shim.  Must come after the
# real /departments/* router so the new endpoints match first; anything
# that falls through to here is a 301 redirect to the canonical path.
app.include_router(_legacy_courses_shim.router)
