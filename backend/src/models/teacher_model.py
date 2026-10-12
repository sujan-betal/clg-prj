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


class Teacher(Base):

    __tablename__ = "teachers"

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

    employee_id = Column(
        String(30),
        unique=True,
        nullable=False
    )

    department_id = Column(
        Integer,
        ForeignKey("departments.id"),
        nullable=True
    )

    designation = Column(
        String(60),
        nullable=True
    )

    is_department_head = Column(
        Integer,
        default=0
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

    user = relationship("User", back_populates="teacher")
    department = relationship("Department")
    assignments = relationship("TeacherSubject", back_populates="teacher", cascade="all, delete-orphan")


class TeacherSubject(Base):

    __tablename__ = "teacher_subjects"

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

    teacher_id = Column(
        Integer,
        ForeignKey("teachers.id"),
        nullable=False
    )

    subject_id = Column(
        Integer,
        ForeignKey("subjects.id"),
        nullable=False
    )

    course_id = Column(
        Integer,
        ForeignKey("courses.id"),
        nullable=False
    )

    section = Column(
        String(10),
        nullable=False
    )

    academic_year = Column(
        String(10),
        nullable=True
    )

    can_post_college_notices = Column(
        Integer,
        default=0
    )

    teacher = relationship("Teacher", back_populates="assignments")
    subject = relationship("Subject")