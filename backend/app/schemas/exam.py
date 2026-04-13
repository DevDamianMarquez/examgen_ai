"""Schemas de Examen."""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Any


class ExamGenerateRequest(BaseModel):
    syllabus_id: int
    difficulty: str = Field(..., pattern="^(facil|medio|dificil)$")
    total_questions: int = Field(..., ge=3, le=50)
    question_types: List[str]  # ["multiple_choice", "desarrollo", "verdadero_falso"]
    title: Optional[str] = None
    generate_variant: bool = False  # Si True, genera versión alternativa anti-copia


class QuestionOut(BaseModel):
    id: int
    question_text: str
    question_type: str
    options: Optional[List[str]]
    correct_answer: Optional[str]
    explanation: Optional[str]
    difficulty: str
    points: float
    order_num: int

    model_config = {"from_attributes": True}


class ExamOut(BaseModel):
    id: int
    title: str
    difficulty: str
    question_types: List[str]
    total_questions: int
    version: int
    raw_json: Any
    rubric: Optional[Any]
    answers: Optional[Any]
    subject_id: int
    syllabus_id: Optional[int]
    created_at: datetime
    questions: List[QuestionOut] = []

    model_config = {"from_attributes": True}


class ExamListOut(BaseModel):
    id: int
    title: str
    difficulty: str
    total_questions: int
    version: int
    subject_id: int
    created_at: datetime

    model_config = {"from_attributes": True}
