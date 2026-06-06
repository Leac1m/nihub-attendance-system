"""Registrant authentication: Argon2id passwords, JWT access tokens, and
single-use email verification tokens.

Phase 2 introduces registrant accounts on top of the existing
``registrants`` table.  The public registration form
(``POST /departments/{code}/register``) still creates the
``registrants`` row with no password and no email-verified timestamp.
The flow for an attendee to start using the portal is:

1. ``POST /auth/registrants/register`` — looks up the row by
   ``(department_code, matriculation_number)``, hashes the supplied
   password with Argon2id, and sends a 24-hour email verification
   link.  Returns 200 if the row exists, 404 otherwise.
2. The user clicks the link (``/auth/registrants/verify?token=…``) —
   the token is consumed from ``refresh_tokens`` (we reuse the
   table for short-lived one-shot tokens to avoid introducing a
   new table), ``email_verified_at`` is set, and a fresh
   access + refresh token pair is returned.
3. ``POST /auth/registrants/login`` — verifies the password,
   refuses to log in unverified accounts, and returns a fresh
   access + refresh pair.

The Argon2id hash uses the ``argon2-cffi`` defaults (currently
Argon2id, time_cost=3, memory_cost=64 MiB, parallelism=4) which are
the OWASP recommended starting point.  Parameters can be tuned via
``ARGON2_TIME_COST`` / ``ARGON2_MEMORY_COST`` env vars.
"""

from __future__ import annotations

import hashlib
import logging
import os
import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, InvalidHashError

from db import get_connection

logger = logging.getLogger("nihub.registrant_auth")


# ── Errors ────────────────────────────────────────────────────────────────────


class RegistrantAuthError(Exception):
    pass


class RegistrantNotFoundError(RegistrantAuthError):
    pass


class InvalidCredentialsError(RegistrantAuthError):
    pass


class EmailNotVerifiedError(RegistrantAuthError):
    pass


class AlreadyRegisteredError(RegistrantAuthError):
    pass


# ── Argon2id password hasher ─────────────────────────────────────────────────


def _build_hasher() -> PasswordHasher:
    """Build an Argon2id hasher from env-tunable params.

    Defaults match the OWASP 2024 recommendation for Argon2id:
    ``time_cost=3``, ``memory_cost=64 MiB``, ``parallelism=4``.
    """
    return PasswordHasher(
        time_cost=int(os.getenv("ARGON2_TIME_COST", "3")),
        memory_cost=int(os.getenv("ARGON2_MEMORY_COST", str(64 * 1024))),
        parallelism=int(os.getenv("ARGON2_PARALLELISM", "4")),
    )


_HASHER = _build_hasher()


# ── Service ───────────────────────────────────────────────────────────────────


