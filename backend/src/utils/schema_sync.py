"""
Keeps an existing database in step with the SQLAlchemy models.

`Base.metadata.create_all` only ever CREATEs tables that do not exist yet. It
never adds a column to a table that already exists, so a database created
before a column was introduced stays broken forever: every query that selects
the new column raises UndefinedColumnError and the API refuses to start.

That is exactly what happened here - every table was missing `public_id`.

`sync_schema` walks the model metadata and issues an idempotent
ADD COLUMN IF NOT EXISTS for anything missing, then backfills and constrains
the columns that have to be NOT NULL / UNIQUE. It runs on every startup and is
a no-op once the database matches the models.
"""

from sqlalchemy import text
from sqlalchemy.dialects import postgresql
from sqlalchemy.ext.asyncio import AsyncConnection

from src.config.base import Base

# Columns that carry a Python-side default only, so the database has nothing to
# fall back on when an ALTER TABLE adds them to a table that already has rows.
# They are added nullable first, backfilled, and only then made NOT NULL.
BACKFILLABLE = {"public_id"}


def _column_ddl(column) -> str:
    """The `name type` fragment for an ADD COLUMN, minus its constraints.

    NOT NULL and UNIQUE are held back: both would fail outright against a table
    that already holds rows. They are applied later by `_enforce`.
    """
    ddl = column.type.compile(dialect=postgresql.dialect())
    return f'"{column.name}" {ddl}'


async def _existing_columns(conn: AsyncConnection, table_name: str) -> set[str]:
    rows = await conn.execute(
        text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_schema = 'public' AND table_name = :t"
        ),
        {"t": table_name},
    )
    return {r[0] for r in rows}


async def _enforce(conn: AsyncConnection, table_name: str, column) -> None:
    """Apply NOT NULL and the unique index once the column is populated."""
    name = f'"{column.name}"'

    if column.unique and column.name not in await _unique_columns(conn, table_name):
        await conn.execute(
            text(
                f'CREATE UNIQUE INDEX IF NOT EXISTS "ix_{table_name}_{column.name}" '
                f'ON "{table_name}" ({name})'
            )
        )

    if not column.nullable and column.name not in await _not_null_columns(conn, table_name):
        await conn.execute(
            text(f'ALTER TABLE "{table_name}" ALTER COLUMN {name} SET NOT NULL')
        )


async def _not_null_columns(conn: AsyncConnection, table_name: str) -> set[str]:
    """Every column in the table that already carries a NOT NULL constraint."""
    rows = await conn.execute(
        text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_schema = 'public' AND table_name = :t AND is_nullable = 'NO'"
        ),
        {"t": table_name},
    )
    return {r[0] for r in rows}


async def _unique_columns(conn: AsyncConnection, table_name: str) -> set[str]:
    rows = await conn.execute(
        text(
            "SELECT a.attname FROM pg_index i "
            "JOIN pg_class c ON c.oid = i.indrelid "
            "JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey) "
            "WHERE c.relname = :t AND i.indisunique"
        ),
        {"t": table_name},
    )
    return {r[0] for r in rows}


async def sync_schema(conn: AsyncConnection) -> list[str]:
    """Bring the live database up to the models. Returns the changes applied."""
    applied: list[str] = []

    for table in Base.metadata.sorted_tables:
        name = table.name
        existing = await _existing_columns(conn, name)
        if not existing:
            # create_all handles brand new tables; it can add the columns itself.
            continue

        for column in table.columns:
            if column.name in existing or column.name == "id":
                continue

            await conn.execute(
                text(f'ALTER TABLE "{name}" ADD COLUMN IF NOT EXISTS {_column_ddl(column)}')
            )
            applied.append(f"{name}.{column.name}")

            if column.name in BACKFILLABLE:
                await conn.execute(
                    text(
                        f'UPDATE "{name}" SET "{column.name}" = '
                        f"gen_random_uuid()::text "
                        f'WHERE "{column.name}" IS NULL'
                    )
                )

            await _enforce(conn, name, column)

    return applied