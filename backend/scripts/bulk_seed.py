"""
Bulk-inserts a large volume of realistic data through the HTTP API only.

    python backend/scripts/bulk_seed.py

Safe to re-run: existing rows are matched by their natural key and left alone,
so running it twice does not duplicate anything.

What it creates (roughly):
    ~100 students, ~40 teachers, ~12 departments, ~24 courses,
    ~150 subjects, plus exams, fees, notices, events and gallery items.
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

random.seed(7)
today = date.today()

created = 0
skipped = 0


def call(token, method, path, body=None, expect=(200, 201)):
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


def request(token, method, path, body=None):
    """Any write that is allowed to fail with 400 (already exists)."""
    global created, skipped
    status, payload = call(token, method, path, body, expect=(200, 201))
    if status in (200, 201):
        created += 1
    else:
        skipped += 1
    return payload


def post(token, path, body):
    return request(token, "POST", path, body)


def put(token, path, body):
    return request(token, "PUT", path, body)


def login(username, password):
    _, r = call(None, "POST", "/api/auth/login",
                {"username": username, "password": password}, expect=(200,))
    return (r.get("data") or {}).get("access_token")


def get_list(path, key=None, token=None):
    _, r = call(token, "GET", path, expect=(200,))
    data = r.get("data")
    if isinstance(data, dict) and key:
        return data.get(key) or []
    return data or []


# ------------------------------------------------------------------ vocab

FIRST = [
    "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Krishna",
    "Ishaan", "Rohan", "Kabir", "Devansh", "Rudra", "Yash", "Karan", "Nikhil",
    "Ananya", "Diya", "Aadhya", "Saanvi", "Riya", "Ishita", "Myra", "Sara",
    "Priya", "Neha", "Kavya", "Meera", "Sneha", "Pooja", "Anjali", "Shreya",
    "Rahul", "Amit", "Suresh", "Manoj", "Vijay", "Ramesh", "Karthik", "Nikhil",
]

LAST = [
    "Sharma", "Verma", "Patel", "Reddy", "Nair", "Iyer", "Singh", "Gupta",
    "Mehta", "Joshi", "Kulkarni", "Desai", "Chowdhury", "Bose", "Kapoor",
    "Malhotra", "Bhatt", "Chauhan", "Rao", "Menon",
]

DESIGNATIONS = [
    "Head of Department", "Professor", "Associate Professor",
    "Assistant Professor", "Lecturer", "Lab Instructor", "Visiting Faculty",
]

DEPARTMENTS = [
    ("Mechanical Engineering", "ME", "Design, manufacture and thermal systems."),
    ("Computer Science & Engineering", "CSE", "Software, algorithms and systems."),
    ("Electrical Engineering", "EE", "Power systems, control and electronics."),
    ("Civil Engineering", "CE", "Structures, geotechnics and transport."),
    ("Business Administration", "BBA", "Management, finance and marketing."),
    ("Electronics & Communication", "ECE", "Signals, embedded systems and networks."),
    ("Biotechnology", "BT", "Genetic engineering and process technology."),
    ("Mathematics", "MA", "Pure and applied mathematics."),
]

COURSE_SUFFIX = ["B.Tech", "B.E.", "BBA", "B.Sc", "M.Tech", "MBA", "BCA", "M.Sc"]

# Each department only offers degrees that make sense for it, otherwise the
# catalogue fills up with nonsense like "Civil Engineering (BBA)".
DEPT_COURSES = {
    "ME": ["B.Tech", "M.Tech"],
    "CSE": ["B.Tech", "M.Tech", "BCA"],
    "EE": ["B.Tech", "M.Tech"],
    "CE": ["B.Tech", "M.Tech"],
    "BBA": ["BBA", "MBA"],
    "ECE": ["B.Tech", "M.Tech"],
    "BT": ["B.Sc", "M.Sc", "B.Tech"],
    "MA": ["B.Sc", "M.Sc"],
}

SUBJECT_POOL = [
    "Engineering Mathematics", "Data Structures", "Digital Logic", "Thermodynamics",
    "Fluid Mechanics", "Organic Chemistry", "Signals & Systems", "Microeconomics",
    "Probability & Statistics", "Machine Learning", "Control Systems", "Structural Analysis",
    "Database Management Systems", "Computer Networks", "Analytical Mechanics",
    "Environmental Science", "Business Finance", "Operations Research", "Discrete Mathematics",
    "Software Engineering", "Heat Transfer", "Power Electronics", "Surveying",
    "Marketing Management", "Human Resource Management", "Organic Chemistry II",
    "Numerical Methods", "Compiler Design", "Electrical Measurements", "Mechanics of Solids",
    "Biostatistics", "Molecular Biology", "Financial Accounting", "Web Technologies",
]

EVENTS = [
    ("Orientation Day", "Welcome ceremony for the new intake.", "Main Auditorium"),
    ("Technical Fest", "24 hours of coding, robotics and design.", "Central Block"),
    ("Annual Sports Day", "Inter-department sports meet.", "Sports Ground"),
    ("Alumni Meet", "Reunion for all passing batches.", "Seminar Hall"),
    ("Industry Guest Lecture", "Alumni from a product company speak to students.", "Lecture Hall 2"),
    ("Science Exhibition", "Student projects on display.", "Exhibition Grounds"),
    ("Cultural Night", "Music, dance and drama by the cultural club.", "Open Air Theatre"),
    ("Blood Donation Camp", "Organised with the city blood bank.", "College Gate"),
    ("Hackathon Weekend", "48-hour build sprint with mentors on site.", "Computer Lab"),
    ("Convocation Ceremony", "Graduation for the outgoing batch.", "Main Auditorium"),
    ("Placement Drive", "Recruitment by twelve visiting companies.", "Placement Cell"),
    ("Departmental Seminar", "Faculty research presentations.", "Seminar Hall"),
]

GALLERY = [
    ("Campus Entrance", "Campus"), ("Central Library", "Campus"),
    ("Convocation Hall", "Ceremonies"), ("Sports Ground", "Sports"),
    ("Computer Lab", "Academics"), ("Workshop", "Academics"),
    ("Annual Day", "Events"), ("Science Exhibition", "Events"),
    ("Cultural Night", "Events"), ("Alumni Meet", "Events"),
    ("Placement Drive", "Events"), ("Campus Garden", "Campus"),
]

NOTICES = [
    ("Semester exam timetable published", "The detailed timetable is now on the portal."),
    ("Library week schedule", "Annual book fair in the central library."),
    ("Fee payment deadline", "Pay the semester fee before the due date."),
    ("Holiday notice", "The college will remain closed on the public holiday."),
    ("Hackathon registrations open", "Register in pairs before the closing date."),
    ("Placement drive list", "Twelve companies will visit campus next month."),
    ("Hostel allotment", "Hostel allotment for the new session has started."),
    ("Sports trial results", "Trials for the annual sports day are concluded."),
    ("NPTEL registration", "Free online courses are open for registration."),
    ("Anti-ragging drive", "Report ragging immediately to the student helpline."),
    ("Guest lecture series", "A guest lecture on industry trends this week."),
    ("Annual day volunteers", "Volunteer for the annual day committees."),
    ("Bus route change", "Route 3 now starts from the eastern gate."),
    ("Examination hall allotment", "Check your hall ticket for the seat number."),
    ("Blood donation camp", "Donate blood at the college gate this Saturday."),
    ("Course registration opens", "Course registration for the next semester opens."),
    ("Discipline committee notice", "Vandalism will attract strict action."),
    ("Science lab safety", "Safety guidelines for the chemistry laboratories."),
    ("Alumni donations", "Alumni can contribute to the scholarship fund."),
    ("Class representative meeting", "Monthly meeting with all class representatives."),
]


def person_username(first, last, n):
    return f"{first.lower()}{last.lower()}{n}"


def main():
    print("=" * 66)
    print("BULK SEEDING VIA THE API")
    print("=" * 66)

    admin = login("admin", ADMIN_PW)
    if not admin:
        print("Could not log in as admin. Run scripts/create_admin.py first.")
        sys.exit(1)
    print(f"  admin login .................... OK")

    # ------------------------------------------------------------ people
    # Build a name pool big enough for ~140 unique accounts.
    pool = []
    for first in FIRST:
        for last in LAST:
            pool.append((first, last))
    random.shuffle(pool)

    teacher_count, student_count = 40, 100
    people = []
    for i in range(teacher_count + student_count):
        first, last = pool[i % len(pool)]
        people.append({
            "username": person_username(first, last, i + 1),
            "email": f"{person_username(first, last, i + 1)}@astravidya.edu",
            "first": first,
            "last": last,
            "role": "TEACHER" if i < teacher_count else "STUDENT",
        })

    # ------------------------------------------------------------ academic structure
    dept_ids = {}
    for name, code, desc in DEPARTMENTS:
        post(admin, "/api/admin/departments", {"name": name, "code": code, "description": desc})
    for d in get_list("/api/admin/departments", token=admin):
        dept_ids[d["code"]] = d["id"]
    print(f"  departments .................... {len(dept_ids)}")

    # Every department gets the degrees it actually offers.
    dept_list = list(dept_ids.items())
    course_ids = []
    for code, did in dept_list:
        base = next(d[0] for d in DEPARTMENTS if d[1] == code)
        for suffix in DEPT_COURSES.get(code, COURSE_SUFFIX[:3]):
            cname = f"{base} ({suffix})"
            ccode = f"{code}-{suffix.split('.')[0].upper()}"
            post(admin, "/api/admin/courses", {
                "department_id": did,
                "name": cname,
                "code": ccode,
                "duration_years": 4 if "Tech" in suffix or "B.E" in suffix else 3,
                "total_seats": random.choice([40, 60, 60, 120]),
                "annual_fee": random.choice([45000, 75000, 95000, 125000, 180000]),
            })
    for c in get_list("/api/admin/courses", token=admin):
        course_ids.append(c)
    print(f"  courses ........................ {len(course_ids)}")

    # ---------------------------------------------------------- subjects
    # Ids are UUIDs now, so index the pool by position rather than by id value.
    for course_index, c in enumerate(course_ids):
        for i in range(5):
            post(admin, "/api/admin/subjects", {
                "course_id": c["id"],
                "name": SUBJECT_POOL[(course_index * 5 + i) % len(SUBJECT_POOL)],
                "code": f"{c['code']}-{100 + i}",
                "credits": random.choice([3, 4, 4, 5]),
                "semester": (i % 4) + 1,
            })
    all_subjects = get_list("/api/admin/subjects", token=admin)
    print(f"  subjects ....................... {len(all_subjects)}")

    # ------------------------------------------------------------- users
    for p in people:
        post(admin, "/api/admin/users", {
            "username": p["username"],
            "email": p["email"],
            "role": p["role"],
            "status": "ACTIVE",
            "designation": random.choice(DESIGNATIONS) if p["role"] == "TEACHER" else None,
            "department_id": random.choice(list(dept_ids.values())),
        })

    # The users endpoint caps page_size at 100, so walk every page.
    users = []
    page = 1
    while True:
        batch = get_list(f"/api/admin/users?page={page}&page_size=100", token=admin)
        if not batch:
            break
        users.extend(batch)
        if len(batch) < 100:
            break
        page += 1
    by_username = {u["username"]: u for u in users}
    print(f"  users .......................... {len(users)}")

    student_rows = [p for p in people if p["role"] == "STUDENT" and p["username"] in by_username]

    # Enrol every student so their course-scoped pages return rows.
    for p in student_rows:
        u = by_username.get(p["username"])
        if not u:
            continue
        course = random.choice(course_ids)
        put(admin, f"/api/admin/students/{u['userid']}", {
            "course_id": course["id"],
            "department_id": course["department_id"],
            "semester": random.randint(1, 4),
            "section": random.choice(["A", "B", "C"]),
        })
    print(f"  students enrolled .............. {len(student_rows)}")

    # Every teacher teaches a few subjects, and every course gets covered so
    # each student's course-scoped pages have something to show.
    faculty = get_list("/api/public/faculty")
    if faculty and all_subjects:
        subjects_by_course = {}
        for s in all_subjects:
            subjects_by_course.setdefault(s["course_id"], []).append(s)

        for t in faculty:
            for _ in range(3):
                s = random.choice(all_subjects)
                post(admin, "/api/admin/teacher-subjects", {
                    "teacher_id": t["id"],
                    "subject_id": s["id"],
                    "section": random.choice(["A", "B", "C"]),
                    "academic_year": "2026",
                })

        # Guarantee at least one teacher per course, otherwise a course with no
        # staff has no materials, assignments or attendance for its students.
        for course in course_ids:
            pool = subjects_by_course.get(course["id"]) or []
            if not pool:
                continue
            for _ in range(2):
                post(admin, "/api/admin/teacher-subjects", {
                    "teacher_id": random.choice(faculty)["id"],
                    "subject_id": random.choice(pool)["id"],
                    "section": random.choice(["A", "B", "C"]),
                    "academic_year": "2026",
                })
    print(f"  faculty ....................... {len(faculty)}")

    # ---------------------------------------------------------- exams, fees
    for c in course_ids[:12]:
        post(admin, "/api/admin/exams", {
            "name": "Mid Semester Examination",
            "course_id": c["id"],
            "semester": random.randint(1, 4),
            "start_date": str(today + timedelta(days=random.randint(5, 30))),
            "is_published": 1,
        })
        post(admin, "/api/admin/exams", {
            "name": "End Semester Examination",
            "course_id": c["id"],
            "semester": random.randint(1, 4),
            "start_date": str(today + timedelta(days=random.randint(40, 90))),
            "is_published": 1,
        })
        for head, amount in [("Tuition Fee", random.choice([90000, 125000, 150000])),
                             ("Library Fee", 4000), ("Exam Fee", 3000),
                             ("Laboratory Fee", 7500)]:
            post(admin, "/api/admin/fees", {
                "course_id": c["id"],
                "head": head,
                "amount": amount,
                "due_date": str(today + timedelta(days=45)),
            })
    print(f"  exams + fee structures ......... {len(course_ids[:12])} courses")

    # --------------------------------------------------------- site content
    for key, value in [
        ("college_name", "AstraVidya Institute of Technology"),
        ("slogan", "Ignite. Innovate. Excel."),
        ("established", "1998"),
        ("about_title", "About AstraVidya"),
        ("about", "Founded in 1998, AstraVidya has grown into one of the region's "
                  "most trusted institutions, known for hands-on engineering "
                  "education, a strong research culture, and consistent industry "
                  "placement across every program."),
        ("about_vision", "To be a centre of learning where every student leaves "
                         "with the skills and confidence to build what the world "
                         "needs next."),
        ("about_mission", "To teach engineering with rigour and curiosity, run "
                          "labs that mirror industry practice, and place every "
                          "graduate into work they are proud of."),
        ("about_achievements", "NAAC A++ accredited, 92% placement for the last "
                               "three graduating batches, and 40+ research papers "
                               "published every year."),
        ("about_legacy", "Alumni in 30 countries, founding partners of twelve "
                         "technology companies, and hosts of the regional "
                         "engineering olympiad since 2006."),
        ("contact_intro", "Questions about admissions, fees, or campus visits? "
                          "We usually reply within one working day."),
        ("contact_email", "admissions@astravidya.edu"),
        ("contact_phone", "+91 98765 43210"),
        ("address", "AstraVidya Campus, Ring Road, Bengaluru 560001"),
    ]:
        post(admin, "/api/admin/site-content", {"key": key, "value": value})
    print("  site content ................... OK")

    # ------------------------------------------------- notices / events / gallery
    for title, body in NOTICES:
        post(admin, "/api/admin/notices", {
            "title": title,
            "body": body,
            "audience": random.choice(["ALL", "ALL", "STUDENT", "TEACHER"]),
            "is_published": 1,
        })

    for title, desc, venue in EVENTS:
        post(admin, "/api/admin/events", {
            "title": title,
            "description": desc,
            "event_date": str(today + timedelta(days=random.randint(3, 120))),
            "venue": venue,
        })

    for title, album in GALLERY:
        post(admin, "/api/admin/gallery", {
            "title": title,
            "album": album,
            "image_url": f"/gallery/{title.lower().replace(' ', '-')}.jpg",
        })
    print(f"  notices/events/gallery ......... {len(NOTICES)}/{len(EVENTS)}/{len(GALLERY)}")

    # ------------------------------------------------------ public form traffic
    for i in range(12):
        first, last = random.choice(FIRST), random.choice(LAST)
        post(None, "/api/public/admissions", {
            "applicant_name": f"{first} {last}",
            "email": f"{first.lower()}.{last.lower()}{i}@example.com",
            "phone": f"+91 9{random.randint(100000000, 999999999)}",
            "course_id": random.choice(course_ids)["id"],
        })
    for i in range(8):
        first, last = random.choice(FIRST), random.choice(LAST)
        post(None, "/api/public/contact", {
            "name": f"{first} {last}",
            "email": f"{first.lower()}{i}@example.com",
            "message": "I would like to know the fee structure and admission dates.",
        })
    print("  admissions + contact messages .. 12 / 8")

    print()
    print("=" * 66)
    print(f"created {created}, skipped {skipped} (already existed)")
    for path, label in [
        ("/api/public/home", "home stats"),
        ("/api/public/courses", "courses/programs"),
        ("/api/public/departments", "departments"),
        ("/api/public/faculty", "faculty"),
        ("/api/public/notices", "notices"),
        ("/api/public/events", "events"),
        ("/api/public/gallery", "gallery"),
    ]:
        data = get_list(path)
        n = data.get("stats") if isinstance(data, dict) else len(data)
        print(f"   {label:20s} {n if n is not None else len(data)}")
    print("=" * 66)


if __name__ == "__main__":
    main()