"""
Fills academic records (attendance, marks, materials, assignments, fees,
certificates, leave) so the student and teacher dashboards have data too.

    python backend/scripts/bulk_academic.py

Depends on bulk_seed.py having run first (needs courses, subjects, users).
Safe to re-run: attendance is upserted and the rest is keyed on title/date.
"""

import json
import os
import random
import sys
import urllib.error
import urllib.request
from datetime import date, timedelta

BASE = os.getenv("API_BASE_URL", "http://127.0.0.1:8000").rstrip("/")
ADMIN_PW = "Admin@1234"
NEW_USER_PW = "Temp@1234"

random.seed(11)
today = date.today()

done = {"attendance": 0, "marks": 0, "materials": 0, "assignments": 0,
        "certificates": 0, "fees": 0, "leave": 0}
skipped = 0


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


def write(token, method, path, body=None, count_key=None):
    global skipped
    status, _ = call(token, method, path, body)
    if status in (200, 201):
        if count_key:
            done[count_key] += 1
    else:
        skipped += 1


def login(username, password):
    _, r = call(None, "POST", "/api/auth/login",
                {"username": username, "password": password})
    return (r.get("data") or {}).get("access_token")


def all_users(token, role=None):
    out, page = [], 1
    while True:
        q = f"/api/admin/users?page={page}&page_size=100"
        if role:
            q += f"&role={role}"
        _, r = call(token, "GET", q)
        batch = r.get("data") or []
        out.extend(batch)
        if len(batch) < 100:
            return out
        page += 1


MATERIALS = ["Unit 1 Lecture Notes", "Unit 2 Handouts", "Question Paper 2025",
             "Lab Manual", "Reference Book PDF", "Problem Set Solutions",
             "Lecture Slides", "Revision Notes"]

ASSIGNMENTS = ["Problem Set 1", "Case Study Analysis", "Numerical Worksheet",
               "Lab Report Submission", "Term Project", "Reading Response",
               "Group Presentation", "Unit Test Preparation"]


