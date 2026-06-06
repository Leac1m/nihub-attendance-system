"""Gunicorn configuration for the NIHUB server.

Run with::

    gunicorn -c /app/gunicorn.conf.py main:app

The config wires up JSON-friendly logging via :mod:`logging_config` so
workers inherit consistent handlers.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path


SERVER_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(SERVER_ROOT))


bind = os.getenv("GUNICORN_BIND", "0.0.0.0:8000")
workers = int(os.getenv("GUNICORN_WORKERS", "4"))
worker_class = "uvicorn.workers.UvicornWorker"
timeout = int(os.getenv("GUNICORN_TIMEOUT", "60"))
graceful_timeout = int(os.getenv("GUNICORN_GRACEFUL_TIMEOUT", "30"))
keepalive = int(os.getenv("GUNICORN_KEEPALIVE", "5"))


accesslog = "-"
errorlog = "-"
loglevel = os.getenv("LOG_LEVEL", "info").lower()

# Single-line, JSON-ish access log entry.  ``rid`` falls back to the client
# supplied ``X-Request-ID`` header if present; requests without one are
# logged with an empty field.  FastAPI's middleware logs the canonical
# request id (client-supplied or freshly generated) separately.
access_log_format = (
    '{"ts":"%(t)s",'
    '"method":"%(m)s",'
    '"path":"%(U)s",'
    '"status":%(s)s,'
    '"size":%(b)s,'
    '"duration_us":%(L)s,'
    '"client":"%(h)s",'
    '"ua":"%(a)s",'
    '"request_id":"%({x-request-id}i)s"}'
)


def on_starting(server):  # noqa: D401, ANN001
    """Ensure the log directory exists before workers are forked."""
    log_dir = SERVER_ROOT / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)


def post_fork(server, worker):  # noqa: D401, ANN001
    """Re-configure logging inside each worker so file handlers are usable."""
    from logging_config import configure_logging

    configure_logging()


def worker_int(worker):  # noqa: D401, ANN001
    """Log a warning when a worker is interrupted (e.g. by the master)."""
    import logging

    logging.getLogger("nihub.gunicorn").warning(
        "worker interrupted: pid=%s", worker.pid
    )
