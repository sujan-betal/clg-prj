from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.models.user_model import User
from src.models.student_model import Student
from src.models.academic_model import Attendance, Marks, Exam
from src.models.course_model import Department, Course, Subject
from src.models.content_model import Notice, StudyMaterial, Assignment
from src.models.activity_model import FeeStructure, FeePayment, LeaveRequest
from src.models.site_model import Certificate
from src.modules.student.student_schemas import UpdateStudentProfileSchema
from src.utils.common_schema import api_response_success, api_response_error
from src.utils.status_code import StatusCode


async def _student_or_error(db: AsyncSession, user: User):
    result = await db.execute(select(Student).where(Student.userid == user.userid))
    student = result.scalar_one_or_none()
    if not student:
        return None, api_response_error(message="Student profile not found", status_code=StatusCode.notFound)
    return student, None


async def get_profile(db: AsyncSession, user: User):
    result = await db.execute(
        select(Student, Department.name, Department.public_id, Course.name, Course.code, Course.public_id)
        .outerjoin(Department, Department.id == Student.department_id)
        .outerjoin(Course, Course.id == Student.course_id)
        .where(Student.userid == user.userid)
    )
    row = result.first()
    if not row:
        return api_response_error(message="Student profile not found", status_code=StatusCode.notFound)
    student, department_name, department_public_id, course_name, course_code, course_public_id = row

    return api_response_success(
        data={
            "id": student.public_id,
            "userid": user.userid,
            "username": user.username,
            "email": user.email,
            "roll_no": student.roll_no,
            "department_id": department_public_id,
            "department_name": department_name,
            "course_id": course_public_id,
            "course_name": course_name,
            "course_code": course_code,
            "semester": student.semester,
            "section": student.section,
            "guardian_phone": student.guardian_phone,
        },
        message="Profile fetched",
    )


async def update_profile(db: AsyncSession, user: User, payload: UpdateStudentProfileSchema):
    result = await db.execute(select(Student).where(Student.userid == user.userid))
    student = result.scalar_one_or_none()

    if not student:
        return api_response_error(message="Student profile not found", status_code=StatusCode.notFound)

    if payload.guardian_phone is not None:
        student.guardian_phone = payload.guardian_phone
    if payload.section is not None:
        student.section = payload.section

    await db.commit()

    return api_response_success(message="Profile updated")


async def get_attendance(db: AsyncSession, user: User):
    records = (await db.execute(
        select(Attendance, Subject.name, Subject.code, Subject.public_id)
        .join(Student, Student.id == Attendance.student_id)
        .join(Subject, Subject.id == Attendance.subject_id)
        .where(Student.userid == user.userid)
        .order_by(Attendance.date.desc())
    )).all()

    return api_response_success(
        data=[
            {
                "subject_id": subject_public_id,
                "subject_name": subject_name,
                "subject_code": subject_code,
                "date": a.date,
                "status": a.status,
            }
            for a, subject_name, subject_code, subject_public_id in records
        ],
        message="Attendance fetched",
    )


async def get_marks(db: AsyncSession, user: User):
    marks = (await db.execute(
        select(
            Marks,
            Subject.name,
            Subject.code,
            Subject.public_id,
            Exam.name,
            Exam.semester,
            Exam.public_id,
        )
        .join(Student, Student.id == Marks.student_id)
        .outerjoin(Subject, Subject.id == Marks.subject_id)
        .outerjoin(Exam, Exam.id == Marks.exam_id)
        .where(Student.userid == user.userid)
        .order_by(Marks.id)
    )).all()

    return api_response_success(
        data=[
            {
                "exam_id": exam_public_id,
                "exam_name": exam_name,
                "exam_semester": exam_sem,
                "subject_id": subject_public_id,
                "subject_name": subject_name,
                "subject_code": subject_code,
                "marks_obtained": m.marks_obtained,
                "marks_total": m.marks_total,
                "percentage": (
                    round(m.marks_obtained * 100 / m.marks_total, 1)
                    if m.marks_total else None
                ),
            }
            for m, subject_name, subject_code, subject_public_id,
                exam_name, exam_sem, exam_public_id in marks
        ],
        message="Marks fetched",
    )


