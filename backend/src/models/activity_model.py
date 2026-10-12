from sqlalchemy import (
    Column,
    Integer,
    String,
    Date,
    DateTime,
    Numeric,
    Text,
    ForeignKey
)
from sqlalchemy.sql import func

from src.config.base import Base, GUID, new_uuid


class FeeStructure(Base):

    __tablename__ = "fee_structures"

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

    head = Column(
        String(100),
        nullable=False
    )

    amount = Column(
        Numeric(12, 2),
        default=0
    )

    due_date = Column(
        Date,
        nullable=True
    )

    created_at = Column(
        DateTime,
        server_default=func.now()
    )


class FeePayment(Base):

    __tablename__ = "fee_payments"

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

    student_id = Column(
        Integer,
        ForeignKey("students.id"),
        nullable=False
    )

    amount = Column(
        Numeric(12, 2),
        default=0
    )

    receipt_no = Column(
        String(50),
        unique=True,
        nullable=False
    )

    payment_mode = Column(
        String(30),
        default="CASH"
    )

    paid_on = Column(
        Date,
        nullable=True
    )

    created_at = Column(
        DateTime,
        server_default=func.now()
    )


class LeaveRequest(Base):

    __tablename__ = "leave_requests"

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
        nullable=False
    )

    from_date = Column(
        Date,
        nullable=False
    )

    to_date = Column(
        Date,
        nullable=False
    )

    reason = Column(
        Text,
        nullable=True
    )

    status = Column(
        String(20),
        default="PENDING"
    )

    reviewed_by = Column(
        String(36),
        nullable=True
    )

    created_at = Column(
        DateTime,
        server_default=func.now()
    )


class AdmissionApplication(Base):

    __tablename__ = "admission_applications"

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

    applicant_name = Column(
        String(150),
        nullable=False
    )

    email = Column(
        String(255),
        nullable=False
    )

    phone = Column(
        String(20),
        nullable=False
    )

    course_id = Column(
        Integer,
        ForeignKey("courses.id"),
        nullable=True
    )

    status = Column(
        String(20),
        default="PENDING"
    )

    reviewed_by = Column(
        String(36),
        nullable=True
    )

    created_at = Column(
        DateTime,
        server_default=func.now()
    )


class AuditLog(Base):

    __tablename__ = "audit_logs"

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
        nullable=True
    )

    action = Column(
        String(100),
        nullable=False
    )

    target_type = Column(
        String(50),
        nullable=True
    )

    target_id = Column(
        String(64),
        nullable=True
    )

    meta = Column(
        Text,
        nullable=True
    )

    created_at = Column(
        DateTime,
        server_default=func.now()
    )