import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally — redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ─── Auth ──────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
}

// ─── Subjects ──────────────────────────────────────────────────
export const subjectsAPI = {
  list: () => api.get('/subjects/'),
  create: (data) => api.post('/subjects/', data),
  get: (id) => api.get(`/subjects/${id}`),
  delete: (id) => api.delete(`/subjects/${id}`),
  listSyllabuses: (subjectId) => api.get(`/subjects/${subjectId}/syllabuses`),
  createSyllabus: (subjectId, data) => api.post(`/subjects/${subjectId}/syllabuses`, data),
  getSyllabus: (subjectId, syllabusId) => api.get(`/subjects/${subjectId}/syllabuses/${syllabusId}`),
}

// ─── Exams ─────────────────────────────────────────────────────
export const examsAPI = {
  generate: (data) => api.post('/exams/generate', data),
  list: (subjectId) => api.get('/exams/', { params: subjectId ? { subject_id: subjectId } : {} }),
  get: (id) => api.get(`/exams/${id}`),
  delete: (id) => api.delete(`/exams/${id}`),
  downloadPDF: (id, includeAnswers = false) =>
    api.get(`/exams/${id}/pdf`, {
      params: { include_answers: includeAnswers },
      responseType: 'blob',
    }),
}

export default api
