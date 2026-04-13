import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft, Download, BookOpen, CheckCircle, List, ToggleLeft, Award, FileText, Eye, EyeOff } from 'lucide-react'
import { examsAPI } from '../services/api'
import toast from 'react-hot-toast'

const typeIcon = { multiple_choice: List, desarrollo: BookOpen, verdadero_falso: ToggleLeft }
const typeLabel = { multiple_choice: 'Opción múltiple', desarrollo: 'Desarrollo', verdadero_falso: 'V / F' }
const difficultyColor = {
  facil: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  medio: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  dificil: 'bg-red-500/15 text-red-400 border-red-500/20',
}
const difficultyLabel = { facil: 'Fácil', medio: 'Medio', dificil: 'Difícil' }

function QuestionCard({ question, showAnswers, index }) {
  const Icon = typeIcon[question.question_type] || FileText

  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <span className="w-7 h-7 bg-navy-800 rounded-lg flex items-center justify-center text-xs font-bold text-accent-400 border border-white/10 flex-shrink-0 mt-0.5">
            {question.order_num}
          </span>
          <p className="text-white text-sm leading-relaxed font-medium">{question.question_text}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-slate-500">{question.points} pts</span>
          <span className="badge bg-navy-800 text-slate-400 border border-white/10 text-xs">
            {typeLabel[question.question_type] || question.question_type}
          </span>
        </div>
      </div>

      {/* Options for multiple choice */}
      {question.question_type === 'multiple_choice' && question.options && (
        <div className="ml-10 space-y-1.5">
          {question.options.map((opt, i) => {
            const isCorrect = showAnswers && opt === question.correct_answer
            return (
              <div key={i} className={`flex items-center gap-2.5 p-2.5 rounded-lg text-sm transition-all ${
                isCorrect ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-navy-800/60'
              }`}>
                {isCorrect ? <CheckCircle size={14} className="text-emerald-400 flex-shrink-0" /> : (
                  <span className="w-3.5 h-3.5 rounded-full border border-white/20 flex-shrink-0" />
                )}
                <span className={isCorrect ? 'text-emerald-300' : 'text-slate-400'}>{opt}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* V/F */}
      {question.question_type === 'verdadero_falso' && (
        <div className="ml-10 flex gap-3">
          {['Verdadero', 'Falso'].map(opt => {
            const isCorrect = showAnswers && opt === question.correct_answer
            return (
              <div key={opt} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm border ${
                isCorrect ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-white/10 bg-navy-800 text-slate-400'
              }`}>
                {isCorrect && <CheckCircle size={13} className="text-emerald-400" />}
                {opt}
              </div>
            )
          })}
        </div>
      )}

      {/* Development answer space indicator */}
      {question.question_type === 'desarrollo' && !showAnswers && (
        <div className="ml-10 h-16 border border-dashed border-white/10 rounded-lg flex items-center justify-center">
          <span className="text-xs text-slate-600">Espacio para respuesta del alumno</span>
        </div>
      )}

      {/* Show answer for development */}
      {showAnswers && question.correct_answer && question.question_type === 'desarrollo' && (
        <div className="ml-10 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <p className="text-xs font-medium text-emerald-400 mb-1">Respuesta esperada:</p>
          <p className="text-sm text-emerald-300">{question.correct_answer}</p>
        </div>
      )}

      {/* Explanation */}
      {showAnswers && question.explanation && (
        <div className="ml-10 p-3 bg-navy-800/50 rounded-lg border border-white/5">
          <p className="text-xs font-medium text-slate-500 mb-1">Explicación:</p>
          <p className="text-xs text-slate-400 leading-relaxed">{question.explanation}</p>
        </div>
      )}
    </div>
  )
}

export default function ExamViewPage() {
  const { examId } = useParams()
  const [exam, setExam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAnswers, setShowAnswers] = useState(false)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    examsAPI.get(examId)
      .then(r => setExam(r.data))
      .catch(() => toast.error('Error al cargar el examen'))
      .finally(() => setLoading(false))
  }, [examId])

  const handleDownload = async (withAnswers) => {
    setDownloading(true)
    try {
      const { data } = await examsAPI.downloadPDF(examId, withAnswers)
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `${withAnswers ? 'respuestas' : 'examen'}_${examId}_v${exam.version}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('PDF descargado')
    } catch {
      toast.error('Error al generar el PDF')
    } finally {
      setDownloading(false)
    }
  }

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-white/5 rounded w-2/3" />
      <div className="card p-6 h-40" />
      <div className="card p-6 h-40" />
    </div>
  )
  if (!exam) return <div className="text-slate-500">Examen no encontrado</div>

  const rawData = exam.raw_json || {}

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <Link to={`/subjects/${exam.subject_id}`} className="flex items-center gap-1.5 text-slate-500 hover:text-white text-sm transition-colors mb-4">
          <ChevronLeft size={15} /> Volver a la materia
        </Link>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display font-bold text-2xl text-white">{exam.title}</h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`badge border ${difficultyColor[exam.difficulty] || ''}`}>
                {difficultyLabel[exam.difficulty] || exam.difficulty}
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-500 text-sm">{exam.total_questions} preguntas</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-500 text-sm">Versión {exam.version}</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-500 text-sm">{new Date(exam.created_at).toLocaleDateString('es-AR')}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowAnswers(!showAnswers)}
              className={`btn-secondary text-sm flex items-center gap-2 ${showAnswers ? 'border-accent-500/40 text-accent-400' : ''}`}
            >
              {showAnswers ? <EyeOff size={14} /> : <Eye size={14} />}
              {showAnswers ? 'Ocultar respuestas' : 'Ver respuestas'}
            </button>
            <button
              onClick={() => handleDownload(false)}
              disabled={downloading}
              className="btn-secondary text-sm flex items-center gap-2"
            >
              <Download size={14} /> Descargar PDF
            </button>
            <button
              onClick={() => handleDownload(true)}
              disabled={downloading}
              className="btn-primary text-sm flex items-center gap-2"
            >
              <Award size={14} /> PDF con respuestas
            </button>
          </div>
        </div>
      </div>

      {/* Instructions */}
      {rawData.instructions && (
        <div className="card p-5 bg-navy-800/50">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Instrucciones para el alumno</p>
          <p className="text-slate-300 text-sm leading-relaxed">{rawData.instructions}</p>
        </div>
      )}

      {/* Questions */}
      <div className="space-y-3">
        {exam.questions
          .sort((a, b) => a.order_num - b.order_num)
          .map((q, i) => (
            <QuestionCard key={q.id} question={q} showAnswers={showAnswers} index={i} />
          ))}
      </div>

      {/* Rubric summary (when showing answers) */}
      {showAnswers && exam.rubric?.grading_scale && (
        <div className="card p-5">
          <h3 className="font-display font-semibold text-white flex items-center gap-2 mb-4">
            <Award size={18} className="text-accent-400" /> Escala de calificación
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(exam.rubric.grading_scale).map(([key, val]) => {
              const colors = {
                excellent: 'border-emerald-500/30 bg-emerald-500/10',
                good: 'border-blue-500/30 bg-blue-500/10',
                satisfactory: 'border-amber-500/30 bg-amber-500/10',
                needs_improvement: 'border-red-500/30 bg-red-500/10',
              }
              return (
                <div key={key} className={`rounded-xl p-3 border ${colors[key] || 'border-white/10 bg-navy-800'}`}>
                  <p className="text-xs font-bold text-white capitalize mb-1">{key.replace('_', ' ')}</p>
                  <p className="text-xs text-slate-400">{val}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Download button bottom */}
      <div className="flex gap-3 pt-2 pb-8">
        <button onClick={() => handleDownload(false)} disabled={downloading} className="btn-secondary flex-1 flex items-center justify-center gap-2">
          <Download size={15} /> Descargar examen (alumno)
        </button>
        <button onClick={() => handleDownload(true)} disabled={downloading} className="btn-primary flex-1 flex items-center justify-center gap-2">
          <Award size={15} /> Descargar con respuestas (docente)
        </button>
      </div>
    </div>
  )
}
