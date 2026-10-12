from fastapi import APIRouter, Depends, Query
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.database import get_db
from src.middleware.auth import authorization
from src.modules.admin import admin_services
from src.modules.admin.admin_schemas import (
    CreateUserSchema,
    UpdateUserStatusSchema,
    SetPermissionsSchema,
    RoleCreateSchema,
    RoleUpdateSchema,
SubjectCreateSchema,
    TeacherSubjectCreateSchema,
    NoticeCreateSchema,
    EventCreateSchema,
GalleryCreateSchema,
    GalleryUpdateSchema,
    SiteContentSchema,
    CertificateCreateSchema,
    FeePaymentCreateSchema,
    StudentEnrollmentSchema,
    DepartmentCreateSchema,
    CourseCreateSchema,
    FeeStructureCreateSchema,
    ExamCreateSchema,
    StatusUpdateSchema,
)
from src.utils.common_schema import api_response_success

router = APIRouter(prefix="/api/admin", tags=["Admin"])


def scoped(*permissions: str):
    """Admin-module endpoint: needs an admin-capable role + these permissions."""
    return authorization(
        required_permissions=list(permissions),
        require_admin_role=True,
    )


# Any admin-capable role, no extra permission needed.
admin_only = authorization(require_admin_role=True)


# --------------------------------------------------
# Roles (dynamic, admin managed)
# --------------------------------------------------

@router.get("/roles")
async def get_roles(db: AsyncSession = Depends(get_db), user=Depends(admin_only)):
    return await admin_services.list_roles(db)


@router.post("/roles")
async def post_role(
    payload: RoleCreateSchema,
    db: AsyncSession = Depends(get_db),
    user=Depends(admin_only),
):
    return await admin_services.create_role(db, payload, user)


@router.put("/roles/{role_id}")
async def put_role(
    role_id: UUID,
    payload: RoleUpdateSchema,
    db: AsyncSession = Depends(get_db),
    user=Depends(admin_only),
):
    return await admin_services.update_role(db, role_id, payload, user)


@router.delete("/roles/{role_id}")
async def remove_role(
    role_id: UUID,
    db: AsyncSession = Depends(get_db),
    user=Depends(admin_only),
):
    return await admin_services.delete_role(db, role_id, user)


@router.get("/permission-names")
async def get_permission_names(db: AsyncSession = Depends(get_db), user=Depends(admin_only)):
    return await admin_services.list_permission_names(db)


# --------------------------------------------------
# Academic setup
# --------------------------------------------------

@router.get("/subjects")
async def get_subjects(db: AsyncSession = Depends(get_db), user=Depends(scoped("COURSE_VIEW"))):
    return await admin_services.list_subjects(db)


@router.post("/subjects")
async def post_subject(
    payload: SubjectCreateSchema,
    db: AsyncSession = Depends(get_db),
    user=Depends(scoped("COURSE_MANAGE")),
):
    return await admin_services.create_subject(db, payload)


@router.get("/teacher-subjects")
async def get_teacher_subjects(db: AsyncSession = Depends(get_db), user=Depends(scoped("COURSE_VIEW"))):
    return await admin_services.list_teacher_subjects(db)


@router.post("/teacher-subjects")
async def post_teacher_subject(
    payload: TeacherSubjectCreateSchema,
    db: AsyncSession = Depends(get_db),
    user=Depends(scoped("COURSE_MANAGE")),
):
    return await admin_services.assign_teacher_subject(db, payload)


# --------------------------------------------------
# Notices / events / gallery / site content
# --------------------------------------------------

@router.post("/notices")
async def post_notice(
    payload: NoticeCreateSchema,
    db: AsyncSession = Depends(get_db),
    user=Depends(scoped("NOTICE_MANAGE")),
):
    return await admin_services.create_notice(db, payload, user)


@router.get("/events")
async def get_events(db: AsyncSession = Depends(get_db), user=Depends(admin_only)):
    return await admin_services.list_public_events(db)


@router.post("/events")
async def post_event(
    payload: EventCreateSchema,
    db: AsyncSession = Depends(get_db),
    user=Depends(admin_only),
):
    return await admin_services.create_event(db, payload)