@dataclass
class RegistrantAuthService:
    secret_key: str
    algorithm: str = "HS256"
    access_token_minutes: int = 60

    # ── lookups ───────────────────────────────────────────────────────────────

    def find_by_credentials(
        self, department_code: str, matriculation_number: str,
    ) -> dict[str, Any] | None:
        """Return the row matching the (department, matric) pair, or None."""
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id, department_code, name, email, phone,
                           matriculation_number, image_url,
                           password_hash, email_verified_at
                    FROM registrants
                    WHERE department_code = %s AND matriculation_number = %s
                    """,
                    (department_code, matriculation_number),
                )
                row = cur.fetchone()
                return dict(row) if row else None

    # ── password ──────────────────────────────────────────────────────────────

    def set_password(self, registrant_id: str, password: str) -> None:
        """Hash the password with Argon2id and persist the result."""
        hashed = _HASHER.hash(password)
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE registrants SET password_hash = %s WHERE id = %s",
                    (hashed, registrant_id),
                )
                conn.commit()

    def verify_password(self, registrant_id: str, password: str) -> bool:
        """Return True if the password matches the stored Argon2id hash.

        Returns False for any verification failure (mismatch, missing
        hash, malformed hash).  We deliberately swallow the underlying
        exceptions — they're the same "credentials don't match" outcome
        from the caller's point of view.
        """
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT password_hash FROM registrants WHERE id = %s",
                    (registrant_id,),
                )
                row = cur.fetchone()
        if not row or not row.get("password_hash"):
            return False
        try:
            return _HASHER.verify(row["password_hash"], password)
        except (VerifyMismatchError, InvalidHashError):
            return False

    # ── access tokens ────────────────────────────────────────────────────────

    def create_access_token(
        self,
        registrant_id: str,
        *,
        department_code: str,
        matriculation_number: str,
    ) -> str:
        """Issue a JWT access token for the registrant.

        The ``sub`` is the matriculation number (stable, human-readable,
        and matches the ``refresh_tokens.subject_id`` convention).
        ``type`` is set to ``registrant`` so the auth dependency can
        branch on it if needed.
        """
        now = datetime.now(tz=timezone.utc)
        exp = now + timedelta(minutes=self.access_token_minutes)
        payload = {
            "sub": matriculation_number,
            "type": "registrant",
            "rid": registrant_id,
            "dept": department_code,
            "exp": exp,
        }
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)

    # ── email verification (reuses refresh_tokens table) ─────────────────────

    def create_verification_token(self, registrant_id: str) -> tuple[str, datetime]:
        """Create a 24h single-use verification token.

        We store it in ``refresh_tokens`` with
        ``subject_id = "verify_email:<id>"`` so we can find it again
        without introducing a new table.  Returns ``(raw_token, expires_at)``.
        """
        raw = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(raw.encode()).hexdigest()
        expires_at = datetime.now(tz=timezone.utc) + timedelta(hours=24)
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO refresh_tokens
                        (token_hash, subject_type, subject_id, expires_at)
                    VALUES (%s, 'registrant', %s, %s)
                    """,
                    (token_hash, f"verify_email:{registrant_id}", expires_at),
                )
                conn.commit()
        return raw, expires_at

    def consume_verification_token(self, token: str) -> str | None:
        """Look up the token and, if valid, return the registrant id.

        Marks the token revoked on success.  Returns ``None`` if the
        token is unknown, revoked, or expired.
        """
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT subject_id, expires_at, revoked_at
                    FROM refresh_tokens
                    WHERE token_hash = %s
                    """,
                    (token_hash,),
                )
                row = cur.fetchone()
                if not row:
                    return None
                if row.get("revoked_at") is not None:
                    return None
                if row["expires_at"] <= datetime.now(tz=timezone.utc):
                    return None
                subject_id = row["subject_id"]
                if not subject_id.startswith("verify_email:"):
                    return None
                registrant_id = subject_id[len("verify_email:"):]
                cur.execute(
                    """
                    UPDATE refresh_tokens
                    SET revoked_at = now()
                    WHERE token_hash = %s
                    """,
                    (token_hash,),
                )
                conn.commit()
                return registrant_id

    def mark_email_verified(self, registrant_id: str) -> None:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE registrants SET email_verified_at = now() WHERE id = %s",
                    (registrant_id,),
                )
                conn.commit()

    # ── high-level flows ──────────────────────────────────────────────────────

    def begin_registration(
        self,
        *,
        email: str,
        matriculation_number: str,
        department_code: str,
        password: str,
    ) -> tuple[dict[str, Any], str, datetime]:
        """Hash the password and issue a verification token.

        Raises:
            RegistrantNotFoundError: no row exists for
                ``(department_code, matriculation_number)``.
            AlreadyRegisteredError: the row already has a password
                (the user should log in instead).
            EmailNotVerifiedError: the row already has a verified
                email — the user should log in instead.
        """
        row = self.find_by_credentials(department_code, matriculation_number)
        if row is None:
            raise RegistrantNotFoundError(
                f"No registrant with matriculation number "
                f"{matriculation_number!r} in department {department_code!r}",
            )
        if row.get("password_hash"):
            raise AlreadyRegisteredError(
                "Registrant already has a password set; use the login endpoint.",
            )
        if row.get("email_verified_at") is not None:
            raise EmailNotVerifiedError(  # reused: signal "account is done, just log in"
                "Registrant is already verified; use the login endpoint.",
            )

        self.set_password(row["id"], password)
        raw, expires_at = self.create_verification_token(row["id"])

        # Side-effect: keep the email column in sync if it changed.
        if email and email != row.get("email"):
            with get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        "UPDATE registrants SET email = %s WHERE id = %s",
                        (email, row["id"]),
                    )
                    conn.commit()
            row["email"] = email

        return row, raw, expires_at

    def authenticate(
        self,
        *,
        department_code: str,
        matriculation_number: str,
        password: str,
    ) -> dict[str, Any]:
        """Verify credentials and return the registrant row.

        Raises:
            RegistrantNotFoundError: no such registrant.
            InvalidCredentialsError: wrong password.
            EmailNotVerifiedError: password is right but email is
                unverified.
        """
        row = self.find_by_credentials(department_code, matriculation_number)
        if row is None:
            raise RegistrantNotFoundError("Invalid matriculation number or department")
        if not row.get("password_hash"):
            raise InvalidCredentialsError("Password not set; complete registration first")
        if not self.verify_password(row["id"], password):
            raise InvalidCredentialsError("Invalid matriculation number or password")
        if row.get("email_verified_at") is None:
            raise EmailNotVerifiedError(
                "Email not verified yet; check your inbox for the verification link.",
            )
        return row


def _build_default_auth_service() -> RegistrantAuthService:
    """Construct a :class:`RegistrantAuthService` from env."""
    return RegistrantAuthService(
        secret_key=os.getenv("JWT_SECRET", "dev-secret-change-me"),
    )


# Singleton — re-importing this module is safe (the same env-derived
# secret is reused).
auth_service: RegistrantAuthService = _build_default_auth_service()
