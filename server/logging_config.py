"""Central logging configuration for the NIHUB server.

Provides:
- ``configure_logging(level)`` — idempotent root-logger configuration that
  fans out to stdout and a rotating file under ``server/logs/app.log``.
- ``request_id_ctx`` — a :class:`contextvars.ContextVar` used to attach a
  per-request id to every log record made while handling that request.
- ``bind_request_id(rid)`` — convenience helper for setting the request id.

The default output format is one-JSON-object-per-line.  Set ``LOG_JSON=false``
to switch to a plain text format (useful during interactive debugging).
"""

from __future__ import annotations

import json
import logging
import os
import sys
from contextvars import ContextVar
from datetime import datetime, timezone
from logging.handlers import RotatingFileHandler
from pathlib import Path
from typing import Any

request_id_ctx: ContextVar[str | None] = ContextVar("request_id", default=None)

_RESERVED_LOGRECORD_ATTRS = frozenset(
    {
        "name",
        "msg",
        "args",
        "levelname",
        "levelno",
        "pathname",
        "filename",
        "module",
        "exc_info",
        "exc_text",
        "stack_info",
        "lineno",
        "funcName",
        "created",
        "msecs",
        "relativeCreated",
        "thread",
        "threadName",
        "processName",
        "process",
        "request_id",
        "message",
        "asctime",
        "taskName",
    }
)


class RequestIDFilter(logging.Filter):
    """Inject the current ``request_id`` ContextVar value onto each record."""

    def filter(self, record: logging.LogRecord) -> bool:  # noqa: D401
        try:
            rid = request_id_ctx.get()
        except LookupError:
            rid = None
        record.request_id = rid
        return True


class JSONFormatter(logging.Formatter):
    """Render a ``LogRecord`` as a single line of JSON."""

    def format(self, record: logging.LogRecord) -> str:  # noqa: D401
        payload: dict[str, Any] = {
            "timestamp": datetime.fromtimestamp(
                record.created, tz=timezone.utc
            ).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        rid = getattr(record, "request_id", None)
        if rid:
            payload["request_id"] = rid

        for key, value in record.__dict__.items():
            if key in _RESERVED_LOGRECORD_ATTRS or key.startswith("_"):
                continue
            payload[key] = value

        if record.exc_info:
            payload["exc_info"] = self.formatException(record.exc_info)
        if record.stack_info:
            payload["stack_info"] = self.formatStack(record.stack_info)

        return json.dumps(payload, default=str, ensure_ascii=False)


class PlainFormatter(logging.Formatter):
    """Human-friendly line-oriented formatter used when ``LOG_JSON=false``."""

    DEFAULT_FMT = "%(asctime)s %(levelname)s [%(name)s] %(message)s"

    def __init__(self) -> None:
        super().__init__(fmt=self.DEFAULT_FMT, datefmt="%Y-%m-%dT%H:%M:%S%z")


def _log_dir() -> Path:
    return Path(__file__).resolve().parent / "logs"


def _build_formatter(log_json: bool) -> logging.Formatter:
    return JSONFormatter() if log_json else PlainFormatter()


def configure_logging(level: str | None = None) -> None:
    """Configure the root logger.

    Idempotent: existing handlers on the root logger are removed and
    replaced with one stdout handler and one rotating file handler.  Uvicorn
    and gunicorn loggers are reset to propagate so their records flow
    through the same handlers.
    """

    log_level_name = (level or os.getenv("LOG_LEVEL", "INFO")).upper()
    log_level = logging.getLevelName(log_level_name)
    if not isinstance(log_level, int):
        log_level = logging.INFO

    log_json = os.getenv("LOG_JSON", "true").lower() in ("true", "1", "yes", "on")

    root = logging.getLogger()
    root.setLevel(log_level)

    for existing in list(root.handlers):
        root.removeHandler(existing)

    formatter = _build_formatter(log_json)
    rid_filter = RequestIDFilter()

    stdout_handler = logging.StreamHandler(stream=sys.stdout)
    stdout_handler.setFormatter(formatter)
    stdout_handler.addFilter(rid_filter)
    root.addHandler(stdout_handler)

    log_dir = _log_dir()
    log_dir.mkdir(parents=True, exist_ok=True)
    file_handler = RotatingFileHandler(
        log_dir / "app.log",
        maxBytes=10 * 1024 * 1024,  # 10 MB
        backupCount=5,
        encoding="utf-8",
    )
    file_handler.setFormatter(formatter)
    file_handler.addFilter(rid_filter)
    root.addHandler(file_handler)

    for noisy in ("uvicorn", "uvicorn.error", "uvicorn.access"):
        lg = logging.getLogger(noisy)
        for h in list(lg.handlers):
            lg.removeHandler(h)
        lg.propagate = True


def bind_request_id(rid: str | None) -> Any:
    """Set ``request_id_ctx`` to ``rid`` and return the token for ``reset``."""
    return request_id_ctx.set(rid)