@router.get("/gallery")
async def get_gallery(db: AsyncSession = Depends(get_db), user=Depends(admin_only)):
    return await admin_services.list_public_gallery(db)


@router.post("/gallery")
async def post_gallery(
    payload: GalleryCreateSchema,
    db: AsyncSession = Depends(get_db),
    user=Depends(admin_only),
):
    return await admin_services.create_gallery_item(db, payload)


@router.put("/gallery/{item_id}")
async def put_gallery(
    item_id: UUID,
    payload: GalleryUpdateSchema,
    db: AsyncSession = Depends(get_db),
    user=Depends(admin_only),
):
    return await admin_services.update_gallery_item(db, item_id, payload)


@router.delete("/gallery/{item_id}")
async def delete_gallery(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    user=Depends(admin_only),
):
    return await admin_services.delete_gallery_item(db, item_id)


@router.post("/site-content")
async def post_site_content(
    payload: SiteContentSchema,
    db: AsyncSession = Depends(get_db),
    user=Depends(admin_only),
):
    return await admin_services.set_site_content(db, payload)


# --------------------------------------------------
# Certificates, fee payments, messages
# --------------------------------------------------

@router.get("/certificates")
async def get_certificates(db: AsyncSession = Depends(get_db), user=Depends(admin_only)):
    return await admin_services.list_public_certificates(db)


@router.post("/certificates")
async def post_certificate(
    payload: CertificateCreateSchema,
    db: AsyncSession = Depends(get_db),
    user=Depends(admin_only),
):
    return await admin_services.create_certificate(db, payload)


@router.get("/fee-payments")
async def get_fee_payments(db: AsyncSession = Depends(get_db), user=Depends(scoped("FEE_VIEW"))):
    return await admin_services.list_fee_payments(db)


@router.post("/fee-payments")
async def post_fee_payment(
    payload: FeePaymentCreateSchema,
    db: AsyncSession = Depends(get_db),
    user=Depends(scoped("FEE_MANAGE")),
):
    return await admin_services.record_fee_payment(db, payload)


@router.get("/messages")
async def get_messages(db: AsyncSession = Depends(get_db), user=Depends(admin_only)):
    return await admin_services.list_messages(db)


# --------------------------------------------------
# Permissions
# --------------------------------------------------

@router.get("/users/{userid}/permissions")
async def get_permissions_of_user(
    userid: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(scoped("USER_VIEW")),
):
    return await admin_services.get_user_permissions(db, userid)


@router.put("/users/{userid}/permissions")
async def put_permissions_of_user(
    userid: str,
    payload: SetPermissionsSchema,
    db: AsyncSession = Depends(get_db),
    user=Depends(scoped("USER_UPDATE")),
):
    granted = await admin_services.set_permissions(db, userid, payload.permissions, user)

    if isinstance(granted, dict):
        return granted

    return api_response_success(data=granted, message="Permissions updated")


# --------------------------------------------------
# Users
# --------------------------------------------------

@router.get("/users")
async def get_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: str = Query(""),
    role: str = Query(None),
    db: AsyncSession = Depends(get_db),
    user=Depends(scoped("USER_VIEW")),
):
    return await admin_services.list_users(db, page, page_size, search, role)


@router.post("/users")
async def create_user(
    payload: CreateUserSchema,
    db: AsyncSession = Depends(get_db),
    user=Depends(scoped("USER_CREATE")),
):
    return await admin_services.create_user(db, payload, user)


@router.put("/users/{userid}/status")
async def update_status(
    userid: str,
    payload: UpdateUserStatusSchema,
    db: AsyncSession = Depends(get_db),
    user=Depends(scoped("USER_UPDATE")),
):
    return await admin_services.update_user_status(db, userid, payload, user)


@router.delete("/users/{userid}")
async def delete_user(
    userid: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(scoped("USER_DELETE")),
):
    return await admin_services.delete_user(db, userid, user)


@router.put("/students/{userid}")
async def put_student(
    userid: str,
    payload: StudentEnrollmentSchema,
    db: AsyncSession = Depends(get_db),
    user=Depends(scoped("USER_UPDATE")),
):
    return await admin_services.update_student_enrollment(db, userid, payload)


@router.get("/stats")
async def get_stats(
    db: AsyncSession = Depends(get_db),
    user=Depends(scoped("USER_VIEW")),
):
    return await admin_services.stats(db)


