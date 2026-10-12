from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Text,
    Numeric,
    ForeignKey
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from src.config.base import Base, GUID, new_uuid


class Department(Base):

    __tablename__ = "departments"

    # Internal surrogate key: fast integer joins, never leaves the server.
    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # The identifier the API hands out and accepts. A UUID cannot be guessed
    # or walked, so knowing one id reveals nothing about any other record.
    public_id = Column(
        GUID,
        unique=True,
        index=True,
        default=new_uuid,
        nullable=False
    )

    name = Column(
        String(150),
        unique=True,
        nullable=False
    )

    code = Column(
        String(20),
        unique=True,
        nullable=False
    )

    description = Column(
        Text,
        nullable=True
    )

    created_at = Column(
        DateTime,
        server_default=func.now()
    )

    courses = relationship("Course", back_populates="department")


class Course(Base):

    __tablename__ = "courses"

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

    department_id = Column(
        Integer,
        ForeignKey("departments.id"),
        nullable=False
    )

    name = Column(
        String(150),
        nullable=False
    )

    code = Column(
        String(20),
        unique=True,
        nullable=False
    )

    duration_years = Column(
        Integer,
        default=3
    )

    total_seats = Column(
        Integer,
        default=60
    )

    annual_fee = Column(
        Numeric(12, 2),
        default=0
    )

    created_at = Column(
        DateTime,
        server_default=func.now()
    )

    department = relationship("Department", back_populates="courses")


class Subject(Base):

    __tablename__ = "subjects"

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

    course_id = Column(
        Integer,
        ForeignKey("courses.id"),
        nullable=False
    )

    name = Column(
        String(150),
        nullable=False
    )

    code = Column(
        String(20),
        unique=True,
        nullable=False
    )

    credits = Column(
        Integer,
        default=4
    )

    semester = Column(
        Integer,
        default=1
    )

    created_at = Column(
        DateTime,
        server_default=func.now()
    )