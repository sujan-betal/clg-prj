from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy import func

from src.models.user_model import User
from src.models.teacher_model import Teacher, TeacherSubject
from src.models.course_model import Subject, Course, Department
from src.models.student_model import Student
from src.models.academic_model import Attendance, Marks, Exam
from src.models.content_model import Notice, StudyMaterial, Assignment
from src.modules.teacher.teacher_schemas import UpdateTeacherProfileSchema, PostNoticeSchema
from src.utils.common_schema import api_response_success, api_response_error
from src.utils.identifiers import resolve
from src.utils.status_code import StatusCode


async def _name_maps(db: AsyncSession, subject_ids=(), exam_ids=()):
    """Fetch subject/exam display names in bulk so no row shows a raw id."""
    subjects = {}
    if subject_ids:
        rows = (await db.execute(
            select(Subject.id, Subject.name, Subject.code, Subject.public_id)
            .where(Subject.id.in_([i for i in set(subject_ids) if i]))
        )).all()
        subjects = {r[0]: {"name": r[1], "code": r[2], "public_id": r[3]} for r in rows}

    exams = {}
    if exam_ids:
        rows = (await db.execute(
            select(Exam.id, Exam.name, Exam.semester, Exam.public_id)
            .where(Exam.id.in_([i for i in set(exam_ids) if i]))
        )).all()
        exams = {r[0]: {"name": r[1], "semester": r[2], "public_id": r[3]} for r in rows}

    return subjects, exams


async def _student_map(db, student_ids):
    """Resolve student rows to their public id, roll number and username."""
    student_ids = [i for i in set(student_ids) if i]
    if not student_ids:
        return {}
    rows = (await db.execute(
        select(Student.id, Student.roll_no, User.username, Student.public_id)
        .join(User, User.userid == Student.userid)
        .where(Student.id.in_(student_ids))
    )).all()
    return {r[0]: {"roll_no": r[1], "username": r[2], "public_id": r[3]} for r in rows}


def _not_mine(what: str) -> str:
    """The refusal used when a teacher reaches outside their own subjects.

    Deliberately says only that the id is not theirs, never whether it exists.
    Confirming existence would let a teacher probe for valid ids, which is the
    thing the random public ids are meant to prevent.
    """
    return f"You are not assigned to that {what}"


async def _require_own_subject(db: AsyncSession, teacher_id, subject_public_id):
    """Resolve a subject UUID and check this teacher actually teaches it.

    Returns (subject_id, None) on success or (None, error_response) otherwise.
    Existence alone is not enough: without this check any teacher could post
    marks, attendance, materials or assignments into someone else's subject.
    """
    subject_id = await resolve(db, Subject, subject_public_id)
    if subject_id is None:
        return None, api_response_error(message=_not_mine("subject"), status_code=StatusCode.forbidden)

    assigned = (await db.execute(
        select(TeacherSubject.id).where(
            TeacherSubject.teacher_id == teacher_id,
            TeacherSubject.subject_id == subject_id,
        )
    )).first()

    if not assigned:
        return None, api_response_error(message=_not_mine("subject"), status_code=StatusCode.forbidden)

    return subject_id, None


async def _require_own_student(db: AsyncSession, teacher_id, student_public_id):
    """Resolve a student UUID and check they sit in a course this teacher teaches.

    Without this a teacher could mark attendance or grades for any student in
    the institute, including in courses they have nothing to do with.
    """
    student_id = await resolve(db, Student, student_public_id)
    if student_id is None:
        return None, api_response_error(message=_not_mine("student"), status_code=StatusCode.forbidden)

    enrolled = (await db.execute(
        select(Student.id)
        .join(TeacherSubject, TeacherSubject.course_id == Student.course_id)
        .where(
            TeacherSubject.teacher_id == teacher_id,
            Student.id == student_id,
        )
        .limit(1)
    )).first()

    if not enrolled:
        return None, api_response_error(message=_not_mine("student"), status_code=StatusCode.forbidden)

    return student_id, None


async def get_profile(db: AsyncSession, user: User):
    result = await db.execute(
        select(Teacher, Department.name, Department.public_id)
        .outerjoin(Department, Department.id == Teacher.department_id)
        .where(Teacher.userid == user.userid)
    )
    row = result.first()
    teacher, department_name, department_public_id = row if row else (None, None, None)

    if not teacher:
        return api_response_error(message="Teacher profile not found", status_code=StatusCode.notFound)

    return api_response_success(
        data={
            "id": teacher.public_id,
            "userid": user.userid,
            "username": user.username,
            "email": user.email,
            "employee_id": teacher.employee_id,
            "designation": teacher.designation,
            "department_id": department_public_id,
            "department_name": department_name,
            "is_department_head": bool(teacher.is_department_head),
        },
        message="Profile fetched",
    )


