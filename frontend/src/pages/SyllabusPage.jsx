import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, ScrollText, Upload, Sparkles } from 'lucide-react'
import { subjectsAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function SyllabusPage() {
  const { subjectId } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', content: '' })
  const [loading, setLoading] = useState(false)
  const charCount = form.content.length

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (charCount < 100) return toast.error('El temario debe tener al menos 100 caracteres')
    setLoading(true)
    try {
      await subjectsAPI.createSyllabus(subjectId, { ...form, subject_id: parseInt(subjectId) })
      toast.success('Temario cargado y embedding generado ✓')
      navigate(`/subjects/${subjectId}`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al guardar el temario')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.includes('text') && !file.name.endsWith('.txt') && !file.name.endsWith('.md')) {
      return toast.error('Solo se aceptan archivos de texto (.txt, .md)')
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      setForm(f => ({ ...f, content: ev.target.result }))
      toast.success('Archivo cargado')
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <Link to={`/subjects/${subjectId}`} className="flex items-center gap-1.5 text-slate-500 hover:text-white text-sm transition-colors mb-4">
          <ChevronLeft size={15} /> Volver a la materia
        </Link>
        <h1 className="font-display font-bold text-3xl text-white flex items-center gap-3">
          <ScrollText size={26} className="text-accent-400" /> Cargar temario
        </h1>
        <p className="text-slate-500 mt-1">El sistema generará embeddings automáticamente para evitar preguntas repetidas.</p>
      </div>

      <div className="card p-6 bg-accent-500/5 border-accent-500/20">
        <div className="flex items-start gap-3">
          <Sparkles size={18} className="text-accent-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-accent-300 text-sm">IA con memoria de preguntas</p>
            <p className="text-slate-400 text-sm mt-0.5">
              Al generar exámenes del mismo temario, el sistema usa embeddings para detectar preguntas similares y evitar repetirlas automáticamente.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="label">Título del temario *</label>
          <input className="input" placeholder="Ej: Unidad 1 — Álgebra Lineal, Primer trimestre..."
            value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="label mb-0">Contenido del temario *</label>
            <label className="btn-ghost text-xs flex items-center gap-1.5 cursor-pointer">
              <Upload size={12} /> Cargar desde archivo
              <input type="file" accept=".txt,.md,text/*" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
          <textarea
            className="input resize-none font-mono text-sm"
            rows={16}
            placeholder={`Pegá aquí el contenido del temario. Cuanto más detallado sea, mejor será la calidad de los exámenes generados.\n\nEjemplo:\n\nUnidad 1: Introducción al Álgebra\n- Números reales y sus propiedades\n- Operaciones básicas: suma, resta, multiplicación, división\n- Fracciones y decimales\n...\n\nUnidad 2: Ecuaciones\n- Ecuaciones de primer grado\n- Sistemas de ecuaciones\n...`}
            value={form.content}
            onChange={e => setForm({ ...form, content: e.target.value })}
            required
          />
          <div className="flex justify-between mt-1.5">
            <p className="text-xs text-slate-600">Mínimo 100 caracteres</p>
            <p className={`text-xs ${charCount < 100 ? 'text-red-500' : charCount > 5000 ? 'text-amber-400' : 'text-emerald-500'}`}>
              {charCount.toLocaleString()} caracteres
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Link to={`/subjects/${subjectId}`} className="btn-secondary flex-1 text-center">Cancelar</Link>
          <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={loading || charCount < 100}>
            {loading ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generando embeddings...</>
            ) : (
              <><Sparkles size={15} /> Guardar temario</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