async def get_notices(db: AsyncSession, user: User):
    # A student should not see notices addressed to staff only.
    result = await db.execute(
        select(Notice)
        .where(Notice.is_published == 1, (Notice.audience == "ALL") | (Notice.audience == "STUDENT"))
        .order_by(Notice.created_at.desc())
    )
    notices = result.scalars().all()

    return api_response_success(
        data=[{"id": n.public_id, "title": n.title, "body": n.body, "audience": n.audience, "created_at": n.created_at} for n in notices],
        message="Notices fetched",
    )


async def get_fees(db: AsyncSession, user: User):
    student, error = await _student_or_error(db, user)
    if error:
        return error

    structures = (await db.execute(select(FeeStructure).where(FeeStructure.course_id == student.course_id))).scalars().all()
    payments = (await db.execute(select(FeePayment).where(FeePayment.student_id == student.id).order_by(FeePayment.paid_on.desc()))).scalars().all()

    total_due = sum(float(f.amount or 0) for f in structures)
    total_paid = sum(float(p.amount or 0) for p in payments)

    return api_response_success(data={
        "course_name": None,
        "fee_structure": [{"id": f.public_id, "head": f.head, "amount": float(f.amount or 0), "due_date": f.due_date} for f in structures],
        "payments": [{"id": p.public_id, "amount": float(p.amount or 0), "receipt_no": p.receipt_no, "payment_mode": p.payment_mode, "paid_on": p.paid_on} for p in payments],
        "total_due": total_due,
        "total_paid": total_paid,
        "balance": max(total_due - total_paid, 0),
    })


async def get_materials(db: AsyncSession, user: User):
    student, error = await _student_or_error(db, user)
    if error:
        return error

    rows = (await db.execute(
        select(StudyMaterial, Subject.name, Subject.code, Subject.public_id)
        .join(Subject, Subject.id == StudyMaterial.subject_id)
        .where(Subject.course_id == student.course_id)
        .order_by(StudyMaterial.created_at.desc())
    )).all()

    return api_response_success(data=[
        {
            "id": m.public_id,
            "title": m.title,
            "subject_id": subject_public_id,
            "subject_name": subject_name,
            "subject_code": subject_code,
            "file_type": m.file_type,
            "file_url": m.file_url,
            "file_size": m.file_size,
            "created_at": m.created_at,
        }
        for m, subject_name, subject_code, subject_public_id in rows
    ])


async def get_assignments(db: AsyncSession, user: User):
    student, error = await _student_or_error(db, user)
    if error:
        return error

    query = (
        select(Assignment, Subject.name, Subject.code, Subject.public_id)
        .join(Subject, Subject.id == Assignment.subject_id)
        .where(Subject.course_id == student.course_id)
    )
    if student.section:
        query = query.where((Assignment.section == student.section) | (Assignment.section == None))
    rows = (await db.execute(query.order_by(Assignment.due_date))).all()

    return api_response_success(data=[
        {
            "id": a.public_id,
            "title": a.title,
            "description": a.description,
            "subject_id": subject_public_id,
            "subject_name": subject_name,
            "subject_code": subject_code,
            "section": a.section,
            "due_date": a.due_date,
        }
        for a, subject_name, subject_code, subject_public_id in rows
    ])


async def get_certificates(db: AsyncSession, user: User):
    student, error = await _student_or_error(db, user)
    if error:
        return error

    rows = (await db.execute(select(Certificate).where(Certificate.student_id == student.id).order_by(Certificate.issued_on.desc()))).scalars().all()
    return api_response_success(data=[{"id": c.public_id, "title": c.title, "certificate_no": c.certificate_no, "issued_on": c.issued_on} for c in rows])


async def get_leave(db: AsyncSession, user: User):
    rows = (await db.execute(
        select(LeaveRequest).where(LeaveRequest.userid == user.userid).order_by(LeaveRequest.created_at.desc())
    )).scalars().all()

    return api_response_success(data=[
        {
            "id": l.public_id,
            "from_date": l.from_date,
            "to_date": l.to_date,
            "reason": l.reason,
            "status": l.status,
            "created_at": l.created_at,
        }
        for l in rows
    ])


async def apply_leave(db: AsyncSession, user: User, payload):
    if payload.to_date < payload.from_date:
        return api_response_error(message="To date must be on or after the from date", status_code=StatusCode.badRequest)

    l = LeaveRequest(userid=user.userid, from_date=payload.from_date, to_date=payload.to_date, reason=payload.reason)
    db.add(l)
    await db.commit()
    return api_response_success(data={"id": l.public_id}, message="Leave applied", status_code=StatusCode.create)
