import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import { ChevronLeft, Sparkles, AlertCircle, CheckSquare, List, ToggleLeft, Shuffle } from 'lucide-react'
import { subjectsAPI, examsAPI } from '../services/api'
import toast from 'react-hot-toast'

const DIFFICULTY_OPTIONS = [
  { value: 'facil', label: 'Fácil', desc: 'Conceptos básicos y definiciones', color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' },
  { value: 'medio', label: 'Medio', desc: 'Aplicación y análisis', color: 'border-amber-500/40 bg-amber-500/10 text-amber-400' },
  { value: 'dificil', label: 'Difícil', desc: 'Síntesis y evaluación crítica', color: 'border-red-500/40 bg-red-500/10 text-red-400' },
]

const QUESTION_TYPES = [
  { value: 'multiple_choice', label: 'Opción múltiple', icon: List, desc: '4 opciones, una correcta' },
  { value: 'desarrollo', label: 'Desarrollo', icon: CheckSquare, desc: 'Respuesta abierta elaborada' },
  { value: 'verdadero_falso', label: 'Verdadero / Falso', icon: ToggleLeft, desc: 'Afirmaciones binarias' },
]

function DifficultySelector({ value, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {DIFFICULTY_OPTIONS.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
            value === opt.value ? opt.color : 'border-white/10 bg-navy-800 text-slate-400 hover:border-white/20'
          }`}
        >
          <p className="font-semibold text-sm">{opt.label}</p>
          <p className="text-xs opacity-70 mt-0.5">{opt.desc}</p>
        </button>
      ))}
    </div>
  )
}

function QuestionTypeSelector({ values, onChange }) {
  const toggle = (v) => {
    const next = values.includes(v) ? values.filter(x => x !== v) : [...values, v]
    if (next.length > 0) onChange(next)
  }
  return (
    <div className="space-y-2">
      {QUESTION_TYPES.map(({ value, label, icon: Icon, desc }) => {
        const active = values.includes(value)
        return (
          <button
            key={value}
            type="button"
            onClick={() => toggle(value)}
            className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 text-left transition-all duration-200 ${
              active ? 'border-accent-500/40 bg-accent-500/10' : 'border-white/10 bg-navy-800 hover:border-white/20'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${active ? 'bg-accent-500' : 'bg-navy-700'}`}>
              <Icon size={15} className="text-white" />
            </div>
            <div className="flex-1">
              <p className={`font-medium text-sm ${active ? 'text-white' : 'text-slate-400'}`}>{label}</p>
              <p className="text-xs text-slate-600 mt-0.5">{desc}</p>
            </div>
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
              active ? 'border-accent-500 bg-accent-500' : 'border-white/20'
            }`}>
              {active && <svg viewBox="0 0 12 12" className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 6l3 3 5-5" /></svg>}
            </div>
          </button>
        )
      })}
    </div>
  )
}

export default function GenerateExamPage() {
  const { subjectId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectedSyllabus = searchParams.get('syllabus')

  const [subject, setSubject] = useState(null)
  const [syllabuses, setSyllabuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  const [form, setForm] = useState({
    syllabus_id: preselectedSyllabus ? parseInt(preselectedSyllabus) : '',
    title: '',
    difficulty: 'medio',
    total_questions: 10,
    question_types: ['multiple_choice'],
    generate_variant: false,
  })

  useEffect(() => {
    Promise.all([subjectsAPI.get(subjectId), subjectsAPI.listSyllabuses(subjectId)])
      .then(([s, sy]) => {
        setSubject(s.data)
        setSyllabuses(sy.data)
        if (!preselectedSyllabus && sy.data.length > 0) {
          setForm(f => ({ ...f, syllabus_id: sy.data[0].id }))
        }
      })
      .catch(() => toast.error('Error al cargar datos'))
      .finally(() => setLoading(false))
  }, [subjectId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.syllabus_id) return toast.error('Seleccioná un temario')
    if (form.question_types.length === 0) return toast.error('Seleccioná al menos un tipo de pregunta')

    setGenerating(true)
    try {
      const payload = { ...form, syllabus_id: parseInt(form.syllabus_id) }
      const { data } = await examsAPI.generate(payload)
      toast.success('¡Examen generado exitosamente!')
      navigate(`/exams/${data.id}`)
    } catch (err) {
      const msg = err.response?.data?.detail || 'Error al generar el examen. Verificá tu API key de OpenAI.'
      toast.error(msg)
    } finally {
      setGenerating(false)
    }
  }

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-white/5 rounded w-1/3" /><div className="card h-64" /></div>

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div>
        <Link to={`/subjects/${subjectId}`} className="flex items-center gap-1.5 text-slate-500 hover:text-white text-sm transition-colors mb-4">
          <ChevronLeft size={15} /> Volver a {subject?.name}
        </Link>
        <h1 className="font-display font-bold text-3xl text-white flex items-center gap-3">
          <Sparkles size={26} className="text-accent-400" /> Generar examen
        </h1>
        <p className="text-slate-500 mt-1">La IA creará preguntas, respuestas y rúbrica automáticamente.</p>
      </div>

      {syllabuses.length === 0 && (
        <div className="card p-5 border-amber-500/30 bg-amber-500/5 flex items-start gap-3">
          <AlertCircle size={18} className="text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-amber-300 font-medium text-sm">No hay temarios cargados</p>
            <p className="text-slate-400 text-sm mt-0.5">
              Primero <Link to={`/subjects/${subjectId}/syllabuses/new`} className="text-accent-400 underline">cargá un temario</Link> para poder generar exámenes.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Temario */}
        <div className="card p-5">
          <h3 className="font-display font-semibold text-white mb-4">Configuración base</h3>
          <div className="space-y-4">
            <div>
              <label className="label">Temario *</label>
              <select className="input" value={form.syllabus_id}
                onChange={e => setForm({ ...form, syllabus_id: e.target.value })} required>
                <option value="">Seleccionar temario...</option>
                {syllabuses.map(sy => <option key={sy.id} value={sy.id}>{sy.title}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Título personalizado (opcional)</label>
              <input className="input" placeholder={`Examen de ${subject?.name} — se generará automáticamente`}
                value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
          </div>
        </div>

        {/* Dificultad */}
        <div className="card p-5">
          <h3 className="font-display font-semibold text-white mb-4">Nivel de dificultad</h3>
          <DifficultySelector value={form.difficulty} onChange={v => setForm({ ...form, difficulty: v })} />
        </div>

        {/* Cantidad */}
        <div className="card p-5">
          <h3 className="font-display font-semibold text-white mb-1">Cantidad de preguntas</h3>
          <p className="text-slate-500 text-sm mb-4">Entre 3 y 50 preguntas</p>
          <div className="flex items-center gap-4">
            <input
              type="range" min={3} max={50} step={1}
              value={form.total_questions}
              onChange={e => setForm({ ...form, total_questions: parseInt(e.target.value) })}
              className="flex-1 accent-orange-500"
            />
            <div className="w-16 text-center">
              <span className="font-display font-bold text-2xl text-white">{form.total_questions}</span>
            </div>
          </div>
        </div>

        {/* Tipos de pregunta */}
        <div className="card p-5">
          <h3 className="font-display font-semibold text-white mb-4">Tipos de preguntas</h3>
          <QuestionTypeSelector values={form.question_types} onChange={v => setForm({ ...form, question_types: v })} />
        </div>

        {/* Versión alternativa */}
        <div className="card p-5">
          <button
            type="button"
            onClick={() => setForm({ ...form, generate_variant: !form.generate_variant })}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-3">
              <Shuffle size={18} className="text-accent-400" />
              <div className="text-left">
                <p className="font-medium text-white text-sm">Generar versión alternativa</p>
                <p className="text-xs text-slate-500 mt-0.5">Mismos temas, diferente redacción y orden — ideal para evitar copias</p>
              </div>
            </div>
            <div className={`w-11 h-6 rounded-full transition-all duration-200 relative ${form.generate_variant ? 'bg-accent-500' : 'bg-navy-700'}`}>
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all duration-200 ${form.generate_variant ? 'left-5.5' : 'left-0.5'} shadow`} style={{ left: form.generate_variant ? '22px' : '2px' }} />
            </div>
          </button>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base"
          disabled={generating || syllabuses.length === 0}
        >
          {generating ? (
            <>
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generando con IA... (puede tardar 15-30 segundos)
            </>
          ) : (
            <><Sparkles size={18} /> Generar examen</>
          )}
        </button>
      </form>
    </div>
  )
}