def main():
    print("=" * 66)
    print("SEEDING ACADEMIC RECORDS VIA THE API")
    print("=" * 66)

    admin = login("admin", ADMIN_PW)
    if not admin:
        print("Could not log in as admin.")
        sys.exit(1)

    students = all_users(admin, "STUDENT")
    teachers = all_users(admin, "TEACHER")
    if not students or not teachers:
        print("No users found. Run bulk_seed.py first.")
        sys.exit(1)

    print(f"  found {len(students)} students, {len(teachers)} teachers")

    # Only students that are actually enrolled have course-scoped pages.
    _, prof = call(None, "GET", "/api/public/courses")
    courses = prof.get("data") or []

    # A teacher token per teacher, so teacher-written records carry a real id.
    teacher_tokens = []
    for t in teachers:
        tok = login(t["username"], NEW_USER_PW)
        if tok:
            teacher_tokens.append((t["username"], tok))
    print(f"  signed in {len(teacher_tokens)} teachers")

    # A student token per student (first 25 is plenty to exercise the pages).
    student_tokens = []
    for s in students[:25]:
        tok = login(s["username"], NEW_USER_PW)
        if tok:
            student_tokens.append((s["username"], tok))
    print(f"  signed in {len(student_tokens)} students")

    # --------------------------------------------------------- attendance
    # A teacher may only mark students in their own courses, so walk every
    # teacher and mark their own roster rather than one teacher's.
    if teacher_tokens:
        for _name, ttok in teacher_tokens:
            _, stu = call(ttok, "GET", "/api/teacher/students")
            roster = stu.get("data") or []
            _, sub = call(ttok, "GET", "/api/teacher/subjects")
            subjects = sub.get("data") or []
            if not roster or not subjects:
                continue
            for subject in subjects[:3]:
                for offset in (1, 2, 3):
                    day = today - timedelta(days=offset)
                    records = [
                        {"student_id": r["student_id"],
                         "subject_id": subject["subject_id"],
                         "date": str(day),
                         "status": random.choice(
                             ["PRESENT"] * 8 + ["ABSENT", "LATE"])}
                        for r in roster
                    ]
                    write(ttok, "POST", "/api/teacher/attendance",
                          {"records": records}, "attendance")
    print(f"  attendance .................... {done['attendance']} classes")

    # --------------------------------------------------------------- marks
    _, exams = call(admin, "GET", "/api/admin/exams")
    exam_list = exams.get("data") or []

    for _name, ttok in teacher_tokens:
        _, sub = call(ttok, "GET", "/api/teacher/subjects")
        subjects = sub.get("data") or []
        _, stu = call(ttok, "GET", "/api/teacher/students")
        roster = stu.get("data") or []
        if not exam_list or not subjects or not roster:
            continue
        for exam in exam_list[:2]:
            for subject in subjects[:3]:
                for r in roster:
                    write(ttok, "POST", "/api/teacher/marks", {
                        "student_id": r["student_id"],
                        "exam_id": exam["id"],
                        "subject_id": subject["subject_id"],
                        "marks_obtained": random.randint(45, 98),
                        "marks_total": 100,
                    }, "marks")
    print(f"  marks ......................... {done['marks']}")

    # ----------------------------------------------- materials, assignments
    # Students read these filtered by their own course, so every teacher needs
    # material in several subjects across many courses for the pages to fill.
    for username, tok in teacher_tokens:
        _, sub = call(tok, "GET", "/api/teacher/subjects")
        subjects = sub.get("data") or []
        for subject in subjects:
            title = random.choice(MATERIALS)
            write(tok, "POST", "/api/teacher/materials", {
                "title": title,
                "subject_id": subject["subject_id"],
                "file_url": f"/materials/{title.lower().replace(' ', '-')}.pdf",
                "file_type": "PDF",
                "file_size": random.randint(50000, 900000),
            }, "materials")
            write(tok, "POST", "/api/teacher/assignments", {
                "title": random.choice(ASSIGNMENTS),
                "description": "Submit before the end of the week.",
                "subject_id": subject["subject_id"],
                # Students filter on their own section, so a section-scoped
                # assignment is invisible to everyone else in the course.
                "section": None,
                "due_date": str(today + timedelta(days=random.randint(3, 20))),
            }, "assignments")

            write(tok, "POST", "/api/teacher/assignments", {
                "title": random.choice(ASSIGNMENTS),
                "description": "Submit before the end of the week.",
                "subject_id": subject["subject_id"],
                "section": subject.get("section") or "A",
                "due_date": str(today + timedelta(days=random.randint(3, 20))),
            }, "assignments")
    print(f"  materials ..................... {done['materials']}")
    print(f"  assignments ................... {done['assignments']}")

    # -------------------------------------------------- certificates, fees
    # Collect every teacher's own roster so the admin pages cover all students.
    all_students = {}
    for _name, ttok in teacher_tokens:
        _, stu = call(ttok, "GET", "/api/teacher/students")
        for r in stu.get("data") or []:
            all_students[r["student_id"]] = r

    for i, r in enumerate(all_students.values()):
        write(admin, "POST", "/api/admin/certificates", {
            "student_id": r["student_id"],
            "title": random.choice(["Merit Certificate", "Academic Excellence",
                                    "Participation Certificate", "Sports Achievement"]),
            "certificate_no": f"CERT-{r['roll_no']}",
            "issued_on": str(today - timedelta(days=random.randint(5, 120))),
        }, "certificates")
        write(admin, "POST", "/api/admin/fee-payments", {
            "student_id": r["student_id"],
            "amount": random.choice([45000, 75000, 95000, 132000]),
            "receipt_no": f"RCP-{r['roll_no']}-{i + 1}",
            "payment_mode": random.choice(["UPI", "CASH", "CARD", "NETBANKING"]),
        }, "fees")
    print(f"  certificates .................. {done['certificates']}")
    print(f"  fee payments ................. {done['fees']}")

    # ---------------------------------------------------------------- leave
    for username, tok in (teacher_tokens[:3] + student_tokens[:5]):
        write(tok, "POST", "/api/teacher/leave", {
            "from_date": str(today + timedelta(days=random.randint(2, 15))),
            "to_date": str(today + timedelta(days=random.randint(16, 25))),
            "reason": random.choice(["Medical", "Family function", "Travel", "Personal"]),
        }, "leave")
    print(f"  leave requests ............... {done['leave']}")

    print()
    print("=" * 66)
    print(f"skipped (duplicates or errors): {skipped}")
    print("Done.")
    print("=" * 66)


if __name__ == "__main__":
    main()
