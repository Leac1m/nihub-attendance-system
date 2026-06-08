"""Tail Caddy access/error logs and emit structured network_failure records.

Caddy's default access log produces one JSON object per request to the
shared ``proxy_logs`` volume (mounted at ``/var/log/caddy`` in the proxy
container and at ``/app/logs/proxy`` in the server container).  This
module watches the log files with :mod:`watchfiles` and converts any
upstream-failure line (502/503/504 or connect/read/write/dial errors)
into a structured ``event=network_failure`` record on the
``nihub.proxy_tailer`` logger.

Wired into the FastAPI lifespan in :mod:`main` so it starts with the
server and stops on shutdown.
"""

from __future__ import annotations

import asyncio
import json
import logging
import re
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import AsyncIterator, Iterable

from watchfiles import awatch

logger = logging.getLogger("nihub.proxy_tailer")

# Caddy's default access log emits one JSON object per line, e.g.
#   {"ts":"2024-01-01T12:00:00.000Z","logger":"http.log.access",
#    "msg":"handled request","request":{"method":"GET","uri":"/x",...},
#    "status":502, ...}
# Caddy's error log emits plain text with substrings like
#   "dial tcp 10.0.0.1:8000: connect: connection refused"
# We match BOTH styles.  A line is a "failure" if any of these patterns
# appear in the raw text.  Restricting the regex to the most common
# upstream-error shapes keeps false positives low.
UPSTREAM_FAILURE_PATTERNS: tuple[re.Pattern[str], ...] = (
    re.compile(r"\b(502|503|504)\b"),
    re.compile(r"upstream (?:connect|read|write) (?:error|timeout|refused)"),
    re.compile(r"dial (?:tcp|unix) (?:error|timeout|refused)"),
    re.compile(r"no route to host"),
    re.compile(r"connection reset by peer"),
)


@dataclass
class NetworkFailure:
    """A single upstream/proxy failure extracted from a Caddy log line."""

    timestamp: str
    proxy_status: int | None
    method: str | None
    path: str | None
    client_ip: str | None
    upstream: str | None
    raw: str


def _is_failure(line: str) -> bool:
    return any(p.search(line) for p in UPSTREAM_FAILURE_PATTERNS)


def _parse_caddy_json(line: str) -> dict | None:
    line = line.strip()
    if not (line.startswith("{") and line.endswith("}")):
        return None
    try:
        return json.loads(line)
    except json.JSONDecodeError:
        return None


def parse_line(line: str) -> NetworkFailure | None:
    """Return a :class:`NetworkFailure` if ``line`` looks like a proxy/upstream failure.

    Returns ``None`` for healthy 2xx/3xx/4xx lines.  Tries JSON first (the
    Caddy access log is JSON), then falls back to a regex-only summary for
    plain-text error-log lines.
    """
    if not _is_failure(line):
        return None
    obj = _parse_caddy_json(line) or {}
    req = obj.get("request", {}) or {}
    resp_headers = obj.get("resp_headers", {}) or {}
    server_header = resp_headers.get("Server")
    if isinstance(server_header, list):
        upstream = server_header[0] if server_header else None
    else:
        upstream = server_header
    return NetworkFailure(
        timestamp=obj.get("ts") or (datetime.utcnow().isoformat() + "Z"),
        proxy_status=obj.get("status"),
        method=req.get("method"),
        path=req.get("uri"),
        client_ip=req.get("remote_ip") or req.get("client_ip"),
        upstream=req.get("host") or upstream,
        raw=line[:500],
    )


async def tail_files(paths: Iterable[Path]) -> AsyncIterator[NetworkFailure]:
    """Async generator yielding :class:`NetworkFailure` events as log lines are appended.

    Each path that exists at call time is opened and seeked to EOF.  New
    bytes are read on every filesystem change notification from
    :func:`watchfiles.awatch`.  Files that do not exist yet are watched
    but yield nothing until Caddy creates them on first request.
    """
    handles: dict[Path, object] = {}
    positions: dict[Path, int] = {}
    for p in paths:
        if p.exists():
            h = open(p, "r", encoding="utf-8", errors="replace")
            h.seek(0, 2)  # start at end
            handles[p] = h
            positions[p] = h.tell()

    watch_paths = [p for p in paths if p.exists()]
    if not watch_paths:
        paths = list(paths)
        paths[0].parent.mkdir(parents=True, exist_ok=True)
        await asyncio.sleep(2)
        watch_paths = [p for p in paths if p.exists()]

    if not watch_paths:
        logger.error("no proxy log files found, proxy tailer disabled")
        return

    try:
        async for changes in awatch(*watch_paths):
            for _change_type, path_str in changes:
                p = Path(path_str)
                h = handles.get(p)
                if h is None:
                    if p.exists():
                        h = open(p, "r", encoding="utf-8", errors="replace")
                        h.seek(0, 2)
                        handles[p] = h
                        positions[p] = h.tell()
                    continue
                h.seek(positions[p])
                new_data = h.read()
                positions[p] = h.tell()
                for line in new_data.splitlines():
                    failure = parse_line(line)
                    if failure is not None:
                        yield failure
    finally:
        for h in handles.values():
            try:
                h.close()
            except Exception:  # noqa: BLE001 - best-effort cleanup
                pass


class ProxyLogTailer:
    """Background service that tails proxy logs and emits structured records.

    Started in the FastAPI ``lifespan`` hook.  The tailer runs an
    :class:`asyncio.Task` that consumes :func:`tail_files` and emits a
    ``logger.warning(..., extra={...})`` line for every detected
    upstream failure.  Failures inside the tailer itself are caught and
    logged so the server process never crashes because of log parsing.
    """

    def __init__(self, log_dir: str | Path = "/app/logs/proxy") -> None:
        self.log_dir = Path(log_dir)
        self._task: asyncio.Task | None = None
        self._stop = asyncio.Event()

    async def start(self) -> None:
        self.log_dir.mkdir(parents=True, exist_ok=True)
        paths = [self.log_dir / "access.log", self.log_dir / "error.log"]
        self._task = asyncio.create_task(self._run(paths))
        logger.info(
            "proxy_log_tailer started",
            extra={"event": "proxy_tailer.start", "log_dir": str(self.log_dir)},
        )

    async def stop(self) -> None:
        self._stop.set()
        if self._task is not None:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            except Exception:  # noqa: BLE001 - shutdown must be quiet
                logger.exception("proxy_tailer stop error")
        logger.info("proxy_log_tailer stopped", extra={"event": "proxy_tailer.stop"})

    async def _run(self, paths: list[Path]) -> None:
        try:
            async for failure in tail_files(paths):
                logger.warning(
                    "network_failure",
                    extra={
                        "event": "network_failure",
                        "proxy_status": failure.proxy_status,
                        "method": failure.method,
                        "path": failure.path,
                        "client_ip": failure.client_ip,
                        "upstream": failure.upstream,
                        "raw": failure.raw,
                    },
                )
        except asyncio.CancelledError:
            raise
        except Exception as exc:  # noqa: BLE001 - never let the tailer kill the app
            logger.exception(
                "proxy_tailer crashed",
                extra={"event": "proxy_tailer.crash", "error": str(exc)},
            )
