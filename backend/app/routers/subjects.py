"""Router de materias y temarios."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.subject import Subject
from app.models.syllabus import Syllabus
from app.schemas.subject import SubjectCreate, SubjectOut, SyllabusCreate, SyllabusOut
from app.services.openai_service import get_embedding

router = APIRouter(prefix="/api/subjects", tags=["subjects"])


# ─── Materias ────────────────────────────────────────────────────

@router.post("/", response_model=SubjectOut, status_code=status.HTTP_201_CREATED)
def create_subject(
    data: SubjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subject = Subject(**data.model_dump(), user_id=current_user.id)
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


@router.get("/", response_model=List[SubjectOut])
def list_subjects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Subject).filter(Subject.user_id == current_user.id).all()


@router.get("/{subject_id}", response_model=SubjectOut)
def get_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subject = db.query(Subject).filter(
        Subject.id == subject_id, Subject.user_id == current_user.id
    ).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Materia no encontrada")
    return subject


@router.delete("/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subject = db.query(Subject).filter(
        Subject.id == subject_id, Subject.user_id == current_user.id
    ).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Materia no encontrada")
    db.delete(subject)
    db.commit()


# ─── Temarios ────────────────────────────────────────────────────

@router.post("/{subject_id}/syllabuses", response_model=SyllabusOut, status_code=status.HTTP_201_CREATED)
def create_syllabus(
    subject_id: int,
    data: SyllabusCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Carga un temario y genera su embedding automáticamente."""
    subject = db.query(Subject).filter(
        Subject.id == subject_id, Subject.user_id == current_user.id
    ).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Materia no encontrada")

    # Generar embedding del temario completo para búsqueda semántica futura
    embedding = None
    try:
        embedding = get_embedding(data.content[:8000])  # Límite de tokens
    except Exception as e:
        pass  # Continuar sin embedding si falla

    syllabus = Syllabus(
        title=data.title,
        content=data.content,
        embedding=embedding,
        subject_id=subject_id,
    )
    db.add(syllabus)
    db.commit()
    db.refresh(syllabus)
    return syllabus


@router.get("/{subject_id}/syllabuses", response_model=List[SyllabusOut])
def list_syllabuses(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subject = db.query(Subject).filter(
        Subject.id == subject_id, Subject.user_id == current_user.id
    ).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Materia no encontrada")

    return db.query(Syllabus).filter(Syllabus.subject_id == subject_id).all()


@router.get("/{subject_id}/syllabuses/{syllabus_id}", response_model=SyllabusOut)
def get_syllabus(
    subject_id: int,
    syllabus_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    syllabus = db.query(Syllabus).join(Subject).filter(
        Syllabus.id == syllabus_id,
        Syllabus.subject_id == subject_id,
        Subject.user_id == current_user.id,
    ).first()
    if not syllabus:
        raise HTTPException(status_code=404, detail="Temario no encontrado")
    return syllabus
