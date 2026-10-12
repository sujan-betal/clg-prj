"""
Translation between the id the API exposes and the id the database stores.

Rows keep a sequential integer `id` for fast internal joins, and a random
UUID `public_id` that is what the API accepts and returns. Every handler that
takes an id from a request has to call `resolve` before it can query with it.
"""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


async def resolve(db: AsyncSession, model, public_id, column: str = "public_id"):
    """Turn an API-facing UUID into the internal integer primary key.

    Returns None when the id is absent or does not match any row. Callers must
    treat None as "not found" rather than falling back to the raw value, so a
    client can never pass a row id where a UUID is expected.
    """
    if public_id is None:
        return None

    if not isinstance(public_id, str):
        public_id = str(public_id)

    try:
        UUID(public_id)
    except ValueError:
        return None

    attr = getattr(model, column)
    return (await db.execute(select(model.id).where(attr == public_id))).scalar_one_or_none()


async def resolve_many(db: AsyncSession, model, public_ids, column: str = "public_id"):
    """Resolve a batch of UUIDs, returning only the ones that exist.

    Used where a list endpoint has to map many foreign keys back to display
    names; resolving them in one query avoids a round trip per row.
    """
    values = []
    for value in public_ids or []:
        if value is None:
            continue
        if not isinstance(value, str):
            value = str(value)
        try:
            UUID(value)
        except ValueError:
            continue
        values.append(value)

    if not values:
        return set()

    attr = getattr(model, column)
    rows = (await db.execute(
        select(model.id, attr).where(attr.in_(values))
    )).all()
    return {r[1] for r in rows}