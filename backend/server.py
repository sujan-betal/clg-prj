import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from src.config.database import college_engine, SessionLocal
from src.config.base import Base
from src.utils.seed import seed_roles
from src.utils.schema_sync import sync_schema
import src.models
from src.modules.auth.auth_routes import router as auth_router
from src.modules.admin.admin_routes import router as admin_router
from src.modules.teacher.teacher_routes import router as teacher_router
from src.modules.student.student_routes import router as student_router
from src.modules.public.public_routes import router as public_router

load_dotenv()

app = FastAPI(title=os.getenv("APP_NAME", "college"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URI", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    async with college_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        added = await sync_schema(conn)
    if added:
        print(f"schema sync: added {len(added)} column(s) -> {', '.join(added)}")
    async with SessionLocal() as session:
        await seed_roles(session)


app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(teacher_router)
app.include_router(student_router)
app.include_router(public_router)


@app.get("/")
async def root():
    return {"success": True, "message": "College API running"}


if __name__ == "__main__":
    import uvicorn
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    uvicorn.run("server:app", host="127.0.0.1", port=int(os.getenv("PORT", 8000)), reload=True)