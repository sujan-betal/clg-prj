from pydantic import BaseModel, Field
from typing import Optional
from datetime import date as date_type


class UpdateStudentProfileSchema(BaseModel):
    guardian_phone: Optional[str] = Field(None, max_length=20)
    section: Optional[str] = Field(None, max_length=10)


class LeaveApplySchema(BaseModel):
    from_date: date_type
    to_date: date_type
    reason: Optional[str] = None