async def update_profile(db: AsyncSession, user: User, payload: UpdateTeacherProfileSchema):
    result = await db.execute(select(Teacher).where(Teacher.userid == user.userid))
    teacher = result.scalar_one_or_none()

    if not teacher:
        return api_response_error(message="Teacher profile not found", status_code=StatusCode.notFound)

    if payload.designation is not None:
        teacher.designation = payload.designation
    if payload.department_id is not None:
        department_id = await resolve(db, Department, payload.department_id)
        if department_id is None:
            return api_response_error(message="Department not found", status_code=StatusCode.notFound)
        teacher.department_id = department_id

    await db.commit()

    return api_response_success(message="Profile updated")


async def get_subjects(db: AsyncSession, user: User):
    rows = (await db.execute(
        select(TeacherSubject, Course.name, Course.code, Course.public_id, Department.name)
        .join(Teacher, Teacher.id == TeacherSubject.teacher_id)
        .outerjoin(Course, Course.id == TeacherSubject.course_id)
        .outerjoin(Department, Department.id == Course.department_id)
        .where(Teacher.userid == user.userid)
    )).all()

    # Attach readable names so the UI never has to show raw ids.
    subjects, _ = await _name_maps(db, [r[0].subject_id for r in rows])
    counts = dict((await db.execute(
        select(Student.course_id, func.count()).group_by(Student.course_id)
    )).all())

    return api_response_success(
        data=[
            {
                "id": s.public_id,
                "subject_id": subjects.get(s.subject_id, {}).get("public_id"),
                "subject_name": subjects.get(s.subject_id, {}).get("name"),
                "subject_code": subjects.get(s.subject_id, {}).get("code"),
                "course_id": course_public_id,
                "course_name": course_name,
                "course_code": course_code,
                "department_name": dept_name,
                "students_count": counts.get(s.course_id, 0),
                "section": s.section,
                "academic_year": s.academic_year,
            }
            for s, course_name, course_code, course_public_id, dept_name in rows
        ],
        message="Subjects fetched",
    )


async def list_students(db: AsyncSession, user: User):
    """Students this teacher can actually mark, with names for a dropdown.

    Scoped to the courses the teacher is assigned to. Returning every student
    in the institute let any teacher read the whole roster and post grades
    into courses they do not teach.
    """
    teacher = await _get_teacher(db, user)
    if not teacher:
        return api_response_error(message="Teacher profile not found", status_code=StatusCode.notFound)

    rows = (await db.execute(
        select(Student.public_id, Student.roll_no, User.username, Course.name)
        .join(User, User.userid == Student.userid)
        .join(TeacherSubject, TeacherSubject.course_id == Student.course_id)
        .outerjoin(Course, Course.id == Student.course_id)
        .where(
            TeacherSubject.teacher_id == teacher.id,
            User.is_deleted == False,
            User.status == "ACTIVE",
        )
        .order_by(Student.roll_no)
        .distinct()
    )).all()

    return api_response_success(
        data=[
            {
                "student_id": r[0],
                "roll_no": r[1],
                "username": r[2],
                "course_name": r[3],
            }
            for r in rows
        ],
        message="Students fetched",
    )


async def list_exams(db: AsyncSession, user: User):
    """Exams belonging to the courses this teacher is assigned to."""
    rows = (await db.execute(
        select(Exam, Course.name)
        .join(TeacherSubject, TeacherSubject.course_id == Exam.course_id)
        .join(Teacher, Teacher.id == TeacherSubject.teacher_id)
        .outerjoin(Course, Course.id == Exam.course_id)
        .where(Teacher.userid == user.userid)
        .distinct()
    )).all()

    return api_response_success(data=[
        {
            "id": e.public_id,
            "name": e.name,
            "course_name": course_name,
            "semester": e.semester,
            "start_date": e.start_date,
            "is_published": e.is_published,
        }
        for e, course_name in rows
    ], message="Exams fetched")


async def post_notice(db: AsyncSession, user: User, payload: PostNoticeSchema):
    notice = Notice(
        title=payload.title,
        body=payload.content,
        audience=payload.audience,
        created_by=user.userid,
        is_published=1,
    )

    db.add(notice)
    await db.commit()
    await db.refresh(notice)

    return api_response_success(data={"id": notice.public_id}, message="Notice posted", status_code=StatusCode.create)


from src.models.activity_model import LeaveRequest


