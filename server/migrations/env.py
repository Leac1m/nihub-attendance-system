"""Alembic environment for the NIHUB Attendance System.

We do **not** use SQLAlchemy ORM models in this project — the
application talks to Postgres via ``psycopg2`` and raw SQL.  This env
file therefore just:

- injects ``server/`` onto ``sys.path`` so revisions can ``import db``,
  ``models``, etc. if they want to;
- reads ``DATABASE_URL`` from the process environment (set by
  ``.env`` via :func:`main.load_dotenv` or by the container runtime);
- exposes an empty ``target_metadata`` because the revision files run
  raw SQL via ``op.execute(...)`` rather than ``op.create_table(...)``
  / ``op.add_column(...)``.

When you ``alembic upgrade head`` from a CI script, make sure
``DATABASE_URL`` is in the environment; otherwise set
``NIHUB_DATABASE_URL`` and the env will pick it up.
"""
from __future__ import annotations

import os
import sys
from logging.config import fileConfig
from pathlib import Path

from alembic import context

# Make ``server/`` importable so migrations can ``import db`` etc. if
# they need to.  ``alembic.ini`` already sets ``prepend_sys_path = .``,
# but we add an explicit path entry as a belt-and-suspenders measure.
_HERE = Path(__file__).resolve().parent
_SERVER_ROOT = _HERE.parent
if str(_SERVER_ROOT) not in sys.path:
    sys.path.insert(0, str(_SERVER_ROOT))


# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)


def _database_url() -> str:
    """Resolve the Postgres URL from the environment."""
    url = os.getenv("DATABASE_URL") or os.getenv("NIHUB_DATABASE_URL")
    if not url:
        raise RuntimeError(
            "DATABASE_URL is not set; alembic cannot connect to Postgres. "
            "Export it or run from a shell that has loaded server/.env.",
        )
    return url


# No SQLAlchemy metadata — see module docstring.
target_metadata = None


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL and not an Engine,
    though an Engine is acceptable here as well.  By skipping the Engine
    creation we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    context.configure(
        url=_database_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine and associate a
    connection with the context.

    """
    from sqlalchemy import engine_from_config, pool

    cfg = config.get_section(config.config_ini_section) or {}
    cfg["sqlalchemy.url"] = _database_url()

    connectable = engine_from_config(
        cfg,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
