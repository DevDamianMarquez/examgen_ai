"""
Servicio de OpenAI.
Maneja embeddings y generación de exámenes con prompts optimizados.
"""
import json
import numpy as np
from typing import List, Optional
from openai import OpenAI
from app.core.config import settings

client = OpenAI(api_key=settings.OPENAI_API_KEY)


def get_embedding(text: str) -> List[float]:
    """Genera embedding de un texto usando el modelo configurado."""
    response = client.embeddings.create(
        input=text,
        model=settings.OPENAI_EMBEDDING_MODEL,
    )
    return response.data[0].embedding


def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """Calcula similitud coseno entre dos vectores."""
    a = np.array(vec_a)
    b = np.array(vec_b)
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


def find_similar_questions(
    new_embedding: List[float],
    existing_embeddings: List[List[float]],
    threshold: float = 0.88,
) -> bool:
    """
    Retorna True si alguna pregunta existente es muy similar a la nueva.
    Umbral 0.88 = 88% similitud → la pregunta es demasiado parecida.
    """
    for emb in existing_embeddings:
        if cosine_similarity(new_embedding, emb) > threshold:
            return True
    return False


def build_exam_prompt(
    syllabus_content: str,
    subject_name: str,
    educational_level: str,
    difficulty: str,
    total_questions: int,
    question_types: List[str],
    existing_questions_summary: Optional[str] = None,
    is_variant: bool = False,
) -> str:
    """
    Construye el prompt optimizado para generación de exámenes.
    """
    difficulty_map = {
        "facil": "básico/fácil — conceptos fundamentales, definiciones, reconocimiento",
        "medio": "intermedio — aplicación de conceptos, análisis, comprensión profunda",
        "dificil": "avanzado/difícil — síntesis, evaluación crítica, resolución de problemas complejos",
    }

    type_instructions = {
        "multiple_choice": "Opción múltiple: 4 opciones (A, B, C, D), una sola correcta. Las distractoras deben ser plausibles.",
        "desarrollo": "Desarrollo: pregunta abierta que requiere respuesta elaborada de 3-8 oraciones mínimo.",
        "verdadero_falso": "Verdadero/Falso: afirmación clara que sea inequívocamente verdadera o falsa.",
    }

    types_desc = "\n".join([f"- {type_instructions[t]}" for t in question_types if t in type_instructions])

    variant_instruction = ""
    if is_variant:
        variant_instruction = """
IMPORTANTE — VERSIÓN ALTERNATIVA (anti-copia):
Esta es una versión alternativa del examen. Debes:
- Reformular todas las preguntas con diferente redacción
- Cambiar el orden de las opciones en multiple choice
- Usar ejemplos y contextos distintos
- Mantener el mismo nivel de dificultad y cobertura temática
"""

    avoid_instruction = ""
    if existing_questions_summary:
        avoid_instruction = f"""
PREGUNTAS A EVITAR (ya usadas en exámenes anteriores — NO repetir estos temas/enfoques):
{existing_questions_summary}
"""

    prompt = f"""Eres un experto pedagogo y diseñador curricular con 20 años de experiencia creando evaluaciones académicas de alta calidad.

TAREA: Genera un examen completo y profesional.

INFORMACIÓN DEL EXAMEN:
- Materia: {subject_name}
- Nivel educativo: {educational_level}
- Dificultad: {difficulty_map.get(difficulty, difficulty)}
- Total de preguntas: {total_questions}
- Tipos de preguntas a incluir: {", ".join(question_types)}

TEMARIO (base de conocimiento):
{syllabus_content}

INSTRUCCIONES POR TIPO DE PREGUNTA:
{types_desc}
{variant_instruction}
{avoid_instruction}

CRITERIOS DE CALIDAD:
- Cada pregunta debe ser clara, precisa y sin ambigüedades
- Distribuir las preguntas equitativamente por los temas del temario
- Las preguntas deben evaluar diferentes niveles cognitivos (Taxonomía de Bloom)
- Los distractores en multiple choice deben ser plausibles pero claramente incorrectos
- La rúbrica debe indicar criterios específicos y observables
- Los puntos deben distribuirse considerando la complejidad de cada pregunta

FORMATO DE RESPUESTA — responde ÚNICAMENTE con este JSON válido, sin markdown, sin explicaciones:

{{
  "exam_title": "Título descriptivo del examen",
  "subject": "{subject_name}",
  "educational_level": "{educational_level}",
  "difficulty": "{difficulty}",
  "total_points": 100,
  "instructions": "Instrucciones generales para el alumno (3-4 oraciones)",
  "questions": [
    {{
      "order": 1,
      "type": "multiple_choice|desarrollo|verdadero_falso",
      "question": "Texto de la pregunta",
      "options": ["A) opción1", "B) opción2", "C) opción3", "D) opción4"],
      "correct_answer": "A) opción1",
      "explanation": "Por qué esta es la respuesta correcta y por qué las otras son incorrectas",
      "points": 10,
      "difficulty": "{difficulty}",
      "topic_area": "Subtema del temario que evalúa"
    }}
  ],
  "rubric": {{
    "general_criteria": "Criterios generales de evaluación",
    "grading_scale": {{
      "excellent": "90-100: descripción",
      "good": "75-89: descripción",
      "satisfactory": "60-74: descripción",
      "needs_improvement": "0-59: descripción"
    }},
    "per_question_rubric": [
      {{
        "question_order": 1,
        "max_points": 10,
        "criteria": [
          {{"criterion": "Descripción del criterio", "points": 5}},
          {{"criterion": "Descripción del criterio", "points": 5}}
        ]
      }}
    ]
  }},
  "answer_key": [
    {{
      "question_order": 1,
      "correct_answer": "respuesta completa",
      "key_concepts": ["concepto1", "concepto2"]
    }}
  ]
}}"""
    return prompt


def generate_exam_with_ai(
    syllabus_content: str,
    subject_name: str,
    educational_level: str,
    difficulty: str,
    total_questions: int,
    question_types: List[str],
    existing_questions_summary: Optional[str] = None,
    is_variant: bool = False,
) -> dict:
    """
    Llama a la API de OpenAI y retorna el examen parseado como dict.
    """
    prompt = build_exam_prompt(
        syllabus_content=syllabus_content,
        subject_name=subject_name,
        educational_level=educational_level,
        difficulty=difficulty,
        total_questions=total_questions,
        question_types=question_types,
        existing_questions_summary=existing_questions_summary,
        is_variant=is_variant,
    )

    response = client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "Eres un experto en diseño curricular y evaluación educativa. "
                    "Respondes ÚNICAMENTE con JSON válido y bien formado. "
                    "Nunca agregues texto fuera del JSON. Nunca uses markdown."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.7,
        max_tokens=4000,
        response_format={"type": "json_object"},
    )

    content = response.choices[0].message.content
    return json.loads(content)
