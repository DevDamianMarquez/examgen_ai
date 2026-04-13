# ExamGen AI 🎓

**Generador inteligente de exámenes para profesores y academias.**

La IA genera exámenes completos con preguntas, respuestas correctas y rúbrica de corrección a partir de cualquier temario.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | Python · FastAPI · SQLAlchemy · PostgreSQL |
| IA | OpenAI GPT-4o · Embeddings (text-embedding-3-small) |
| Frontend | React · Vite · TailwindCSS · Axios · Zustand |
| Infra | Docker · Docker Compose · Nginx |

---

## Estructura del proyecto

```
examgen-ai/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py          # Settings con pydantic-settings
│   │   │   ├── database.py        # Engine y sesión SQLAlchemy
│   │   │   └── security.py        # JWT + password hashing
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── subject.py
│   │   │   ├── syllabus.py        # Temario + embedding JSON
│   │   │   └── exam.py            # Exam + Question con embeddings
│   │   ├── schemas/
│   │   │   ├── user.py
│   │   │   ├── subject.py
│   │   │   └── exam.py
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── subjects.py        # Materias + temarios
│   │   │   └── exams.py           # Generación + PDF download
│   │   ├── services/
│   │   │   ├── openai_service.py  # Prompts + embeddings + generación
│   │   │   ├── exam_service.py    # Orquestación + anti-repetición
│   │   │   └── pdf_service.py     # ReportLab PDF profesional
│   │   └── main.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── SubjectsPage.jsx
│   │   │   ├── SubjectDetailPage.jsx
│   │   │   ├── SyllabusPage.jsx
│   │   │   ├── GenerateExamPage.jsx
│   │   │   └── ExamViewPage.jsx
│   │   ├── components/layout/Layout.jsx
│   │   ├── services/api.js        # Axios con interceptores JWT
│   │   └── store/authStore.js     # Zustand auth state
│   ├── Dockerfile
│   └── nginx.conf
└── docker-compose.yml
```

---

## Instalación y uso

### Opción 1 — Docker Compose (recomendado)

```bash
# 1. Clonar y entrar al proyecto
git clone <repo> examgen-ai && cd examgen-ai

# 2. Configurar variables de entorno del backend
cp backend/.env.example backend/.env
# Editar backend/.env y agregar tu OPENAI_API_KEY

# 3. Levantar todo
docker-compose up --build

# Frontend:  http://localhost:5173
# Backend:   http://localhost:8000
# API Docs:  http://localhost:8000/docs
```

### Opción 2 — Desarrollo local

**Backend**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Editar .env con tu OPENAI_API_KEY y DATABASE_URL

# Asegurate de tener PostgreSQL corriendo, luego:
uvicorn app.main:app --reload --port 8000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
# Disponible en http://localhost:5173
```

---

## Variables de entorno (backend/.env)

```env
# Base de datos PostgreSQL
DATABASE_URL=postgresql://examgen:examgen_pass@localhost:5432/examgen_db

# JWT — cambiar en producción
SECRET_KEY=genera-una-clave-aleatoria-de-minimo-32-caracteres
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# OpenAI — OBLIGATORIO
OPENAI_API_KEY=sk-tu-clave-aqui
OPENAI_MODEL=gpt-4o
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# CORS
CORS_ORIGINS=http://localhost:5173
```

---

## API Reference

### Auth
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/register` | Registro de usuario |
| POST | `/api/auth/login` | Login → retorna JWT |

### Materias
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/subjects/` | Listar materias del usuario |
| POST | `/api/subjects/` | Crear materia |
| DELETE | `/api/subjects/{id}` | Eliminar materia |
| POST | `/api/subjects/{id}/syllabuses` | Cargar temario + generar embedding |
| GET | `/api/subjects/{id}/syllabuses` | Listar temarios |

### Exámenes
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/exams/generate` | **Generar examen con IA** |
| GET | `/api/exams/` | Listar exámenes |
| GET | `/api/exams/{id}` | Ver examen completo |
| GET | `/api/exams/{id}/pdf` | Descargar PDF |
| GET | `/api/exams/{id}/pdf?include_answers=true` | PDF con respuestas y rúbrica |

### Payload para generar examen

```json
{
  "syllabus_id": 1,
  "difficulty": "medio",
  "total_questions": 10,
  "question_types": ["multiple_choice", "desarrollo", "verdadero_falso"],
  "title": "Examen Unidad 2 (opcional)",
  "generate_variant": false
}
```

---

## Funcionalidad IA

### Generación de exámenes
- Prompt optimizado con contexto pedagógico completo
- Genera JSON estructurado con: preguntas, respuestas, explicaciones, rúbrica, escala de calificación
- Soporta 3 tipos: opción múltiple, desarrollo, verdadero/falso
- 3 niveles de dificultad con instrucciones diferenciadas para la IA
- Versiones alternativas anti-copia con reformulación automática

### Sistema anti-repetición con embeddings
1. Al cargar un temario → se genera su embedding con `text-embedding-3-small`
2. Al generar cada pregunta → se genera su embedding individual
3. Al generar un nuevo examen del mismo temario:
   - Se incluye en el prompt un resumen de preguntas anteriores
   - El sistema usa similitud coseno (threshold 0.88) para detectar duplicados semánticos
   - La IA recibe instrucción explícita de evitar esos temas/enfoques

### PDF profesional
- Generado con ReportLab
- Versión alumno: solo preguntas, espacio para respuestas
- Versión docente: incluye respuestas correctas + rúbrica completa + escala de calificación
- Campos para nombre, curso, fecha y calificación

---

## Flujo de uso

```
1. Registrarse / Iniciar sesión
2. Crear materia (ej: "Física", nivel "Universitario")
3. Cargar temario (texto libre — unidades, conceptos, temas)
   → El sistema genera embeddings automáticamente
4. Generar examen:
   → Seleccionar dificultad, cantidad, tipos de preguntas
   → Opcionalmente: generar versión alternativa anti-copia
5. Ver examen generado con todas las preguntas
6. Descargar PDF:
   → Sin respuestas (para el alumno)
   → Con respuestas y rúbrica (para el docente)
```

---

## Producción

Para un deploy en producción, asegurarse de:

1. Cambiar `SECRET_KEY` por un valor aleatorio seguro
2. Usar Alembic para migraciones en lugar de `create_all`
3. Configurar SSL/HTTPS en Nginx
4. Usar variables de entorno del servidor en lugar de `.env`
5. Escalar con múltiples workers: `uvicorn app.main:app --workers 4`
