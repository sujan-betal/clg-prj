from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class UpdateTeacherProfileSchema(BaseModel):
    designation: Optional[str] = Field(None, max_length=60)
    department_id: Optional[UUID] = None


class PostNoticeSchema(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)
    audience: Optional[str] = Field(default="STUDENT")
