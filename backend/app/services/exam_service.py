"""
Servicio de generación de exámenes.
Orquesta embeddings, IA y persistencia con lógica anti-repetición.
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.exam import Exam, Question
from app.models.syllabus import Syllabus
from app.models.subject import Subject
from app.schemas.exam import ExamGenerateRequest
from app.services import openai_service


def get_existing_questions_summary(
    db: Session,
    syllabus_id: int,
    limit: int = 30,
) -> Optional[str]:
    """
    Obtiene un resumen de preguntas previas del mismo temario
    para indicarle a la IA qué temas ya fueron cubiertos.
    """
    existing_exams = (
        db.query(Exam)
        .filter(Exam.syllabus_id == syllabus_id)
        .order_by(Exam.created_at.desc())
        .limit(5)
        .all()
    )

    if not existing_exams:
        return None

    summaries = []
    for exam in existing_exams:
        for q in exam.questions[:limit]:
            summaries.append(f"- {q.question_text}")

    if not summaries:
        return None

    return "\n".join(summaries[:limit])


def get_existing_question_embeddings(db: Session, syllabus_id: int) -> List[List[float]]:
    """Obtiene embeddings de preguntas previas para comparación semántica."""
    existing_exams = (
        db.query(Exam)
        .filter(Exam.syllabus_id == syllabus_id)
        .all()
    )

    embeddings = []
    for exam in existing_exams:
        for q in exam.questions:
            if q.embedding:
                embeddings.append(q.embedding)

    return embeddings


def generate_and_save_exam(
    db: Session,
    request: ExamGenerateRequest,
    user_id: int,
) -> Exam:
    """
    Flujo completo:
    1. Valida temario y materia
    2. Busca preguntas previas para evitar repetición
    3. Genera examen con IA
    4. Guarda embeddings de preguntas
    5. Persiste en DB
    """
    # Validar que el temario existe y pertenece al usuario
    syllabus = db.query(Syllabus).filter(Syllabus.id == request.syllabus_id).first()
    if not syllabus:
        raise HTTPException(status_code=404, detail="Temario no encontrado")

    subject = db.query(Subject).filter(
        Subject.id == syllabus.subject_id,
        Subject.user_id == user_id,
    ).first()
    if not subject:
        raise HTTPException(status_code=403, detail="No tienes acceso a este temario")

    # Obtener preguntas previas para evitar repetición
    existing_summary = get_existing_questions_summary(db, syllabus.id)
    existing_embeddings = get_existing_question_embeddings(db, syllabus.id)

    # Determinar versión (para exámenes anti-copia)
    version = 1
    if request.generate_variant:
        last_exam = (
            db.query(Exam)
            .filter(Exam.syllabus_id == syllabus.id)
            .order_by(Exam.version.desc())
            .first()
        )
        if last_exam:
            version = last_exam.version + 1

    # Generar examen con IA
    exam_json = openai_service.generate_exam_with_ai(
        syllabus_content=syllabus.content,
        subject_name=subject.name,
        educational_level=subject.educational_level,
        difficulty=request.difficulty,
        total_questions=request.total_questions,
        question_types=request.question_types,
        existing_questions_summary=existing_summary,
        is_variant=request.generate_variant,
    )

    # Título automático si no se proporcionó
    title = request.title or exam_json.get("exam_title", f"Examen de {subject.name}")

    # Crear objeto Exam
    exam = Exam(
        title=title,
        difficulty=request.difficulty,
        question_types=request.question_types,
        total_questions=request.total_questions,
        version=version,
        raw_json=exam_json,
        rubric=exam_json.get("rubric"),
        answers=exam_json.get("answer_key"),
        subject_id=subject.id,
        syllabus_id=syllabus.id,
        user_id=user_id,
    )
    db.add(exam)
    db.flush()  # Para obtener exam.id antes de commit

    # Crear preguntas individuales y sus embeddings
    questions_data = exam_json.get("questions", [])
    for q_data in questions_data:
        q_text = q_data.get("question", "")

        # Generar embedding de la pregunta
        q_embedding = None
        try:
            q_embedding = openai_service.get_embedding(q_text)
        except Exception:
            pass  # Embedding opcional — no bloquear si falla

        question = Question(
            question_text=q_text,
            question_type=q_data.get("type", "multiple_choice"),
            options=q_data.get("options"),
            correct_answer=q_data.get("correct_answer"),
            explanation=q_data.get("explanation"),
            difficulty=q_data.get("difficulty", request.difficulty),
            embedding=q_embedding,
            points=float(q_data.get("points", 1.0)),
            order_num=q_data.get("order", 0),
            exam_id=exam.id,
        )
        db.add(question)

    db.commit()
    db.refresh(exam)
    return exam


def get_user_exams(db: Session, user_id: int, subject_id: Optional[int] = None) -> List[Exam]:
    query = db.query(Exam).filter(Exam.user_id == user_id)
    if subject_id:
        query = query.filter(Exam.subject_id == subject_id)
    return query.order_by(Exam.created_at.desc()).all()


def get_exam_by_id(db: Session, exam_id: int, user_id: int) -> Exam:
    exam = db.query(Exam).filter(Exam.id == exam_id, Exam.user_id == user_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Examen no encontrado")
    return exam
