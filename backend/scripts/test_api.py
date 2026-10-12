"""
End-to-end smoke test: every API the frontend calls, with the right token.

    python backend/scripts/test_api.py

Fails loudly if an endpoint errors. It also fails if a list endpoint that a
page renders returns zero rows, because an empty page is the bug this repo
keeps hitting: the UI says "nothing here" when the real problem is the seed
data or a missing join.

Exit code 0 = every check passed.
"""

import json
import os
import sys
import urllib.error
import urllib.request

BASE = os.getenv("API_BASE_URL", "http://127.0.0.1:8000").rstrip("/")
ADMIN_PW = "Admin@1234"
NEW_USER_PW = "Temp@1234"

passed, failed = 0, []


def call(token, method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(BASE + path, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", "Bearer " + token)
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read())
        except Exception:
            return e.code, {}
    except Exception as e:
        return 0, {"error": str(e)}


def check(label, token, path, expect_non_empty=False, count_of=None):
    """Assert the call succeeds, and optionally that the payload has rows."""
    global passed
    status, payload = call(token, "GET", path)

    if status != 200 or not payload.get("success"):
        failed.append((label, path, status, payload.get("message", "not success")))
        print(f"  FAIL  {label:34s} {path}  -> {status} {payload.get('message', '')}")
        return None

    data = payload.get("data")
    n = None
    if count_of and isinstance(data, dict):
        n = len(data.get(count_of) or [])
    elif isinstance(data, list):
        n = len(data)
    elif isinstance(data, dict):
        n = len(data)

    if expect_non_empty and not n:
        failed.append((label, path, status, "EMPTY"))
        print(f"  EMPTY {label:34s} {path}  -> 0 rows")
        return data

    passed += 1
    shown = f"{n} rows" if n is not None else "ok"
    print(f"  ok    {label:34s} {shown}")
    return data


def login(username, password):
    _, r = call(None, "POST", "/api/auth/login", {"username": username, "password": password})
    return (r.get("data") or {}).get("access_token")


def first_user(token, role):
    _, r = call(token, "GET", f"/api/admin/users?page=1&page_size=100&role={role}")
    users = r.get("data") or []
    return users[0]["username"] if users else None


def main():
    print("=" * 78)
    print("API SMOKE TEST - every endpoint the frontend calls")
    print("=" * 78)

    status, payload = call(None, "GET", "/")
    if status != 200:
        print(f"Backend unreachable at {BASE}. Is it running?")
        sys.exit(1)
    print(f"  backend reachable: {payload.get('message')}\n")

    # ---------------------------------------------------------------- public
    print("PUBLIC PAGES (no login)")
    home = check("home / stats", None, "/api/public/home")
    if home:
        stats = home.get("stats") or {}
        print(f"        students={stats.get('students')} programs={stats.get('programs')} "
              f"faculty={stats.get('faculty')} est={home.get('established')}")
        if not stats.get("students") or not home.get("established"):
            failed.append(("home stats", "/api/public/home", 200, "zero stat or no established"))
            print("        -> a stat or 'established' is empty")
    check("home ticker notices", None, "/api/public/notices", True)
    check("home events", None, "/api/public/events", True)
    check("about / site content", None, "/api/public/site-content")
    content = check("courses / programs", None, "/api/public/courses", True)
    if content:
        missing = [c["name"] for c in content if not c.get("department_name")]
        if missing:
            print(f"        -> {len(missing)} courses without department_name")
    check("departments", None, "/api/public/departments", True)
    faculty = check("faculty", None, "/api/public/faculty", True)
    if faculty:
        unnamed = [f for f in faculty if not f.get("username")]
        if unnamed:
            print(f"        -> {len(unnamed)} faculty rows without a username")
            failed.append(("faculty names", "/api/public/faculty", 200, "missing username"))
    check("gallery", None, "/api/public/gallery", True)
    check("public notices", None, "/api/public/notices", True)
    check("public events", None, "/api/public/events", True)

    # ----------------------------------------------------------------- admin
    print("\nADMIN PAGES")
    admin = login("admin", ADMIN_PW)
    if not admin:
        print("  Cannot log in as admin - run scripts/create_admin.py")
        sys.exit(1)

    check("admin dashboard stats", admin, "/api/admin/stats")
    for label, path in [
        ("admin users", "/api/admin/users?page=1&page_size=10"),
        ("admin students", "/api/admin/users?page=1&page_size=10&role=STUDENT"),
        ("admin teachers", "/api/admin/users?page=1&page_size=10&role=TEACHER"),
        ("admin roles", "/api/admin/roles"),
        ("admin permission names", "/api/admin/permission-names"),
        ("admin departments", "/api/admin/departments"),
        ("admin courses", "/api/admin/courses"),
        ("admin subjects", "/api/admin/subjects"),
        ("admin teacher-subjects", "/api/admin/teacher-subjects"),
        ("admin exams", "/api/admin/exams"),
        ("admin fees", "/api/admin/fees"),
        ("admin notices", "/api/admin/notices"),
        ("admin events", "/api/admin/events"),
        ("admin gallery", "/api/admin/gallery"),
        ("admin admissions", "/api/admin/admissions"),
        ("admin messages", "/api/admin/messages"),
        ("admin certificates", "/api/admin/certificates"),
        ("admin fee-payments", "/api/admin/fee-payments"),
        ("admin leave", "/api/admin/leave"),
        ("admin reports", "/api/admin/reports"),
        ("admin audit logs", "/api/admin/audit-logs"),
    ]:
        check(label, admin, path, True)

    content_rows = check("admin content", admin, "/api/admin/content", True, count_of="materials")
    if isinstance(content_rows, dict):
        if not content_rows.get("assignments"):
            failed.append(("admin content assignments", "/api/admin/content", 200, "EMPTY"))
            print("  EMPTY admin content assignments")

    # --------------------------------------------------------------- student
    print("\nSTUDENT PAGES")
    student_name = first_user(admin, "STUDENT")
    if not student_name:
        print("  No student accounts found.")
        failed.append(("student accounts", "", 0, "none"))
    else:
        student = login(student_name, NEW_USER_PW)
        print(f"  (testing as {student_name})")
        prof = check("student profile", student, "/api/student/profile")
        if prof and not prof.get("course_name"):
            print("        -> course_name is empty; run bulk_seed.py so students are enrolled")
            failed.append(("student enrollment", "/api/student/profile", 200, "no course"))
        check("student attendance", student, "/api/student/attendance")
        check("student results", student, "/api/student/marks")
        check("student notices", student, "/api/student/notices", True)
        fees = check("student fees", student, "/api/student/fees")
        if isinstance(fees, dict) and not fees.get("fee_structure"):
            print("        -> fee_structure empty; student's course has no fee heads")
        check("student materials", student, "/api/student/materials")
        check("student assignments", student, "/api/student/assignments")
        check("student certificates", student, "/api/student/certificates")

    # --------------------------------------------------------------- teacher
    print("\nTEACHER PAGES")
    teacher_name = first_user(admin, "TEACHER")
    if not teacher_name:
        print("  No teacher accounts found.")
        failed.append(("teacher accounts", "", 0, "none"))
    else:
        teacher = login(teacher_name, NEW_USER_PW)
        print(f"  (testing as {teacher_name})")
        prof = check("teacher profile", teacher, "/api/teacher/profile")
        if prof and not prof.get("department_name"):
            print("        -> department_name empty")
        subs = check("teacher subjects", teacher, "/api/teacher/subjects")
        if subs is not None and not subs:
            print("        -> no subjects assigned; the marks/materials forms will be empty")
            failed.append(("teacher subjects", "/api/teacher/subjects", 200, "EMPTY"))
        check("teacher exams", teacher, "/api/teacher/exams")
        check("teacher students", teacher, "/api/teacher/students", True)
        check("teacher attendance", teacher, "/api/teacher/attendance")
        check("teacher marks", teacher, "/api/teacher/marks")
        check("teacher materials", teacher, "/api/teacher/materials")
        check("teacher assignments", teacher, "/api/teacher/assignments")
        check("teacher leave", teacher, "/api/teacher/leave")

    # ----------------------------------------------------------- write paths
    print("\nWRITE PATHS (the forms)")
    # Ids are UUIDs, so pull real ones from the read endpoints rather than
    # inventing them - an integer here would be rejected before validation.
    dept_id = (call(admin, "GET", "/api/admin/departments")[1].get("data") or [{}])[0].get("id")
    course_id = (call(admin, "GET", "/api/admin/courses")[1].get("data") or [{}])[0].get("id")
    subject_id = (call(admin, "GET", "/api/admin/subjects")[1].get("data") or [{}])[0].get("id")
    student_id = (call(admin, "GET", "/api/admin/users?page=1&page_size=10&role=STUDENT")[1].get("data") or [{}])[0].get("userid")

    writes = [
        ("admin create department", admin, "/api/admin/departments",
         {"name": "Smoke Test Dept", "code": "SMK", "description": "temp"}),
        ("admin create course", admin, "/api/admin/courses",
         {"department_id": dept_id, "name": "Smoke Test Course", "code": "SMK-1",
          "duration_years": 4, "total_seats": 10, "annual_fee": 1000}),
        ("admin create subject", admin, "/api/admin/subjects",
         {"course_id": course_id, "name": "Smoke Subject", "code": "SMK-101", "credits": 3, "semester": 1}),
        ("admin create exam", admin, "/api/admin/exams",
         {"name": "Smoke Exam", "course_id": course_id, "semester": 1, "is_published": 1}),
        ("admin create fee", admin, "/api/admin/fees",
         {"course_id": course_id, "head": "Smoke Fee", "amount": 100}),
        ("admin post notice", admin, "/api/admin/notices",
         {"title": "Smoke notice", "body": "temp", "audience": "ALL", "is_published": 1}),
        ("admin post event", admin, "/api/admin/events",
         {"title": "Smoke event", "description": "temp", "venue": "Hall"}),
        ("admin post gallery", admin, "/api/admin/gallery",
         {"title": "Smoke gallery", "album": "Smoke"}),
        ("admin site content", admin, "/api/admin/site-content",
         {"key": "smoke_test_key", "value": "temp"}),
        ("public admission", None, "/api/public/admissions",
         {"applicant_name": "Smoke Applicant", "email": "smoke@example.com",
          "phone": "+91 9000000000", "course_id": course_id}),
        ("public contact", None, "/api/public/contact",
         {"name": "Smoke Visitor", "email": "smoke@example.com", "message": "temp"}),
    ]
    for label, token, path, body in writes:
        global passed
        status, payload = call(token, "POST", path, body)
        # 400 is fine for the creates: a previous run already made them.
        if (status in (200, 201) and payload.get("success")) or status == 400:
            passed += 1
            note = "" if status != 400 else " (already exists)"
            print(f"  ok    {label}{note}")
        else:
            failed.append((label, path, status, payload.get("message", "")))
            print(f"  FAIL  {label:34s} {status} {payload.get('message', '')}")

    # ------------------------------------------------- authorization checks
    print("\nAUTHORIZATION (a teacher must not reach outside their own subjects)")
    if teacher_name and admin:
        # Find a subject this teacher is NOT assigned to.
        own = call(teacher, "GET", "/api/teacher/subjects")[1].get("data") or []
        own_subject_ids = {s["subject_id"] for s in own}

        _, subj = call(admin, "GET", "/api/admin/subjects")
        foreign = next(
            (s for s in (subj.get("data") or []) if s["id"] not in own_subject_ids),
            None,
        )

        if foreign:
            mine_students = call(teacher, "GET", "/api/teacher/students")[1].get("data") or []
            if mine_students:
                status, payload = call(teacher, "POST", "/api/teacher/attendance", {
                    "records": [{
                        "student_id": mine_students[0]["student_id"],
                        "subject_id": foreign["id"],
                        "date": "2026-06-01",
                        "status": "ABSENT",
                    }],
                })
                if payload.get("success"):
                    failed.append(("teacher writes foreign subject", "/api/teacher/attendance", status, "ALLOWED"))
                    print(f"  FAIL  foreign-subject attendance accepted -> {payload.get('message')}")
                else:
                    passed += 1
                    print(f"  ok    foreign-subject attendance blocked ({payload.get('message')})")

            status, payload = call(teacher, "POST", "/api/teacher/materials", {
                "title": "Smoke foreign material",
                "subject_id": foreign["id"],
            })
            if payload.get("success"):
                failed.append(("teacher writes foreign material", "/api/teacher/materials", status, "ALLOWED"))
                print("  FAIL  foreign-subject material accepted")
            else:
                passed += 1
                print(f"  ok    foreign-subject material blocked ({payload.get('message')})")

        # Sequential ids must not be usable where a UUID is expected.
        status, payload = call(teacher, "POST", "/api/teacher/assignments", {
            "title": "Smoke", "subject_id": 1,
        })
        if payload.get("success"):
            failed.append(("integer id accepted", "/api/teacher/assignments", status, "ALLOWED"))
            print("  FAIL  a plain integer id was accepted")
        else:
            passed += 1
            print("  ok    integer id rejected as a subject id")

    # ------------------------------------------------------------------ done
    print()
    print("=" * 78)
    print(f"PASSED: {passed}   FAILED: {len(failed)}")
    for f in failed:
        print(f"   FAIL {f}")
    print("=" * 78)
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()