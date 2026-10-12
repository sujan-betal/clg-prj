from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Text,
    ForeignKey
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from src.config.base import Base, GUID, new_uuid


class Notice(Base):

    __tablename__ = "notices"

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

    title = Column(
        String(255),
        nullable=False
    )

    body = Column(
        Text,
        nullable=False
    )

    audience = Column(
        String(30),
        default="ALL"
    )

    department_id = Column(
        Integer,
        ForeignKey("departments.id"),
        nullable=True
    )

    is_published = Column(
        Integer,
        default=0
    )

    created_by = Column(
        String(36),
        ForeignKey("users.userid"),
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


class StudyMaterial(Base):

    __tablename__ = "study_materials"

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

    title = Column(
        String(255),
        nullable=False
    )

    subject_id = Column(
        Integer,
        ForeignKey("subjects.id"),
        nullable=False
    )

    teacher_id = Column(
        Integer,
        ForeignKey("teachers.id"),
        nullable=True
    )

    file_url = Column(
        String(500),
        nullable=True
    )

    file_type = Column(
        String(50),
        nullable=True
    )

    file_size = Column(
        Integer,
        default=0
    )

    created_at = Column(
        DateTime,
        server_default=func.now()
    )


class Assignment(Base):

    __tablename__ = "assignments"

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

    title = Column(
        String(255),
        nullable=False
    )

    description = Column(
        Text,
        nullable=True
    )

    subject_id = Column(
        Integer,
        ForeignKey("subjects.id"),
        nullable=False
    )

    teacher_id = Column(
        Integer,
        ForeignKey("teachers.id"),
        nullable=False
    )

    section = Column(
        String(10),
        nullable=True
    )

    due_date = Column(
        DateTime,
        nullable=True
    )

    created_at = Column(
        DateTime,
        server_default=func.now()
    )