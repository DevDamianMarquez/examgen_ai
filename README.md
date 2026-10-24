# ExamGen AI

A FastAPI backend that turns a teacher's syllabus into a complete exam with an LLM: questions, answer key and grading rubric, exported as a student PDF and a teacher PDF.

Personal project by [Damian Marquez](https://damian-backend-portfolio.vercel.app). Case study: [damian-backend-portfolio.vercel.app/projects/examgen-ai](https://damian-backend-portfolio.vercel.app/projects/examgen-ai)

---

## What it does

1. A teacher registers, creates a subject (e.g. "Physics", university level) and pastes a syllabus.
2. They request an exam: difficulty, number of questions (3–50) and question types (multiple choice, open-ended, true/false).
3. The API asks the LLM for the whole exam as JSON, stores it, and saves every question as its own row.
4. The exam can be downloaded as a PDF, with or without answers and rubric.
5. An alternative version of an exam can be generated to discourage copying.

## Stack

| Layer | Technology |
| --- | --- |
| API | Python 3.11, FastAPI, Pydantic, pydantic-settings |
| Auth | JWT (python-jose), bcrypt (passlib) |
| Database | PostgreSQL, SQLAlchemy 2.0 |
| LLM | OpenAI Python SDK pointed at an OpenAI-compatible provider (Groq by default), JSON mode |
| PDF | ReportLab |
| Infrastructure | Docker, Docker Compose, Nginx config |
| Client | React, Vite, Tailwind CSS, Zustand, Axios |

## Architecture

```
backend/app/
├── core/          settings (env vars), database session, security (hashing + JWT)
├── models/        SQLAlchemy models: users, subjects, syllabuses, exams, questions, subscriptions
├── schemas/       Pydantic request/response models
├── routers/       HTTP layer: auth, subjects, exams, subscription webhook
├── dependencies/  reusable FastAPI dependencies (active subscription check)
├── services/      exam orchestration, LLM calls, PDF rendering
└── main.py        app factory, CORS, routers, /health
```

Routers stay thin; the generation flow lives in `services/exam_service.py`.

### How an exam is generated

1. **Validate**: Pydantic checks the request, the JWT identifies the user, and a dependency confirms an active subscription.
2. **Authorize**: the syllabus must belong to one of the user's subjects, otherwise 403.
3. **Context**: questions from recent exams on the same syllabus are added to the prompt as topics to avoid.
4. **Generate**: one chat completion in JSON mode returns questions, answers, rubric and answer key.
5. **Persist**: the full JSON is stored on the exam and each question is saved as a row, in one transaction.
6. **Render**: PDFs are produced on request from the stored JSON.

### Design decisions

- **Authorization inside the query.** Subjects, syllabuses and exams are always filtered by the current user's id, so requesting someone else's resource returns 404.
- **Password hashing.** bcrypt only reads the first 72 bytes, so passwords are pre-hashed with SHA-256 before bcrypt.
- **Raw JSON plus normalized rows.** The raw LLM response keeps the rubric and answer key for rendering; question rows make questions queryable.
- **Provider-agnostic LLM client.** The base URL and model come from configuration, so switching providers needs no code changes.
- **PDFs on demand.** Nothing is stored on disk; template fixes apply to every past exam.

## API

Interactive docs are served at `/docs` when the API is running.

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Create account, returns JWT | Public |
| POST | `/api/auth/login` | Log in, returns JWT | Public |
| GET | `/api/auth/me` | Current user | JWT |
| POST | `/api/subjects/` | Create subject | JWT |
| GET | `/api/subjects/` | List my subjects | JWT |
| GET | `/api/subjects/{id}` | Get subject | JWT |
| DELETE | `/api/subjects/{id}` | Delete subject (cascades) | JWT |
| POST | `/api/subjects/{id}/syllabuses` | Add syllabus | JWT |
| GET | `/api/subjects/{id}/syllabuses` | List syllabuses | JWT |
| GET | `/api/subjects/{id}/syllabuses/{syllabus_id}` | Get syllabus | JWT |
| POST | `/api/exams/generate` | Generate exam with the LLM | JWT + subscription |
| GET | `/api/exams/` | List my exams (optional `subject_id`) | JWT |
| GET | `/api/exams/{id}` | Exam with questions | JWT |
| GET | `/api/exams/{id}/pdf` | PDF; `?include_answers=true` for the teacher version | JWT |
| DELETE | `/api/exams/{id}` | Delete exam | JWT |
| GET | `/health` | Health check | Public |

Example request body for `POST /api/exams/generate`:

```json
{
  "syllabus_id": 1,
  "difficulty": "medio",
  "total_questions": 10,
  "question_types": ["multiple_choice", "desarrollo", "verdadero_falso"],
  "title": "Unit 2 exam (optional)",
  "generate_variant": false
}
```

`difficulty` accepts `facil`, `medio` or `dificil`. Prompts and generated exams are in Spanish.

## Running locally

### 1. Configure

```bash
cp backend/.env.example backend/.env
# set GROQ_API_KEY (or another OpenAI-compatible key), LLM_MODEL and SECRET_KEY
```

### 2. Database and API with Docker Compose

```bash
docker compose up --build db backend
# API:  http://localhost:8000
# Docs: http://localhost:8000/docs
```

Tables are created on startup.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
# http://localhost:5173 (Vite proxies /api to http://localhost:8000)
```

### Without Docker

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Requires a running PostgreSQL and `DATABASE_URL` in `backend/.env`.

## Current status and known limitations

This is a personal project that runs end to end in local development. It is not deployed as a product. Known gaps, in the order I would address them:

- **Semantic duplicate detection is not wired in yet.** Embedding storage and a cosine-similarity check (threshold 0.88) exist in `openai_service.py`, but generation currently avoids repeats only through prompt context. Embeddings also require a provider with an embeddings endpoint; with Groq they are skipped.
- **LLM output is parsed but not schema-validated** before saving. Next step: validate against a Pydantic model and retry on malformed output.
- **Schema changes use `create_all`.** Alembic is in the requirements but migrations are not set up yet.
- **No automated tests yet.** Planned: pytest for auth, ownership checks and the generation service with the LLM mocked.
- **The subscription webhook does not verify signatures.**
- **The `frontend` service in docker-compose** proxies to `localhost` inside its container, so run the frontend locally as shown above.

## License

MIT. See [LICENSE](LICENSE).
