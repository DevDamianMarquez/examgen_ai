"""Schemas de Subject y Syllabus."""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class SubjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    educational_level: str


class SubjectOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    educational_level: str
    user_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class SyllabusCreate(BaseModel):
    title: str
    content: str
    subject_id: int


class SyllabusOut(BaseModel):
    id: int
    title: str
    content: str
    subject_id: int
    created_at: datetime

    model_config = {"from_attributes": True}
