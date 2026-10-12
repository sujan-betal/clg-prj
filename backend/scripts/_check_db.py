import psycopg2

c = psycopg2.connect(host="localhost", port=5432, user="admin", password="admin", dbname="clg-project")
cur = c.cursor()
cur.execute("select current_database(), current_user")
print(cur.fetchone())
cur.execute("select table_name from information_schema.tables where table_schema='public' order by 1")
for (t,) in cur.fetchall():
    print(t)