import axiosInstance from './axios';

// Auth endpoints
export const authAPI = {
  login: (credentials) => axiosInstance.post('/auth/login', credentials),
  getMe: () => axiosInstance.get('/auth/me'),
  changePassword: (data) => axiosInstance.put('/auth/change-password', data),
  logout: () => axiosInstance.post('/auth/logout'),
  checkAvailability: (data) => axiosInstance.post('/auth/check-availability', data),
  forgotPassword: (data) => axiosInstance.post('/auth/forgot-password', data),
  resetPassword: (data) => axiosInstance.post('/auth/reset-password', data),
};

// Admin endpoints
export const adminAPI = {
  // Teachers
  createTeacher: (data) => axiosInstance.post('/admin/teachers', data),
  getAllTeachers: () => axiosInstance.get('/admin/teachers'),
  getTeacher: (id) => axiosInstance.get(`/admin/teachers/${id}`),
  updateTeacher: (id, data) => axiosInstance.put(`/admin/teachers/${id}`, data),
  
  // Students
  createStudent: (data) => axiosInstance.post('/admin/students', data),
  getAllStudents: (classId) => axiosInstance.get(`/admin/students${classId ? `?classId=${classId}` : ''}`),
  getStudent: (id) => axiosInstance.get(`/admin/students/${id}`),
  updateStudent: (id, data) => axiosInstance.put(`/admin/students/${id}`, data),
  
  // Classes
  createClass: (data) => axiosInstance.post('/admin/classes', data),
  getAllClasses: () => axiosInstance.get('/admin/classes'),
  getClass: (id) => axiosInstance.get(`/admin/classes/${id}`),
  updateClass: (id, data) => axiosInstance.put(`/admin/classes/${id}`, data),
  deleteClass: (id) => axiosInstance.delete(`/admin/classes/${id}`),
  assignPrincipal: (classId, teacherId) => axiosInstance.put(`/admin/classes/${classId}/principal`, { teacherId }),
  
  // Subjects
  createSubject: (data) => axiosInstance.post('/admin/subjects', data),
  getAllSubjects: () => axiosInstance.get('/admin/subjects'),
  getSubject: (id) => axiosInstance.get(`/admin/subjects/${id}`),
  updateSubject: (id, data) => axiosInstance.put(`/admin/subjects/${id}`, data),
  deleteSubject: (id) => axiosInstance.delete(`/admin/subjects/${id}`),
  
  // Publications
  createPublication: (data) => axiosInstance.post('/admin/publications', data),
  getPublications: (params) => axiosInstance.get('/admin/publications', { params }),
  getPublication: (id) => axiosInstance.get(`/admin/publications/${id}`),
  updatePublication: (id, data) => axiosInstance.put(`/admin/publications/${id}`, data),
  deletePublication: (id) => axiosInstance.delete(`/admin/publications/${id}`),
  
  // Stats
  getStats: () => axiosInstance.get('/admin/stats'),
  
  // Users Management
  updateUser: (userId, data) => axiosInstance.put(`/admin/users/${userId}`, data),
  deleteUser: (userId) => axiosInstance.delete(`/admin/users/${userId}`),
  toggleUserStatus: (userId, data) => axiosInstance.patch(`/admin/users/${userId}/status`, data),
  resetUserPassword: (userId, data) => axiosInstance.patch(`/admin/users/${userId}/reset-password`, data),
};

// Teacher endpoints
export const teacherAPI = {
  getMyClasses: () => axiosInstance.get('/teacher/classes'),
  getClassStudents: (classId, subjectId) =>
    axiosInstance.get(`/teacher/classes/${classId}/students${subjectId ? `?subjectId=${subjectId}` : ''}`),
  addGrade: (data) => axiosInstance.post('/teacher/grades', data),
  updateGrade: (gradeId, data) => axiosInstance.put(`/teacher/grades/${gradeId}`, data),
  deleteGrade: (gradeId) => axiosInstance.delete(`/teacher/grades/${gradeId}`),
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
  
  // Publications
  getMyPublications: (params) => axiosInstance.get('/teacher/publications', { params }),
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
  downloadFile: (fileId) => axiosInstance.get(`/files/${fileId}`, { responseType: 'blob' }),
};