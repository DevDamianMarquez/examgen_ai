"""
ExamGen AI — Backend principal.
Inicializa FastAPI, CORS, rutas y crea las tablas en DB.
"""
from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import engine, Base
from app.routers import auth, subjects, exams

# Importar todos los modelos para que SQLAlchemy los registre
import app.models  # noqa: F401

import os
print(repr(os.getenv("DATABASE_URL")))

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Crea tablas al arrancar (útil en desarrollo; en producción usar Alembic)."""
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="ExamGen AI",
    description="Generador inteligente de exámenes para profesores y academias",
    version="1.0.0",
    lifespan=lifespan,
)

# ─── CORS ─────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(subjects.router)
app.include_router(exams.router)


@app.get("/health")
def health_check():
    return {"status": "ok", "version": "1.0.0"}
