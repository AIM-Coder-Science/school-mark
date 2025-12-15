import axiosInstance from './axios';

// Auth endpoints
export const authAPI = {
  login: (credentials) => axiosInstance.post('/auth/login', credentials),
  getProfile: () => axiosInstance.get('/auth/me'),
  changePassword: (data) => axiosInstance.put('/auth/change-password', data),
  logout: () => axiosInstance.post('/auth/logout'),
  checkAvailability: (data) => axiosInstance.post('/auth/check-availability', data),
};

// Admin endpoints
export const adminAPI = {
  // Teachers
  createTeacher: (data) => axiosInstance.post('/admin/teachers', data),
  getTeachers: () => axiosInstance.get('/admin/teachers'),
  
  // Students
  createStudent: (data) => axiosInstance.post('/admin/students', data),
  getStudents: (classId) => 
    axiosInstance.get(`/admin/students${classId ? `?classId=${classId}` : ''}`),
  
  // Classes
  createClass: (data) => axiosInstance.post('/admin/classes', data),
  getClasses: () => axiosInstance.get('/admin/classes'),
  assignPrincipal: (classId, teacherId) =>
    axiosInstance.put(`/admin/classes/${classId}/principal`, { teacherId }),
  
  // Subjects
  createSubject: (data) => axiosInstance.post('/admin/subjects', data),
  
  // Publications
  createPublication: (data) => axiosInstance.post('/admin/publications', data),
  
  // Stats
  getStats: () => axiosInstance.get('/admin/stats'),
  
  // Users
  updateUser: (userId, data) => axiosInstance.put(`/admin/users/${userId}`, data),
  deleteUser: (userId) => axiosInstance.delete(`/admin/users/${userId}`),
};

// Teacher endpoints
export const teacherAPI = {
  getMyClasses: () => axiosInstance.get('/teacher/classes'),
  getClassStudents: (classId, subjectId) =>
    axiosInstance.get(`/teacher/classes/${classId}/students${subjectId ? `?subjectId=${subjectId}` : ''}`),
  addGrade: (data) => axiosInstance.post('/teacher/grades', data),
  getClassGrades: (classId, subjectId, params) =>
    axiosInstance.get(`/teacher/classes/${classId}/subjects/${subjectId}/grades`, { params }),
  calculateAverage: (studentId, subjectId, params) =>
    axiosInstance.get(`/teacher/students/${studentId}/subjects/${subjectId}/average`, { params }),
  
  // Principal teacher
  getPrincipalClasses: () => axiosInstance.get('/teacher/principal-classes'),
  calculateGeneralAverage: (studentId, params) =>
    axiosInstance.get(`/teacher/principal/students/${studentId}/general-average`, { params }),
  addAppreciation: (studentId, data) =>
    axiosInstance.post(`/teacher/principal/students/${studentId}/appreciation`, data),
  
  // Stats
  getTeacherStats: () => axiosInstance.get('/teacher/stats'),
};

// Student endpoints
export const studentAPI = {
  getProfile: () => axiosInstance.get('/student/profile'),
  getMyGrades: (params) => axiosInstance.get('/student/grades', { params }),
  getMyBulletins: () => axiosInstance.get('/student/bulletins'),
  getPublications: (params) => axiosInstance.get('/student/publications', { params }),
  getMySubjects: () => axiosInstance.get('/student/subjects'),
  getMyRanking: (params) => axiosInstance.get('/student/ranking', { params }),
  getStudentStats: () => axiosInstance.get('/student/stats'),
};

// Common endpoints
export const commonAPI = {
  uploadFile: (file, type) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return axiosInstance.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};