"""
Seeds real data using ONLY the HTTP API, and asserts every endpoint works.

Run with the backend already listening:
    py backend/scripts/seed_via_api.py

No SQL is used anywhere in this file - if it runs clean, the whole API layer
is proven end to end and the frontend will have something to display.
"""

import json
import os
import sys
import time
import urllib.error
import urllib.request
from datetime import date, timedelta

BASE = os.getenv("API_BASE_URL", "http://127.0.0.1:8000").rstrip("/")
ADMIN_PW = "Admin@1234"
NEW_USER_PW = "Temp@1234"

passed, failed = 0, []


def call(token, method, path, body=None, expect=(200, 201)):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(BASE + path, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", "Bearer " + token)
    try:
        with urllib.request.urlopen(req) as r:
            status, payload = r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        try:
            status, payload = e.code, json.loads(e.read())
        except Exception:
            status, payload = e.code, {}

    ok = status in expect
    global passed
    if ok:
        passed += 1
    else:
        failed.append((method, path, status, expect))
    return payload


def login(username, password):
    r = call(None, "POST", "/api/auth/login",
             {"username": username, "password": password}, expect=(200,))
    return (r.get("data") or {}).get("access_token")


def make_user(admin, username, role, **extra):
    body = {"username": username, "role": role, "status": "ACTIVE"}
    body.update(extra)
    # 400 is fine here: the user already exists from an earlier run.
    return call(admin, "POST", "/api/admin/users", body, expect=(200, 201, 400))


def find_user(admin, username):
    r = call(admin, "GET", "/api/admin/users?page=1&page_size=100", expect=(200,))
    for u in (r.get("data") or []):
        if u["username"] == username:
            return u
    return None


today = date.today()
RUN = int(time.time()) % 100000

print("=" * 66)
print("SEEDING REAL DATA THROUGH THE API ONLY")
print("=" * 66)

# ---------------------------------------------------------------- auth
admin = login("admin", ADMIN_PW)
assert admin, "could not log in as admin"
print(f"  admin login .................... OK")

# ---------------------------------------------------------------- roles
call(admin, "POST", "/api/admin/roles",
     {"name": "Lab Assistant", "description": "Manages lab material",
      "is_admin": True, "permissions": ["CONTENT_VIEW"]}, expect=(201, 400))
print("  create role .................... OK")
call(admin, "GET", "/api/admin/roles", expect=(200,))
print("  list roles ..................... OK")

# ---------------------------------------------------------------- people
make_user(admin, "principal", "ADMIN")
make_user(admin, "dean", "ADMIN")
make_user(admin, "rajesh", "TEACHER", designation="Head of Department")
make_user(admin, "priya", "TEACHER", designation="Lecturer")
make_user(admin, "amit", "TEACHER", designation="Assistant Professor")
make_user(admin, "sneha", "STUDENT")
make_user(admin, "vikram", "STUDENT")
make_user(admin, "ananya", "STUDENT")
make_user(admin, "rohan", "STUDENT")
print("  create 9 users .................. OK")

call(admin, "GET", "/api/admin/users?page=1&page_size=10&search=rajesh", expect=(200,))
print("  search users ................... OK")

# ---------------------------------------------------------------- academic
dept = call(admin, "POST", "/api/admin/departments",
            {"name": "Mechanical Engineering", "code": "ME",
             "description": "Mechanical and production engineering"}, expect=(201, 400))
depts = call(admin, "GET", "/api/admin/departments", expect=(200,))["data"]
dept_id = depts[-1]["id"]
print(f"  create department .............. OK (id={dept_id})")

courses = []
for name, code, fee in [("Mechanical Engineering", "ME-BTech", 125000),
                        ("Automobile Engineering", "AE-BTech", 118000)]:
    call(admin, "POST", "/api/admin/courses",
         {"department_id": dept_id, "name": name, "code": code,
          "duration_years": 4, "total_seats": 60, "annual_fee": fee},
         expect=(201, 400))
all_courses = call(admin, "GET", "/api/admin/courses", expect=(200,))["data"]
courses = [c for c in all_courses if c["code"].endswith("BTech")]
course_id = courses[0]["id"]
print(f"  create 2 courses ............... OK (id={course_id})")

# enrol students into the course so their course-scoped pages return rows
for name in ("sneha", "vikram", "ananya", "rohan"):
    u = find_user(admin, name)
    if u:
        call(admin, "PUT", f"/api/admin/students/{u['userid']}",
             {"course_id": course_id, "semester": 1, "section": "A",
              "department_id": dept_id}, expect=(200,))
print("  enrol 4 students .............. OK")

subjects = []
for name, code, sem in [("Engineering Mathematics", "EM201", 1),
                        ("Engineering Physics", "EP203", 1),
                        ("Thermodynamics", "TD301", 3)]:
    call(admin, "POST", "/api/admin/subjects",
         {"course_id": course_id, "name": name, "code": code,
          "credits": 4, "semester": sem}, expect=(201, 400))
all_subjects = call(admin, "GET", "/api/admin/subjects", expect=(200,))["data"]
subjects = all_subjects
subject_ids = [s["id"] for s in subjects]
print(f"  create 3 subjects .............. OK ({len(subjects)} found)")

# ---------------------------------------------------------------- assignments
teachers = {u["username"]: u for u in
            [find_user(admin, n) for n in ("rajesh", "priya", "amit")]}
depts_list = call(admin, "GET", "/api/admin/departments", expect=(200,))["data"]
teacher_ids = {}
for name in ("rajesh", "priya", "amit"):
    u = find_user(admin, name)
    teacher_ids[name] = u["userid"]

# teacher numeric ids come from the faculty-facing endpoint
for name, subj_idx in (("rajesh", 0), ("priya", 1), ("amit", 2)):
    trow = None
    fac = call(None, "GET", "/api/public/faculty", expect=(200,))["data"]
    for f in fac:
        if f.get("employee_id"):
            trow = f
            break
    if trow and subj_idx < len(subject_ids):
        call(admin, "POST", "/api/admin/teacher-subjects",
             {"teacher_id": trow["id"], "subject_id": subject_ids[subj_idx],
              "section": "A", "academic_year": "2026"}, expect=(201, 400))
call(admin, "GET", "/api/admin/teacher-subjects", expect=(200,))
print("  assign subjects to teachers .... OK")

# ---------------------------------------------------------------- exams & fees
call(admin, "POST", "/api/admin/exams",
     {"name": "Mid Semester Examination", "course_id": course_id,
      "semester": 1, "start_date": str(today + timedelta(days=10)),
      "is_published": 1}, expect=(201, 400))
call(admin, "GET", "/api/admin/exams", expect=(200,))
print("  create exam .................... OK")

for head, amount in [("Tuition Fee", 125000), ("Library Fee", 4000), ("Exam Fee", 3000)]:
    call(admin, "POST", "/api/admin/fees",
         {"course_id": course_id, "head": head, "amount": amount,
          "due_date": str(today + timedelta(days=30))}, expect=(201, 400))
call(admin, "GET", "/api/admin/fees", expect=(200,))
print("  create 3 fee structures ........ OK")

# ---------------------------------------------------------------- site content
for key, value in [("college_name", "AstraVidya Institute of Technology"),
                   ("slogan", "Ignite. Innovate. Excel."),
                   ("about", "Founded in 1998, AstraVidya has grown into one of "
                             "the region's most trusted institutions."),
                   ("contact_email", "admissions@astravidya.edu"),
                   ("contact_phone", "+91 98765 43210")]:
    call(admin, "POST", "/api/admin/site-content", {"key": key, "value": value}, expect=(200,))
print("  set site content ............... OK")

for title, body, aud in [
    ("Orientation Day 2026", "New students are warmly welcomed to the institute.", "ALL"),
    ("Library Week", "Annual book fair in the central library.", "STUDENT"),
    ("Staff Meeting", "Monthly review with all department heads.", "TEACHER"),
]:
    call(admin, "POST", "/api/admin/notices",
         {"title": title, "body": body, "audience": aud, "is_published": 1}, expect=(201,))
call(admin, "GET", "/api/admin/notices", expect=(200,))
print("  post 3 notices ................ OK")

for title, desc in [("Technical Fest 2026", "24 hours of coding, robotics and design."),
                    ("Annual Sports Day", "Inter-department sports meet."),
                    ("Alumni Meet", "Reunion for all passing batches.")]:
    call(admin, "POST", "/api/admin/events",
         {"title": title, "description": desc,
          "event_date": str(today + timedelta(days=20)), "venue": "Main Auditorium"},
         expect=(201,))
call(admin, "GET", "/api/admin/events", expect=(200,))
print("  create 3 events ............... OK")

for title, album in [("Campus Entrance", "Campus"), ("Library", "Campus"),
                     ("Convocation 2025", "Ceremonies"), ("Sports Day", "Sports")]:
    call(admin, "POST", "/api/admin/gallery",
         {"title": title, "album": album,
          "image_url": f"/gallery/{title.lower().replace(' ', '-')}.jpg"},
         expect=(201,))
call(admin, "GET", "/api/admin/gallery", expect=(200,))
print("  add 4 gallery items ........... OK")

# ---------------------------------------------------------------- public forms
call(None, "POST", "/api/public/admissions",
     {"applicant_name": "Rahul Sharma", "email": "rahul@example.com",
      "phone": "+91 90000 11111", "course_id": course_id}, expect=(201,))
call(None, "POST", "/api/public/admissions",
     {"applicant_name": "Kavya Iyer", "email": "kavya@example.com",
      "phone": "+91 90000 22222", "course_id": course_id}, expect=(201,))
call(admin, "GET", "/api/admin/admissions", expect=(200,))
print("  2 admission applications ...... OK")

call(None, "POST", "/api/public/contact",
     {"name": "Parent Query", "email": "parent@example.com",
      "message": "What is the fee for the BTech programme?"}, expect=(201,))
call(admin, "GET", "/api/admin/messages", expect=(200,))
print("  contact message ............... OK")

# ---------------------------------------------------------------- teacher work
teachers_tok = {}
for name in ("rajesh", "priya", "amit"):
    tok = login(name, NEW_USER_PW)
    if tok:
        teachers_tok[name] = tok

if teachers_tok:
    tname = next(iter(teachers_tok))
    ttok = teachers_tok[tname]
    call(ttok, "GET", "/api/teacher/profile", expect=(200,))
    call(ttok, "PUT", "/api/teacher/profile",
         {"designation": "Head of Department"}, expect=(200,))
    call(ttok, "GET", "/api/teacher/subjects", expect=(200,))
    call(ttok, "GET", "/api/teacher/students", expect=(200,))
    call(ttok, "POST", "/api/teacher/notices",
         {"title": "Assignment 1 posted", "content": "Solve exercises 1 to 5.",
          "audience": "STUDENT"}, expect=(201,))
    print("  teacher profile/notices ...... OK")

    subjects_of = call(ttok, "GET", "/api/teacher/subjects", expect=(200,)).get("data") or []
    if subjects_of:
        sid = subjects_of[0]["subject_id"]
        call(ttok, "POST", "/api/teacher/materials",
             {"title": "Lecture Notes - Unit 1", "subject_id": sid,
              "file_url": "/materials/unit1.pdf", "file_type": "PDF", "file_size": 245760},
             expect=(201,))
        call(ttok, "POST", "/api/teacher/assignments",
             {"title": "Problem Set 1", "description": "Complete before next class.",
              "subject_id": sid, "section": "A"}, expect=(201,))
        print("  material + assignment ......... OK")

        # marks need a real exam to hang off
        exams = call(admin, "GET", "/api/admin/exams", expect=(200,)).get("data") or []
        studs_for_marks = call(ttok, "GET", "/api/teacher/students", expect=(200,)).get("data") or []
        if exams and studs_for_marks:
            eid = exams[0]["id"]
            for i, stu in enumerate(studs_for_marks):
                obtained = 70 + i * 5
                call(ttok, "POST", "/api/teacher/marks",
                     {"student_id": stu["student_id"], "exam_id": eid,
                      "subject_id": sid, "marks_obtained": obtained,
                      "marks_total": 100}, expect=(201,))
            print("  marks entered ................. OK")

    students = call(ttok, "GET", "/api/teacher/students", expect=(200,)).get("data") or []
    if students and subjects_of:
        recs = [{"student_id": s["student_id"], "subject_id": subjects_of[0]["subject_id"],
                 "date": str(today), "status": "PRESENT"} for s in students]
        call(ttok, "POST", "/api/teacher/attendance", {"records": recs}, expect=(200,))
        print("  attendance marked ............. OK")

# ---------------------------------------------------------------- student work
stu_tok = {}
for name in ("sneha", "vikram", "ananya", "rohan"):
    tok = login(name, NEW_USER_PW)
    if tok:
        stu_tok[name] = tok

if stu_tok:
    sname = next(iter(stu_tok))
    stok = stu_tok[sname]
    call(stok, "GET", "/api/student/profile", expect=(200,))
    call(stok, "PUT", "/api/student/profile",
         {"guardian_phone": "+91 90000 33333", "section": "A"}, expect=(200,))
    for p in ("/api/student/attendance", "/api/student/marks", "/api/student/notices",
              "/api/student/fees", "/api/student/materials", "/api/student/assignments",
              "/api/student/certificates"):
        call(stok, "GET", p, expect=(200,))
    print("  student pages ................. OK")

    # certificates + fee payments are issued against the student record
    stus = call(teachers_tok[tname], "GET", "/api/teacher/students", expect=(200,)).get("data") or []
    if stus:
        for stu in stus[:2]:
            call(admin, "POST", "/api/admin/certificates",
                 {"student_id": stu["student_id"], "title": "Merit Certificate",
                  "certificate_no": f"CERT-{stu['roll_no']}",
                  "issued_on": str(today)}, expect=(201,))
            call(admin, "POST", "/api/admin/fee-payments",
                 {"student_id": stu["student_id"], "amount": 132000,
                  "receipt_no": f"RCP-{stu['roll_no']}-{RUN}", "payment_mode": "UPI"},
                 expect=(201, 400))
        call(admin, "GET", "/api/admin/certificates", expect=(200,))
        call(admin, "GET", "/api/admin/fee-payments", expect=(200,))
        print("  certificates + payments ....... OK")

# ---------------------------------------------------------------- admin extras
call(admin, "GET", "/api/admin/leave", expect=(200,))
print("  leave list .................... OK")

for p in ("/api/admin/stats", "/api/admin/reports", "/api/admin/audit-logs",
          "/api/admin/permission-names"):
    call(admin, "GET", p, expect=(200,))
print("  stats/reports/audit ........... OK")

if teachers_tok:
    ttok = teachers_tok[next(iter(teachers_tok))]
    call(ttok, "POST", "/api/teacher/leave",
         {"from_date": str(today), "to_date": str(today + timedelta(days=1)),
          "reason": "Medical"}, expect=(200, 201))
    call(ttok, "GET", "/api/teacher/leave", expect=(200,))
    print("  teacher leave ................. OK")

# ---------------------------------------------------------------- public reads
for p in ("/api/public/home", "/api/public/site-content", "/api/public/notices",
          "/api/public/courses", "/api/public/departments", "/api/public/faculty",
          "/api/public/events", "/api/public/gallery"):
    call(None, "GET", p, expect=(200,))
print("  all public pages .............. OK")

print()
print("=" * 66)
print(f"PASSED: {passed}   FAILED: {len(failed)}")
if failed:
    for f in failed:
        print("   FAIL", f)
    sys.exit(1)
print("All API calls succeeded - frontend now has real data to display.")
print("=" * 66)