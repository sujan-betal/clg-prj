import uuid

from sqlalchemy import String
from sqlalchemy.orm import declarative_base
from sqlalchemy.types import TypeDecorator

Base = declarative_base()


def new_uuid() -> str:
    """A fresh random identifier for a primary or foreign key.

    Every id the API hands out is a UUIDv4 rather than an auto-increment
    integer. With sequential ids a caller can walk 1, 2, 3... and read every
    record in the system; UUIDs cannot be guessed or enumerated, so knowing one
    id tells you nothing about any other.

    This is defence in depth, not access control. An unguessable id does not
    stop someone who is already allowed to call an endpoint from passing
    another user's id to it - every handler still has to check ownership.
    """
    return str(uuid.uuid4())


class GUID(TypeDecorator):
    """A UUID stored in a String(36) column.

    Id columns hold text rather than a native uuid type so that a value can be
    compared, stored and JSON-encoded exactly like the string the API already
    receives. Accepts a `uuid.UUID` or any string form of one.
    """

    impl = String(36)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if not isinstance(value, uuid.UUID):
            value = uuid.UUID(str(value))
        return str(value)

    def process_result_value(self, value, dialect):
        return None if value is None else str(value)