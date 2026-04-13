"""
Modelos de Examen y Pregunta.
"""
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, func, JSON, Float
from sqlalchemy.orm import relationship
from app.core.database import Base


class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    difficulty = Column(String(50), nullable=False)      # facil, medio, dificil
    question_types = Column(JSON, nullable=False)         # ["multiple_choice", "desarrollo", "verdadero_falso"]
    total_questions = Column(Integer, nullable=False)
    version = Column(Integer, default=1)                  # Versión del examen (anti-copia)
    raw_json = Column(JSON, nullable=False)               # JSON completo generado por IA
    rubric = Column(JSON, nullable=True)                  # Rúbrica de corrección
    answers = Column(JSON, nullable=True)                 # Respuestas correctas
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    syllabus_id = Column(Integer, ForeignKey("syllabuses.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    subject = relationship("Subject", back_populates="exams")
    syllabus = relationship("Syllabus")
    questions = relationship("Question", back_populates="exam", cascade="all, delete-orphan")


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    question_text = Column(Text, nullable=False)
    question_type = Column(String(50), nullable=False)   # multiple_choice | desarrollo | verdadero_falso
    options = Column(JSON, nullable=True)                 # Opciones para multiple choice
    correct_answer = Column(Text, nullable=True)
    explanation = Column(Text, nullable=True)
    difficulty = Column(String(50), nullable=False)
    embedding = Column(JSON, nullable=True)              # Para evitar repetición de preguntas
    points = Column(Float, default=1.0)
    order_num = Column(Integer, default=0)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    exam = relationship("Exam", back_populates="questions")
