import psycopg2

TABLES = [
    "users", "roles", "students", "teachers", "departments", "courses", "subjects",
    "notices", "events", "gallery_items", "site_contents", "exams", "assignments",
    "attendance", "marks", "fee_structures", "fee_payments", "certificates",
    "study_materials", "leave_requests", "admission_applications", "contact_messages",
    "audit_logs", "user_permissions", "teacher_subjects",
]

c = psycopg2.connect(host="localhost", port=5432, user="admin", password="admin", dbname="clg-project")
cur = c.cursor()
for t in TABLES:
    cur.execute(f"select count(*) from {t}")
    print(f"{t:24} {cur.fetchone()[0]}")

cur.execute("select key, value from site_contents order by key")
print("\n--- site_contents ---")
for k, v in cur.fetchall():
    print(f"  {k} = {str(v)[:70]}")