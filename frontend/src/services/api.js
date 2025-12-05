import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Configuration axios de base
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Intercepteur pour ajouter le token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      /*localStorage.removeItem('token')
      window.location.href = '/login'*/
      console.warn("401 Message detected, dear fuckers.... - TOKEN INVALID")
    }
    return Promise.reject(error)
  }
)

// Services d'authentification
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  //register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
}

// Services enseignants
export const teacherAPI = {
  getDashboard: () => api.get('/teacher/dashboard'),
  getAssignedClasses: () => api.get('/teacher/classes'),
  getClassGrades: (classId, params) => api.get(`/teacher/classes/${classId}/grades`, { params }),
  createGrade: (classId, data) => api.post(`/teacher/classes/${classId}/grades`, data),
  getSubjectsByClass: (classId) => api.get(`/teacher/classes/${classId}/subjects`),
  getMainTeacherDashboard: (classId) => api.get(`/teacher/classes/${classId}/main-teacher`),
}

// Services étudiants
export const studentAPI = {
  getDashboard: () => api.get('/student/dashboard'),
  getReportCard: (semester) => api.get(`/student/report-card/${semester || ''}`),
}

// Services admin - COMPLET
export const adminAPI = {
  // Dashboard
  getDashboard: () => api.get('/admin/dashboard'),
  getAllData: () => api.get('/admin/all-data'),
  
  // Enseignants
  getAllTeachers: () => api.get('/admin/teachers'),
  createTeacher: (data) => api.post('/admin/teachers', data),
  deleteTeacher: (id) => api.delete(`/admin/teachers/${id}`),
  assignTeacher: (data) => api.post('/admin/teachers/assign', data),
  
  // Étudiants
  getAllStudents: () => api.get('/admin/students'),
  createStudent: (data) => api.post('/admin/students', data),
  deleteStudent: (id) => api.delete(`/admin/students/${id}`),
  
  // Classes
  getAllClasses: () => api.get('/admin/classes'),
  createClass: (data) => api.post('/admin/classes', data),
  
  // Matières
  getAllSubjects: () => api.get('/admin/subjects'),
  createSubject: (data) => api.post('/admin/subjects', data),
  
  // Utilisateurs
  toggleUserStatus: (id, data) => api.patch(`/admin/users/${id}/status`, data),
}

// Services actualités
export const newsAPI = {
  getNews: (params) => api.get('/news', { params }),
  createNews: (data) => api.post('/news', data),
  updateNews: (id, data) => api.put(`/news/${id}`, data),
  deleteNews: (id) => api.delete(`/news/${id}`),
}

// Services appréciations
export const appreciationAPI = {
  createAppreciation: (data) => api.post('/appreciations', data),
  getStudentAppreciations: (studentId) => api.get(`/appreciations/student/${studentId}`),
  getClassAppreciations: (classId) => api.get(`/appreciations/class/${classId}`),
}

// Services utilitaires
export const utilsAPI = {
  calculateGeneralAverage: (studentId, semester) => 
    api.get(`/utils/students/${studentId}/general-average/${semester || ''}`),
  generateReportCard: (studentId, semester) => 
    api.get(`/utils/students/${studentId}/report-card/${semester}`),
  getGeneralAverage: (studentId, semester) =>
    api.get(`/utils/students/${studentId}/general-average/${semester || ''}`),
  signBulletin: (studentId, semester) => 
    api.post(`/utils/students/${studentId}/sign-bulletin/${semester}`),
}

// Services notes
export const gradeAPI = {
  createGrade: (classId, data) => api.post(`/grades/classes/${classId}/grades`, data),
  getClassGrades: (classId, params) => api.get(`/grades/classes/${classId}/grades`, { params }),
}

// Service de santé
export const healthAPI = {
  check: () => api.get('/health'),
}

// Upload de fichiers
export const uploadAPI = {
  uploadFile: (formData) => api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
}

export default api