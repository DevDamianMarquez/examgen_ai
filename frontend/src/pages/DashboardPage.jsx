import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, FileText, Plus, Sparkles, TrendingUp, Clock } from 'lucide-react'
import { subjectsAPI, examsAPI } from '../services/api'
import useAuthStore from '../store/authStore'

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card p-6 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-display font-bold text-white">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [subjects, setSubjects] = useState([])
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([subjectsAPI.list(), examsAPI.list()])
      .then(([s, e]) => {
        setSubjects(s.data)
        setExams(e.data)
      })
      .finally(() => setLoading(false))
  }, [])

  const difficultyColor = {
    facil: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    medio: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    dificil: 'bg-red-500/15 text-red-400 border-red-500/20',
  }

  const difficultyLabel = { facil: 'Fácil', medio: 'Medio', dificil: 'Difícil' }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-3xl text-white">
          {greeting}, {user?.full_name?.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-500 mt-1">Tu panel de control de ExamGen AI</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={BookOpen} label="Materias creadas" value={subjects.length} color="bg-navy-600" />
        <StatCard icon={FileText} label="Exámenes generados" value={exams.length} color="bg-accent-500" />
        <StatCard icon={TrendingUp} label="Preguntas totales" value={exams.reduce((a, e) => a + e.total_questions, 0)} color="bg-indigo-600" />
      </div>

      {/* Quick actions */}
      <div className="card p-6">
        <h2 className="font-display font-semibold text-lg text-white mb-4">Acciones rápidas</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/subjects" className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={15} /> Nueva materia
          </Link>
          <Link to="/subjects" className="btn-secondary flex items-center gap-2 text-sm">
            <Sparkles size={15} /> Generar examen
          </Link>
        </div>
      </div>

      {/* Recent exams */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-lg text-white">Exámenes recientes</h2>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="h-4 bg-white/5 rounded w-1/3 mb-2" />
                <div className="h-3 bg-white/5 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : exams.length === 0 ? (
          <div className="card p-10 text-center">
            <FileText size={36} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500">Todavía no generaste ningún examen.</p>
            <p className="text-slate-600 text-sm mt-1">Creá una materia y cargá un temario para comenzar.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {exams.slice(0, 6).map((exam) => (
              <Link
                key={exam.id}
                to={`/exams/${exam.id}`}
                className="card p-5 flex items-center justify-between hover:border-white/20 transition-all duration-200 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-navy-800 rounded-xl flex items-center justify-center border border-white/10">
                    <FileText size={16} className="text-accent-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white group-hover:text-accent-400 transition-colors">{exam.title}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Clock size={11} />
                      {new Date(exam.created_at).toLocaleDateString('es-AR')} · {exam.total_questions} preguntas · v{exam.version}
                    </p>
                  </div>
                </div>
                <span className={`badge border ${difficultyColor[exam.difficulty] || 'bg-slate-500/15 text-slate-400'}`}>
                  {difficultyLabel[exam.difficulty] || exam.difficulty}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
