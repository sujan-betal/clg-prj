import psycopg2
from sqlalchemy import create_engine, inspect

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.config.base import Base
import src.models  # noqa: F401  (registers all mappers on Base)

engine = create_engine("postgresql+psycopg2://admin:admin@localhost:5432/clg-project")
insp = inspect(engine)

problems = []

for table in Base.metadata.sorted_tables:
    name = table.name
    if not insp.has_table(name):
        problems.append(f"MISSING TABLE: {name}")
        continue
    actual = {c["name"] for c in insp.get_columns(name)}
    for col in table.columns:
        if col.name not in actual:
            problems.append(f"MISSING COLUMN: {name}.{col.name}")

print("\n".join(problems) if problems else "schema in sync")
print(f"\n{len(problems)} problem(s)")