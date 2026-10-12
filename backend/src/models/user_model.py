from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Text,
    Boolean,
    text
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from src.config.base import Base, new_uuid


class User(Base):

    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # The identifier every other table points at, and the only user id the
    # API exposes. A UUID rather than the sequential `id` above, so user ids
    # cannot be walked by counting. It doubles as this table's public_id.
    userid = Column(
        String(36),
        default=new_uuid,
        server_default=text("gen_random_uuid()"),
        unique=True,
        nullable=False
    )

    username = Column(
        String(150),
        unique=True,
        nullable=False
    )

    email = Column(
        String(255),
        unique=True,
        nullable=True
    )

    password = Column(
        Text,
        nullable=False
    )

    role = Column(
        String(30),
        default="STUDENT"
    )

    status = Column(
        String(20),
        default="ACTIVE"
    )

    is_reset = Column(
        Boolean,
        default=True,
        server_default="1",
        nullable=False
    )

    is_deleted = Column(
        Boolean,
        default=False,
        server_default="0",
        nullable=False
    )

    # Random value baked into the most recent password-setup token. Clearing
    # it after use makes each emailed link strictly single-use.
    reset_nonce = Column(
        String(64),
        nullable=True
    )

    created_by = Column(
        String(36),
        nullable=True
    )

    created_at = Column(
        DateTime,
        server_default=func.now()
    )

    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now()
    )

    permissions = relationship("UserPermission", back_populates="user", cascade="all, delete-orphan")
    student = relationship("Student", back_populates="user", uselist=False)
    teacher = relationship("Teacher", back_populates="user", uselist=False)