"""
Modelo de Temario.
Almacena el texto del temario y sus embeddings serializados como JSON.
"""
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, func, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class Syllabus(Base):
    __tablename__ = "syllabuses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)           # Texto completo del temario
    embedding = Column(JSON, nullable=True)          # Vector de embedding serializado
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    subject = relationship("Subject", back_populates="syllabuses")
