"""Router de exámenes — generación, listado, descarga PDF."""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import io

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.exam import ExamGenerateRequest, ExamOut, ExamListOut
from app.services import exam_service
from app.services.pdf_service import generate_exam_pdf

router = APIRouter(prefix="/api/exams", tags=["exams"])


@router.post("/generate", response_model=ExamOut, status_code=201)
def generate_exam(
    request: ExamGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Genera un examen completo usando IA a partir de un temario."""
    return exam_service.generate_and_save_exam(db, request, current_user.id)


@router.get("/", response_model=List[ExamListOut])
def list_exams(
    subject_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lista todos los exámenes del usuario, opcionalmente filtrados por materia."""
    return exam_service.get_user_exams(db, current_user.id, subject_id)


@router.get("/{exam_id}", response_model=ExamOut)
def get_exam(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retorna un examen completo con preguntas."""
    return exam_service.get_exam_by_id(db, exam_id, current_user.id)


@router.get("/{exam_id}/pdf")
def download_exam_pdf(
    exam_id: int,
    include_answers: bool = Query(False, description="Incluir respuestas y rúbrica"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Genera y descarga el PDF del examen."""
    exam = exam_service.get_exam_by_id(db, exam_id, current_user.id)
    pdf_bytes = generate_exam_pdf(exam.raw_json, include_answers=include_answers)

    filename = f"examen_{exam.id}_v{exam.version}.pdf"
    if include_answers:
        filename = f"respuestas_{exam.id}_v{exam.version}.pdf"

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.delete("/{exam_id}", status_code=204)
def delete_exam(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Elimina un examen."""
    from app.models.exam import Exam
    from fastapi import HTTPException
    exam = db.query(Exam).filter(Exam.id == exam_id, Exam.user_id == current_user.id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Examen no encontrado")
    db.delete(exam)
    db.commit()
