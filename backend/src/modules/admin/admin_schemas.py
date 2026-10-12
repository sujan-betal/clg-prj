from uuid import UUID

from typing import Any, Optional
from datetime import date as date_type
from pydantic import BaseModel, Field, EmailStr


class CreateUserSchema(BaseModel):
    username: str = Field(..., min_length=3, max_length=150)
    email: Optional[EmailStr] = None
    role: str = Field(default="STUDENT")
    status: str = Field(default="ACTIVE")
    designation: Optional[str] = None
    department_id: Optional[UUID] = None
    # Permission names, e.g. ["USER_VIEW"] or "USER_VIEW, FEE_VIEW".
    permissions: Optional[Any] = None


class RoleCreateSchema(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    is_admin: bool = False


class RoleUpdateSchema(BaseModel):
    description: Optional[str] = None
    is_admin: Optional[bool] = None


class SubjectCreateSchema(BaseModel):
    course_id: UUID
    name: str = Field(..., min_length=1)
    code: str = Field(..., min_length=1)
    credits: int = 4
    semester: int = 1


class TeacherSubjectCreateSchema(BaseModel):
    teacher_id: UUID
    subject_id: UUID
    section: str = Field(..., min_length=1)
    academic_year: Optional[str] = None


class NoticeCreateSchema(BaseModel):
    title: str = Field(..., min_length=1)
    body: str = Field(..., min_length=1)
    audience: str = "ALL"
    is_published: int = 1


class EventCreateSchema(BaseModel):
    title: str = Field(..., min_length=1)
    description: Optional[str] = None
    event_date: Optional[date_type] = None
    venue: Optional[str] = None


class GalleryCreateSchema(BaseModel):
    title: str = Field(..., min_length=1)
    album: Optional[str] = None
    image_url: Optional[str] = None


class GalleryUpdateSchema(BaseModel):
    title: Optional[str] = None
    album: Optional[str] = None
    image_url: Optional[str] = None


class SiteContentSchema(BaseModel):
    key: str = Field(..., min_length=1)
    value: Optional[str] = None


class CertificateCreateSchema(BaseModel):
    student_id: UUID
    title: str = Field(..., min_length=1)
    certificate_no: Optional[str] = None
    issued_on: Optional[date_type] = None


class FeePaymentCreateSchema(BaseModel):
    student_id: UUID
    amount: float
    receipt_no: str = Field(..., min_length=1)
    payment_mode: str = "CASH"


class StudentEnrollmentSchema(BaseModel):
    course_id: Optional[UUID] = None
    semester: Optional[int] = None
    section: Optional[str] = None
    department_id: Optional[UUID] = None


class SetPermissionsSchema(BaseModel):
    # Permission names as a list or a comma separated string.
    permissions: Any = None


class UpdateUserStatusSchema(BaseModel):
    status: str = Field(..., min_length=1)


class DepartmentCreateSchema(BaseModel):
    name: str = Field(..., min_length=1)
    code: str = Field(..., min_length=1)
    description: Optional[str] = None


class CourseCreateSchema(BaseModel):
    department_id: UUID
    name: str = Field(..., min_length=1)
    code: str = Field(..., min_length=1)
    duration_years: int = 3
    total_seats: int = 60
    annual_fee: float = 0


class FeeStructureCreateSchema(BaseModel):
    course_id: UUID
    head: str = Field(..., min_length=1)
    amount: float = 0
    due_date: Optional[date_type] = None


class ExamCreateSchema(BaseModel):
    name: str = Field(..., min_length=1)
    course_id: Optional[UUID] = None
    semester: Optional[int] = None
    start_date: Optional[date_type] = None
    is_published: int = 0


class StatusUpdateSchema(BaseModel):
    status: str = Field(..., min_length=1)