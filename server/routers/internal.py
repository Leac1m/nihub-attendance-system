from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator

from db import get_connection

logger = logging.getLogger("nihub.internal")

router = APIRouter()

VALID_LEVELS = {"debug", "info", "warning", "error"}
PII_KEYS = {"email", "password"}


def _strip_pii(value: Any) -> Any:
    if isinstance(value, dict):
        return {k: _strip_pii(v) for k, v in value.items() if k not in PII_KEYS}
    if isinstance(value, list):
        return [_strip_pii(v) for v in value]
    return value


class ClientLogEntry(BaseModel):
    level: str
    message: str
    context: dict | None = None
    ts: str | None = None

    @field_validator("level")
    @classmethod
    def _validate_level(cls, v: str) -> str:
        v_lower = v.lower()
        if v_lower not in VALID_LEVELS:
            raise ValueError(f"level must be one of {sorted(VALID_LEVELS)}")
        return v_lower

    @field_validator("message")
    @classmethod
    def _validate_message(cls, v: str) -> str:
        if not isinstance(v, str):
            raise ValueError("message must be a string")
        if len(v) > 2048:
            raise ValueError("message must be at most 2 KB")
        return v


class ClientLogsRequest(BaseModel):
    logs: list[ClientLogEntry] = Field(..., max_length=100)


@router.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@router.get("/health/deep")
async def health_deep() -> JSONResponse:
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
                cur.fetchone()
        return JSONResponse({"status": "ok", "db": "ok"})
    except Exception as exc:
        return JSONResponse({"status": "degraded", "db": str(exc)}, status_code=503)


@router.post("/_client-logs")
async def client_logs(payload: ClientLogsRequest) -> dict:
    accepted = 0
    for entry in payload.logs:
        context = _strip_pii(entry.context or {})
        level_method = getattr(logger, entry.level, None)
        if level_method is None:
            continue
        extra: dict[str, Any] = {"source": "client", "context": context}
        if entry.ts:
            extra["client_ts"] = entry.ts
        level_method(entry.message, extra=extra)
        accepted += 1
    return {"accepted": accepted}