def _teacher_id(teacher):
    return teacher.id if teacher else None


async def _get_teacher(db, user):
    result = await db.execute(select(Teacher).where(Teacher.userid == user.userid))
    return result.scalar_one_or_none()


async def get_attendance(db, user):
    teacher = await _get_teacher(db, user)
    if not teacher:
        return api_response_error(message="Teacher profile not found", status_code=StatusCode.notFound)
    rows = (await db.execute(select(Attendance).where(Attendance.teacher_id == teacher.id).order_by(Attendance.date.desc()))).scalars().all()
    subjects, _ = await _name_maps(db, [a.subject_id for a in rows])
    students = await _student_map(db, [a.student_id for a in rows])
    return api_response_success(data=[
        {
            "id": a.public_id,
            "student_id": students.get(a.student_id, {}).get("public_id"),
            "roll_no": students.get(a.student_id, {}).get("roll_no"),
            "username": students.get(a.student_id, {}).get("username"),
            "subject_id": subjects.get(a.subject_id, {}).get("public_id"),
            "subject_name": subjects.get(a.subject_id, {}).get("name"),
            "date": a.date,
            "status": a.status,
        }
        for a in rows
    ])


async def mark_attendance(db, user, payload):
    teacher = await _get_teacher(db, user)
    if not teacher:
        return api_response_error(message="Teacher profile not found", status_code=StatusCode.notFound)

    if not payload.records:
        return api_response_error(message="No attendance records supplied", status_code=StatusCode.badRequest)

# Ownership first: a teacher must not learn whether a subject or student
    # outside their own teaching even exists, let alone write to it.
    resolved = []
    for r in payload.records:
        subject_id, denied = await _require_own_subject(db, teacher.id, r.subject_id)
        if denied:
            return denied
        student_id, denied = await _require_own_student(db, teacher.id, r.student_id)
        if denied:
            return denied
        resolved.append((student_id, subject_id, r.date, r.status))

    for student_id, subject_id, day, status in resolved:
        existing = (await db.execute(
            select(Attendance).where(
                Attendance.student_id == student_id,
                Attendance.subject_id == subject_id,
                Attendance.date == day,
            )
        )).scalar_one_or_none()
        if existing:
            existing.status = status
            existing.teacher_id = teacher.id
        else:
            db.add(Attendance(
                student_id=student_id,
                subject_id=subject_id,
                teacher_id=teacher.id,
                date=day,
                status=status,
            ))
    await db.commit()
    return api_response_success(message="Attendance saved")


async def get_marks(db, user):
    teacher = await _get_teacher(db, user)
    if not teacher:
        return api_response_error(message="Teacher profile not found", status_code=StatusCode.notFound)
    rows = (await db.execute(select(Marks).where(Marks.teacher_id == teacher.id))).scalars().all()
    subjects, exams = await _name_maps(db, [m.subject_id for m in rows], [m.exam_id for m in rows])
    students = await _student_map(db, [m.student_id for m in rows])
    return api_response_success(data=[
        {
            "id": m.public_id,
            "student_id": students.get(m.student_id, {}).get("public_id"),
            "roll_no": students.get(m.student_id, {}).get("roll_no"),
            "username": students.get(m.student_id, {}).get("username"),
            "exam_id": exams.get(m.exam_id, {}).get("public_id"),
            "exam_name": exams.get(m.exam_id, {}).get("name"),
            "subject_id": subjects.get(m.subject_id, {}).get("public_id"),
            "subject_name": subjects.get(m.subject_id, {}).get("name"),
            "subject_code": subjects.get(m.subject_id, {}).get("code"),
            "marks_obtained": m.marks_obtained,
            "marks_total": m.marks_total,
        }
        for m in rows
    ])


async def add_marks(db, user, payload):
    teacher = await _get_teacher(db, user)
    if not teacher:
        return api_response_error(message="Teacher profile not found", status_code=StatusCode.notFound)

    subject_id, denied = await _require_own_subject(db, teacher.id, payload.subject_id)
    if denied:
        return denied
    student_id, denied = await _require_own_student(db, teacher.id, payload.student_id)
    if denied:
        return denied

    exam_id = await resolve(db, Exam, payload.exam_id)
    if exam_id is None:
        return api_response_error(message="Exam not found", status_code=StatusCode.notFound)

    # One mark per student/exam/subject: re-posting the same cell overwrites
    # the grade instead of silently adding a second row.
    existing = (await db.execute(
        select(Marks).where(
            Marks.student_id == student_id,
            Marks.exam_id == exam_id,
            Marks.subject_id == subject_id,
        )
    )).scalar_one_or_none()
    if existing:
        existing.marks_obtained = payload.marks_obtained
        existing.marks_total = payload.marks_total
        existing.teacher_id = teacher.id
        await db.commit()
        return api_response_success(data={"id": existing.public_id}, message="Marks updated")

    m = Marks(
        student_id=student_id,
        exam_id=exam_id,
        subject_id=subject_id,
        teacher_id=teacher.id,
        marks_obtained=payload.marks_obtained,
        marks_total=payload.marks_total,
    )
    db.add(m)
    await db.commit()
    return api_response_success(data={"id": m.public_id}, message="Marks added", status_code=StatusCode.create)


