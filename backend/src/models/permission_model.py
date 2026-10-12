from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Boolean,
    ForeignKey
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from src.config.base import Base, GUID, new_uuid


class UserPermission(Base):
    """
    A permission granted to one user.

    `permission` is just a name typed by an administrator - there is no
    permissions table and no fixed catalog. The word ALL means everything.
    """

    __tablename__ = "user_permissions"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    public_id = Column(
        GUID,
        unique=True,
        index=True,
        default=new_uuid,
        nullable=False
    )

    userid = Column(
        String(36),
        ForeignKey("users.userid"),
        nullable=False,
        index=True
    )

    permission = Column(
        String(100),
        nullable=False
    )

    granted_by = Column(
        String(36),
        nullable=True
    )

    created_at = Column(
        DateTime,
        server_default=func.now()
    )

    user = relationship("User", back_populates="permissions")


class Role(Base):
    """
    A dynamically managed role.

    Roles are created and edited by administrators at runtime, so they live in
    the database. `is_admin` marks a role as allowed into the admin module;
    `is_system` marks the built-in roles that cannot be deleted.
    """

    __tablename__ = "roles"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    public_id = Column(
        GUID,
        unique=True,
        index=True,
        default=new_uuid,
        nullable=False
    )

    name = Column(
        String(100),
        unique=True,
        nullable=False
    )

    description = Column(
        String(255),
        nullable=True
    )

    is_admin = Column(
        Boolean,
        default=False,
        server_default="0",
        nullable=False
    )

    is_system = Column(
        Boolean,
        default=False,
        server_default="0",
        nullable=False
    )

    created_at = Column(
        DateTime,
        server_default=func.now()
    )