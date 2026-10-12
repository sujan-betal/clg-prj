from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.database import get_db
from src.middleware.auth import authorization
from src.modules.teacher.teacher_schemas import UpdateTeacherProfileSchema, PostNoticeSchema
from src.modules.teacher import teacher_services

router = APIRouter(prefix="/api/teacher", tags=["Teacher"])

teacher_only = authorization(allowed_roles=["TEACHER"])


@router.get("/profile")
async def profile(
    db: AsyncSession = Depends(get_db),
    user=Depends(teacher_only),
):
    return await teacher_services.get_profile(db, user)


@router.put("/profile")
async def update_profile(
    payload: UpdateTeacherProfileSchema,
    db: AsyncSession = Depends(get_db),
    user=Depends(teacher_only),
):
    return await teacher_services.update_profile(db, user, payload)


@router.get("/subjects")
async def subjects(
    db: AsyncSession = Depends(get_db),
    user=Depends(teacher_only),
):
    return await teacher_services.get_subjects(db, user)


@router.post("/notices")
async def notices(
    payload: PostNoticeSchema,
    db: AsyncSession = Depends(get_db),
    user=Depends(teacher_only),
):
    return await teacher_services.post_notice(db, user, payload)


from typing import List, Optional
from uuid import UUID
from datetime import date as date_type, datetime as datetime_type
from pydantic import BaseModel


class AttendanceRecordSchema(BaseModel):
    student_id: UUID
    subject_id: UUID
    date: date_type
    status: str = "PRESENT"


class AttendanceMarkSchema(BaseModel):
    records: List[AttendanceRecordSchema]


class MarksAddSchema(BaseModel):
    student_id: UUID
    exam_id: UUID
    subject_id: UUID
    marks_obtained: int = 0
    marks_total: int = 100


class MaterialCreateSchema(BaseModel):
    title: str
    subject_id: UUID
    file_url: Optional[str] = None
    file_type: Optional[str] = None
    file_size: Optional[int] = 0


class AssignmentCreateSchema(BaseModel):
    title: str
    description: Optional[str] = None
    subject_id: UUID
    section: Optional[str] = None
    due_date: Optional[datetime_type] = None


class LeaveApplySchema(BaseModel):
    from_date: date_type
    to_date: date_type
    reason: Optional[str] = None


@router.get("/students")
async def students(db: AsyncSession = Depends(get_db), user=Depends(teacher_only)):
    return await teacher_services.list_students(db, user)


@router.get("/exams")
async def exams(db: AsyncSession = Depends(get_db), user=Depends(teacher_only)):
    """Exams for the courses this teacher teaches, so the marks form can
    offer real names instead of asking the teacher to type an exam id."""
    return await teacher_services.list_exams(db, user)


@router.get("/attendance")
async def attendance_list(db: AsyncSession = Depends(get_db), user=Depends(teacher_only)):
    return await teacher_services.get_attendance(db, user)


@router.post("/attendance")
async def attendance_mark(payload: AttendanceMarkSchema, db: AsyncSession = Depends(get_db), user=Depends(teacher_only)):
    return await teacher_services.mark_attendance(db, user, payload)


@router.get("/marks")
async def marks_list(db: AsyncSession = Depends(get_db), user=Depends(teacher_only)):
    return await teacher_services.get_marks(db, user)


@router.post("/marks")
async def marks_add(payload: MarksAddSchema, db: AsyncSession = Depends(get_db), user=Depends(teacher_only)):
    return await teacher_services.add_marks(db, user, payload)


@router.get("/materials")
async def materials_list(db: AsyncSession = Depends(get_db), user=Depends(teacher_only)):
    return await teacher_services.list_materials(db, user)


@router.post("/materials")
async def materials_add(payload: MaterialCreateSchema, db: AsyncSession = Depends(get_db), user=Depends(teacher_only)):
    return await teacher_services.add_material(db, user, payload)


@router.get("/assignments")
async def assignments_list(db: AsyncSession = Depends(get_db), user=Depends(teacher_only)):
    return await teacher_services.list_assignments(db, user)


@router.post("/assignments")
async def assignments_add(payload: AssignmentCreateSchema, db: AsyncSession = Depends(get_db), user=Depends(teacher_only)):
    return await teacher_services.add_assignment(db, user, payload)


@router.get("/leave")
async def leave_list(db: AsyncSession = Depends(get_db), user=Depends(teacher_only)):
    return await teacher_services.get_leave(db, user)


@router.post("/leave")
async def leave_apply(payload: LeaveApplySchema, db: AsyncSession = Depends(get_db), user=Depends(teacher_only)):
    return await teacher_services.apply_leave(db, user, payload)
