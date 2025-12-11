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
  getNews: async (params = {}) => {
    const response = await api.get('/news', { params });
    return response.data;
  },
  getAssignedClassesWithSubjects: async () => {
    // MODIFICATION CRITIQUE: Appeler la bonne route API
    try {
      const response = await api.get('/teacher/classes');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des classes:', error);
      throw error;
    }
  },
  getClassStudents: async (classId) => {
    try {
      const response = await api.get(`/teacher/classes/${classId}/students`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des étudiants de la classe ${classId}:`, error);
      // Retourner un objet vide pour éviter les erreurs
      return {
        success: true,
        data: { students: [] }
      };
    }
  }
}

// Services étudiants
export const studentAPI = {
  getDashboard: () => api.get('/student/dashboard'),
  getReportCard: (semester) => api.get(`/student/report-card/${semester || ''}`),
  getNews: async (params = {}) => {
    const response = await api.get('/news', { params });
    return response.data;
  }
}

// Services admin
export const adminAPI = {
getDashboard: async () => {
    try {
      const response = await api.get('/admin/dashboard');
      return response.data;
    } catch (error) {
      console.error('Erreur dashboard admin:', error);
      // Retourner des données par défaut pour éviter les erreurs
      return {
        success: true,
        dashboard: {
          statistics: {
            studentsCount: 0,
            teachersCount: 0,
            classesCount: 0,
            subjectsCount: 0,
            newsCount: 0,
            activeUsers: 0
          },
          recentStudents: [],
          recentTeachers: [],
          recentNews: []
        }
      };
    }
  },
  getAllData: () => api.get('/admin/all-data'),
  getAllTeachers: () => api.get('/admin/teachers'),
  createTeacher: (data) => api.post('/admin/teachers', data),
  deleteTeacher: (id) => api.delete(`/admin/teachers/${id}`),
  assignTeacher: (data) => api.post('/admin/teachers/assign', data),
  getAllStudents: () => api.get('/admin/students'),
  createStudent: (data) => api.post('/admin/students', data),
  deleteStudent: (id) => api.delete(`/admin/students/${id}`),
  getAllClasses: () => api.get('/admin/classes'),
  createClass: (data) => api.post('/admin/classes', data),
  getAllSubjects: () => api.get('/admin/subjects'),
  createSubject: (data) => api.post('/admin/subjects', data),
  toggleUserStatus: (id, data) => api.patch(`/admin/users/${id}/status`, data),
  updateTeacher: (id, data) => api.put(`/admin/teachers/${id}`, data),
  checkMainTeacher: (classId) => api.get(`/admin/classes/${classId}/main-teacher`),
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
  createGrade: (classId, data) => api.post(`/teacher/classes/${classId}/grades`, data),
  getClassGrades: (classId, params) => api.get(`/teacher/classes/${classId}/grades`, { params }),
// Dans api.js, modifiez getClassGradesDetails :
getClassGradesDetails: async (classId, params) => {
  try {
    const response = await api.get(`/teacher/classes/${classId}/grades/details`, { params });
    console.log('📊 Réponse notes détails:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de la récupération des notes de la classe ${classId}:`, error);
    // Retourner une structure vide mais valide
    return {
      success: true,
      data: {
        class_id: classId,
        period: params?.period || 1,
        grades: {}
      }
    };
  }
},
  saveGrades: async (classId, payload /*subjectId, period, gradesData*/) => {
    try {
      const response = await api.post(`/teacher/classes/${classId}/grades/bulk`, payload/*{
        subjectId,
        period,
        grades: gradesData
      }*/);
      console.log('✅ API - Réponse:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des notes:', error);
      throw error;
    }
  }
};

export const systemAPI = {
  getConfig: async () => {
    try {
      const response = await api.get('/system/config');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de la configuration:', error);
      return {
        success: true,
        data: {
          system_type: 'semestre',
          max_interros: 5,
          max_devoirs: 3
        }
      };
    }
  }
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