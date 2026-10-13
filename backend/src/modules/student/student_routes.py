from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.database import get_db
from src.middleware.auth import authorization
from src.modules.student.student_schemas import UpdateStudentProfileSchema, LeaveApplySchema
from src.modules.student import student_services

router = APIRouter(prefix="/api/student", tags=["Student"])

student_only = authorization(allowed_roles=["STUDENT"])


@router.get("/profile")
async def profile(
    db: AsyncSession = Depends(get_db),
    user=Depends(student_only),
):
    return await student_services.get_profile(db, user)


@router.put("/profile")
async def update_profile(
    payload: UpdateStudentProfileSchema,
    db: AsyncSession = Depends(get_db),
    user=Depends(student_only),
):
    return await student_services.update_profile(db, user, payload)


@router.get("/attendance")
async def attendance(
    db: AsyncSession = Depends(get_db),
    user=Depends(student_only),
):
    return await student_services.get_attendance(db, user)


@router.get("/marks")
async def marks(
    db: AsyncSession = Depends(get_db),
    user=Depends(student_only),
):
    return await student_services.get_marks(db, user)


@router.get("/notices")
async def notices(
    db: AsyncSession = Depends(get_db),
    user=Depends(student_only),
):
    return await student_services.get_notices(db, user)


@router.get("/fees")
async def fees(db: AsyncSession = Depends(get_db), user=Depends(student_only)):
    return await student_services.get_fees(db, user)


@router.get("/materials")
async def materials(db: AsyncSession = Depends(get_db), user=Depends(student_only)):
    return await student_services.get_materials(db, user)


@router.get("/assignments")
async def assignments(db: AsyncSession = Depends(get_db), user=Depends(student_only)):
    return await student_services.get_assignments(db, user)


@router.get("/certificates")
async def certificates(db: AsyncSession = Depends(get_db), user=Depends(student_only)):
    return await student_services.get_certificates(db, user)


@router.get("/leave")
async def leave(db: AsyncSession = Depends(get_db), user=Depends(student_only)):
    return await student_services.get_leave(db, user)


@router.post("/leave")
async def leave_apply(
    payload: LeaveApplySchema,
    db: AsyncSession = Depends(get_db),
    user=Depends(student_only),
):
    return await student_services.apply_leave(db, user, payload)
