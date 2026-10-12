from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from src.config.base import Base, GUID, new_uuid


class Student(Base):

    __tablename__ = "students"

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
        unique=True,
        nullable=False
    )

    roll_no = Column(
        String(30),
        unique=True,
        nullable=False
    )

    department_id = Column(
        Integer,
        ForeignKey("departments.id"),
        nullable=True
    )

    course_id = Column(
        Integer,
        ForeignKey("courses.id"),
        nullable=True
    )

    semester = Column(
        Integer,
        default=1
    )

    section = Column(
        String(10),
        nullable=True
    )

    guardian_phone = Column(
        String(20),
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

    user = relationship("User", back_populates="student")
    department = relationship("Department")
    course = relationship("Course")