async def list_materials(db, user):
    teacher = await _get_teacher(db, user)
    if not teacher:
        return api_response_error(message="Teacher profile not found", status_code=StatusCode.notFound)
    rows = (await db.execute(select(StudyMaterial).where(StudyMaterial.teacher_id == teacher.id).order_by(StudyMaterial.created_at.desc()))).scalars().all()
    subjects, _ = await _name_maps(db, [m.subject_id for m in rows])
    return api_response_success(data=[
        {
            "id": m.public_id,
            "title": m.title,
            "subject_id": subjects.get(m.subject_id, {}).get("public_id"),
            "subject_name": subjects.get(m.subject_id, {}).get("name"),
            "subject_code": subjects.get(m.subject_id, {}).get("code"),
            "file_type": m.file_type,
            "file_url": m.file_url,
            "file_size": m.file_size,
            "created_at": m.created_at,
        }
        for m in rows
    ])


async def add_material(db, user, payload):
    teacher = await _get_teacher(db, user)
    if not teacher:
        return api_response_error(message="Teacher profile not found", status_code=StatusCode.notFound)
    subject_id, denied = await _require_own_subject(db, teacher.id, payload.subject_id)
    if denied:
        return denied
    m = StudyMaterial(
        title=payload.title,
        subject_id=subject_id,
        teacher_id=teacher.id,
        file_url=payload.file_url,
        file_type=payload.file_type,
        file_size=payload.file_size or 0,
    )
    db.add(m)
    await db.commit()
    return api_response_success(data={"id": m.public_id}, message="Material added", status_code=StatusCode.create)


async def list_assignments(db, user):
    teacher = await _get_teacher(db, user)
    if not teacher:
        return api_response_error(message="Teacher profile not found", status_code=StatusCode.notFound)
    rows = (await db.execute(select(Assignment).where(Assignment.teacher_id == teacher.id).order_by(Assignment.created_at.desc()))).scalars().all()
    subjects, _ = await _name_maps(db, [a.subject_id for a in rows])
    return api_response_success(data=[
        {
            "id": a.public_id,
            "title": a.title,
            "description": a.description,
            "subject_id": subjects.get(a.subject_id, {}).get("public_id"),
            "subject_name": subjects.get(a.subject_id, {}).get("name"),
            "subject_code": subjects.get(a.subject_id, {}).get("code"),
            "section": a.section,
            "due_date": a.due_date,
            "created_at": a.created_at,
        }
        for a in rows
    ])


async def add_assignment(db, user, payload):
    teacher = await _get_teacher(db, user)
    if not teacher:
        return api_response_error(message="Teacher profile not found", status_code=StatusCode.notFound)
    subject_id, denied = await _require_own_subject(db, teacher.id, payload.subject_id)
    if denied:
        return denied
    a = Assignment(
        title=payload.title,
        description=payload.description,
        subject_id=subject_id,
        teacher_id=teacher.id,
        section=payload.section,
        due_date=payload.due_date,
    )
    db.add(a)
    await db.commit()
    return api_response_success(data={"id": a.public_id}, message="Assignment created", status_code=StatusCode.create)


async def get_leave(db, user):
    rows = (await db.execute(select(LeaveRequest).where(LeaveRequest.userid == user.userid).order_by(LeaveRequest.created_at.desc()))).scalars().all()
    return api_response_success(data=[{"id": l.public_id, "from_date": l.from_date, "to_date": l.to_date, "reason": l.reason, "status": l.status, "created_at": l.created_at} for l in rows])


async def apply_leave(db, user, payload):
    if payload.to_date < payload.from_date:
        return api_response_error(message="To date must be on or after the from date", status_code=StatusCode.badRequest)
    l = LeaveRequest(userid=user.userid, from_date=payload.from_date, to_date=payload.to_date, reason=payload.reason)
    db.add(l)
    await db.commit()
    return api_response_success(data={"id": l.public_id}, message="Leave applied", status_code=StatusCode.create)
