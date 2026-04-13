import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { BookOpen, Plus, Sparkles, FileText, Clock, ChevronLeft, ScrollText, Trash2 } from 'lucide-react'
import { subjectsAPI, examsAPI } from '../services/api'
import toast from 'react-hot-toast'

const difficultyColor = {
  facil: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  medio: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  dificil: 'bg-red-500/15 text-red-400 border-red-500/20',
}
const difficultyLabel = { facil: 'Fácil', medio: 'Medio', dificil: 'Difícil' }

export default function SubjectDetailPage() {
  const { subjectId } = useParams()
  const [subject, setSubject] = useState(null)
  const [syllabuses, setSyllabuses] = useState([])
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      subjectsAPI.get(subjectId),
      subjectsAPI.listSyllabuses(subjectId),
      examsAPI.list(subjectId),
    ]).then(([s, sy, ex]) => {
      setSubject(s.data)
      setSyllabuses(sy.data)
      setExams(ex.data)
    }).catch(() => toast.error('Error al cargar los datos'))
      .finally(() => setLoading(false))
  }, [subjectId])

  const handleDeleteExam = async (examId, e) => {
    e.preventDefault()
    if (!confirm('¿Eliminar este examen?')) return
    try {
      await examsAPI.delete(examId)
      setExams(prev => prev.filter(ex => ex.id !== examId))
      toast.success('Examen eliminado')
    } catch {
      toast.error('Error al eliminar')
    }
  }

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-white/5 rounded w-1/3" />
      <div className="h-4 bg-white/5 rounded w-1/5" />
      <div className="card p-6 h-32" />
    </div>
  )

  if (!subject) return <div className="text-slate-500">Materia no encontrada</div>

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Breadcrumb */}
      <div>
        <Link to="/subjects" className="flex items-center gap-1.5 text-slate-500 hover:text-white text-sm transition-colors mb-4">
          <ChevronLeft size={15} /> Volver a materias
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display font-bold text-3xl text-white">{subject.name}</h1>
            <p className="text-slate-500 mt-1">{subject.educational_level}{subject.description ? ` · ${subject.description}` : ''}</p>
          </div>
          <Link to={`/subjects/${subjectId}/generate`} className="btn-primary flex items-center gap-2">
            <Sparkles size={15} /> Generar examen
          </Link>
        </div>
      </div>

      {/* Syllabuses */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-lg text-white flex items-center gap-2">
            <ScrollText size={18} className="text-accent-400" /> Temarios
            <span className="text-sm font-normal text-slate-500 ml-1">({syllabuses.length})</span>
          </h2>
          <Link to={`/subjects/${subjectId}/syllabuses/new`} className="btn-secondary text-sm flex items-center gap-1.5">
            <Plus size={14} /> Nuevo temario
          </Link>
        </div>

        {syllabuses.length === 0 ? (
          <div className="card p-8 text-center border-dashed">
            <ScrollText size={32} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No hay temarios cargados.</p>
            <Link to={`/subjects/${subjectId}/syllabuses/new`} className="btn-secondary text-sm mt-4 inline-flex items-center gap-1.5">
              <Plus size={14} /> Cargar primer temario
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {syllabuses.map(sy => (
              <div key={sy.id} className="card p-4 flex items-center gap-4">
                <div className="w-9 h-9 bg-navy-800 rounded-lg flex items-center justify-center border border-white/10 flex-shrink-0">
                  <BookOpen size={15} className="text-accent-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm">{sy.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {sy.content.length} caracteres · Cargado el {new Date(sy.created_at).toLocaleDateString('es-AR')}
                  </p>
                </div>
                <Link
                  to={`/subjects/${subjectId}/generate?syllabus=${sy.id}`}
                  className="btn-secondary text-xs flex items-center gap-1.5 flex-shrink-0"
                >
                  <Sparkles size={12} /> Generar examen
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Exams */}
      <div>
        <h2 className="font-display font-semibold text-lg text-white flex items-center gap-2 mb-4">
          <FileText size={18} className="text-accent-400" /> Exámenes generados
          <span className="text-sm font-normal text-slate-500 ml-1">({exams.length})</span>
        </h2>

        {exams.length === 0 ? (
          <div className="card p-8 text-center border-dashed">
            <FileText size={32} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Todavía no generaste ningún examen para esta materia.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {exams.map(exam => (
              <Link
                key={exam.id}
                to={`/exams/${exam.id}`}
                className="card p-4 flex items-center gap-4 hover:border-white/20 transition-all group"
              >
                <div className="w-9 h-9 bg-navy-800 rounded-lg flex items-center justify-center border border-white/10 flex-shrink-0">
                  <FileText size={15} className="text-accent-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm group-hover:text-accent-400 transition-colors">{exam.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                    <Clock size={11} />
                    {new Date(exam.created_at).toLocaleDateString('es-AR')} · {exam.total_questions} preguntas · v{exam.version}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge border ${difficultyColor[exam.difficulty] || ''}`}>
                    {difficultyLabel[exam.difficulty] || exam.difficulty}
                  </span>
                  <button
                    onClick={e => handleDeleteExam(exam.id, e)}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