# --------------------------------------------------
# Departments
# --------------------------------------------------

@router.get("/departments")
async def get_departments(db: AsyncSession = Depends(get_db), user=Depends(scoped("COURSE_VIEW"))):
    return await admin_services.list_departments(db)


@router.post("/departments")
async def post_department(
    payload: DepartmentCreateSchema,
    db: AsyncSession = Depends(get_db),
    user=Depends(scoped("COURSE_MANAGE")),
):
    return await admin_services.create_department(db, payload.name, payload.code, payload.description)


# --------------------------------------------------
# Courses
# --------------------------------------------------

@router.get("/courses")
async def get_courses(db: AsyncSession = Depends(get_db), user=Depends(scoped("COURSE_VIEW"))):
    return await admin_services.list_courses(db)


@router.post("/courses")
async def post_course(
    payload: CourseCreateSchema,
    db: AsyncSession = Depends(get_db),
    user=Depends(scoped("COURSE_MANAGE")),
):
    return await admin_services.create_course(db, payload)


# --------------------------------------------------
# Admissions
# --------------------------------------------------

@router.get("/admissions")
async def get_admissions(db: AsyncSession = Depends(get_db), user=Depends(scoped("ADMISSION_VIEW"))):
    return await admin_services.list_admissions(db)


@router.put("/admissions/{app_id}/status")
async def admission_status(
    app_id: UUID,
    payload: StatusUpdateSchema,
    db: AsyncSession = Depends(get_db),
    user=Depends(scoped("ADMISSION_MANAGE")),
):
    return await admin_services.update_admission_status(db, app_id, payload.status)


# --------------------------------------------------
# Fees
# --------------------------------------------------

@router.get("/fees")
async def get_fees(db: AsyncSession = Depends(get_db), user=Depends(scoped("FEE_VIEW"))):
    return await admin_services.list_fee_structures(db)


@router.post("/fees")
async def post_fee(
    payload: FeeStructureCreateSchema,
    db: AsyncSession = Depends(get_db),
    user=Depends(scoped("FEE_MANAGE")),
):
    return await admin_services.create_fee_structure(db, payload)


# --------------------------------------------------
# Exams
# --------------------------------------------------

@router.get("/exams")
async def get_exams(db: AsyncSession = Depends(get_db), user=Depends(scoped("EXAM_VIEW"))):
    return await admin_services.list_exams(db)


@router.post("/exams")
async def post_exam(
    payload: ExamCreateSchema,
    db: AsyncSession = Depends(get_db),
    user=Depends(scoped("EXAM_MANAGE")),
):
    return await admin_services.create_exam(db, payload)


# --------------------------------------------------
# Notices
# --------------------------------------------------

@router.get("/notices")
async def get_notices(db: AsyncSession = Depends(get_db), user=Depends(scoped("NOTICE_VIEW"))):
    return await admin_services.list_notices(db)


# --------------------------------------------------
# Content
# --------------------------------------------------

@router.get("/content")
async def get_content(db: AsyncSession = Depends(get_db), user=Depends(scoped("CONTENT_VIEW"))):
    return await admin_services.list_content(db)


# --------------------------------------------------
# Leave
# --------------------------------------------------

@router.get("/leave")
async def get_leave(db: AsyncSession = Depends(get_db), user=Depends(scoped("LEAVE_VIEW"))):
    return await admin_services.list_leave(db)


@router.put("/leave/{leave_id}/status")
async def leave_status(
    leave_id: UUID,
    payload: StatusUpdateSchema,
    db: AsyncSession = Depends(get_db),
    user=Depends(scoped("LEAVE_APPROVE")),
):
    return await admin_services.update_leave_status(db, leave_id, payload.status, user)


# --------------------------------------------------
# Reports & Audit
# --------------------------------------------------

@router.get("/reports")
async def get_reports(db: AsyncSession = Depends(get_db), user=Depends(scoped("REPORT_VIEW"))):
    return await admin_services.reports(db)


@router.get("/audit-logs")
async def get_audit_logs(db: AsyncSession = Depends(get_db), user=Depends(scoped("AUDIT_VIEW"))):
    return await admin_services.audit_logs(db)