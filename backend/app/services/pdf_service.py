"""
Servicio de generación de PDF para exámenes.
Usa ReportLab para crear PDFs profesionales y formateados.
"""
import io
from typing import Any, Dict
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether,
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY


def generate_exam_pdf(exam_data: Dict[str, Any], include_answers: bool = False) -> bytes:
    """
    Genera un PDF profesional del examen.
    
    Args:
        exam_data: Diccionario con los datos del examen (raw_json del modelo)
        include_answers: Si True, incluye respuestas y rúbrica al final
    
    Returns:
        bytes del PDF generado
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2.5 * cm,
        leftMargin=2.5 * cm,
        topMargin=2.5 * cm,
        bottomMargin=2.5 * cm,
    )

    styles = getSampleStyleSheet()

    # Estilos personalizados
    title_style = ParagraphStyle(
        "ExamTitle",
        parent=styles["Title"],
        fontSize=18,
        fontName="Helvetica-Bold",
        textColor=colors.HexColor("#1a1a2e"),
        spaceAfter=6,
        alignment=TA_CENTER,
    )

    subtitle_style = ParagraphStyle(
        "ExamSubtitle",
        parent=styles["Normal"],
        fontSize=11,
        fontName="Helvetica",
        textColor=colors.HexColor("#555555"),
        spaceAfter=4,
        alignment=TA_CENTER,
    )

    section_style = ParagraphStyle(
        "SectionHeader",
        parent=styles["Heading2"],
        fontSize=12,
        fontName="Helvetica-Bold",
        textColor=colors.HexColor("#1a1a2e"),
        spaceBefore=16,
        spaceAfter=8,
        borderPad=4,
    )

    question_style = ParagraphStyle(
        "Question",
        parent=styles["Normal"],
        fontSize=11,
        fontName="Helvetica-Bold",
        textColor=colors.HexColor("#222222"),
        spaceBefore=10,
        spaceAfter=4,
        leading=16,
    )

    option_style = ParagraphStyle(
        "Option",
        parent=styles["Normal"],
        fontSize=10,
        fontName="Helvetica",
        textColor=colors.HexColor("#333333"),
        leftIndent=20,
        spaceAfter=3,
        leading=14,
    )

    answer_style = ParagraphStyle(
        "Answer",
        parent=styles["Normal"],
        fontSize=10,
        fontName="Helvetica",
        textColor=colors.HexColor("#006600"),
        leftIndent=20,
        spaceAfter=3,
        leading=14,
    )

    body_style = ParagraphStyle(
        "Body",
        parent=styles["Normal"],
        fontSize=10,
        fontName="Helvetica",
        textColor=colors.HexColor("#333333"),
        spaceAfter=6,
        leading=14,
        alignment=TA_JUSTIFY,
    )

    story = []

    # ─── Encabezado ───────────────────────────────────────────────
    story.append(Paragraph(exam_data.get("exam_title", "Examen"), title_style))
    story.append(Paragraph(
        f"Materia: {exam_data.get('subject', '')} | "
        f"Nivel: {exam_data.get('educational_level', '')} | "
        f"Dificultad: {exam_data.get('difficulty', '').upper()}",
        subtitle_style,
    ))
    story.append(Spacer(1, 6))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#1a1a2e")))
    story.append(Spacer(1, 10))

    # Datos del alumno
    student_table = Table(
        [
            ["Nombre:", "_" * 40, "Fecha:", "_" * 20],
            ["Curso:", "_" * 40, "Calificación:", "_" * 20],
        ],
        colWidths=[3 * cm, 9 * cm, 3 * cm, 5 * cm],
    )
    student_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(student_table)
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cccccc")))

    # Instrucciones
    instructions = exam_data.get("instructions", "")
    if instructions:
        story.append(Paragraph("INSTRUCCIONES", section_style))
        story.append(Paragraph(instructions, body_style))

    # ─── Preguntas ────────────────────────────────────────────────
    story.append(Paragraph("PREGUNTAS", section_style))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cccccc")))

    questions = exam_data.get("questions", [])

    for q in questions:
        q_type = q.get("type", "")
        q_num = q.get("order", "?")
        q_text = q.get("question", "")
        points = q.get("points", 0)
        topic = q.get("topic_area", "")

        # Encabezado de pregunta
        type_label = {
            "multiple_choice": "[Opción Múltiple]",
            "desarrollo": "[Desarrollo]",
            "verdadero_falso": "[Verdadero/Falso]",
        }.get(q_type, "")

        header = f"Pregunta {q_num}. {type_label} ({points} pts)"
        if topic:
            header += f" — {topic}"

        elements = [
            Paragraph(header, question_style),
            Paragraph(q_text, body_style),
        ]

        # Opciones para multiple choice
        if q_type == "multiple_choice" and q.get("options"):
            for opt in q["options"]:
                elements.append(Paragraph(f"○  {opt}", option_style))

        # Espacio para respuesta de desarrollo
        elif q_type == "desarrollo":
            for _ in range(5):
                elements.append(Spacer(1, 2))
                elements.append(HRFlowable(
                    width="100%", thickness=0.3,
                    color=colors.HexColor("#dddddd"),
                ))

        # Verdadero / Falso
        elif q_type == "verdadero_falso":
            elements.append(Paragraph("○  Verdadero     ○  Falso", option_style))

        story.append(KeepTogether(elements))
        story.append(Spacer(1, 6))

    # ─── Respuestas y Rúbrica (solo si include_answers) ──────────
    if include_answers:
        story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#1a1a2e")))
        story.append(Paragraph("CLAVE DE RESPUESTAS", section_style))

        answer_key = exam_data.get("answer_key", [])
        for ans in answer_key:
            story.append(Paragraph(
                f"Pregunta {ans.get('question_order')}: {ans.get('correct_answer', '')}",
                answer_style,
            ))
            key_concepts = ans.get("key_concepts", [])
            if key_concepts:
                story.append(Paragraph(
                    f"  Conceptos clave: {', '.join(key_concepts)}",
                    body_style,
                ))

        # Rúbrica
        rubric = exam_data.get("rubric", {})
        if rubric:
            story.append(Paragraph("RÚBRICA DE CORRECCIÓN", section_style))
            general = rubric.get("general_criteria", "")
            if general:
                story.append(Paragraph(general, body_style))

            grading = rubric.get("grading_scale", {})
            if grading:
                story.append(Spacer(1, 6))
                story.append(Paragraph("Escala de calificación:", question_style))
                scale_data = [["Nivel", "Rango", "Descripción"]]
                for level, desc in grading.items():
                    parts = desc.split(":", 1)
                    if len(parts) == 2:
                        scale_data.append([level.capitalize(), parts[0], parts[1]])
                    else:
                        scale_data.append([level.capitalize(), "", desc])

                scale_table = Table(scale_data, colWidths=[4 * cm, 3 * cm, 10 * cm])
                scale_table.setStyle(TableStyle([
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a1a2e")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 9),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cccccc")),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f5f5f5")]),
                    ("TOPPADDING", (0, 0), (-1, -1), 4),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ]))
                story.append(scale_table)

    doc.build(story)
    return buffer.getvalue()
