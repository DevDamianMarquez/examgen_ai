import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Plus, Trash2, ChevronRight, GraduationCap, X } from 'lucide-react'
import { subjectsAPI } from '../services/api'
import toast from 'react-hot-toast'

const LEVELS = [
  'Primaria', 'Secundaria', 'Bachillerato', 'Universitario',
  'Posgrado', 'Formación profesional', 'Idiomas', 'Otro',
]

function CreateSubjectModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: '', description: '', educational_level: 'Secundaria' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await subjectsAPI.create(form)
      onCreate(data)
      toast.success('Materia creada exitosamente')
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al crear materia')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-md p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-lg text-white">Nueva materia</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nombre de la materia *</label>
            <input className="input" placeholder="Ej: Matemáticas, Historia, Química..."
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>

          <div>
            <label className="label">Nivel educativo *</label>
            <select className="input" value={form.educational_level}
              onChange={e => setForm({ ...form, educational_level: e.target.value })}>
              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Descripción (opcional)</label>
            <textarea className="input resize-none" rows={3}
              placeholder="Descripción breve de la materia..."
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={loading}>
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={15} />}
              Crear materia
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    subjectsAPI.list().then(r => setSubjects(r.data)).finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id, e) => {
    e.preventDefault()
    if (!confirm('¿Eliminar esta materia y todos sus temarios y exámenes?')) return
    try {
      await subjectsAPI.delete(id)
      setSubjects(prev => prev.filter(s => s.id !== id))
      toast.success('Materia eliminada')
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const levelColors = {
    'Primaria': 'bg-emerald-500/10 text-emerald-400',
    'Secundaria': 'bg-blue-500/10 text-blue-400',
    'Bachillerato': 'bg-purple-500/10 text-purple-400',
    'Universitario': 'bg-amber-500/10 text-amber-400',
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-white">Materias</h1>
          <p className="text-slate-500 mt-1">Organizá tus materias y temarios</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Nueva materia
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-6 animate-pulse space-y-3">
              <div className="h-5 bg-white/5 rounded w-1/2" />
              <div className="h-3 bg-white/5 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : subjects.length === 0 ? (
        <div className="card p-16 text-center">
          <BookOpen size={48} className="text-slate-700 mx-auto mb-4" />
          <p className="font-display font-semibold text-xl text-slate-400">Todavía no hay materias</p>
          <p className="text-slate-600 text-sm mt-2 mb-6">Creá tu primera materia para empezar a generar exámenes</p>
          <button onClick={() => setShowModal(true)} className="btn-primary inline-flex items-center gap-2">
            <Plus size={15} /> Crear primera materia
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjects.map(subject => (
            <Link
              key={subject.id}
              to={`/subjects/${subject.id}`}
              className="card p-6 hover:border-white/20 transition-all duration-200 group relative"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-navy-800 rounded-xl flex items-center justify-center border border-white/10">
                    <GraduationCap size={20} className="text-accent-400" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-white group-hover:text-accent-400 transition-colors">
                      {subject.name}
                    </h3>
                    <span className={`badge text-xs mt-1 ${levelColors[subject.educational_level] || 'bg-slate-500/10 text-slate-400'}`}>
                      {subject.educational_level}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={e => handleDelete(subject.id, e)}
                    className="p-2 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                  <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
                </div>
              </div>
              {subject.description && (
                <p className="text-slate-500 text-sm mt-3 line-clamp-2">{subject.description}</p>
              )}
              <p className="text-xs text-slate-600 mt-3">
                Creada el {new Date(subject.created_at).toLocaleDateString('es-AR')}
              </p>
            </Link>
          ))}
        </div>
      )}

      {showModal && (
        <CreateSubjectModal onClose={() => setShowModal(false)} onCreate={s => setSubjects(prev => [s, ...prev])} />
      )}
    </div>
  )
}
