const express = require('express');
const router = express.Router();
const { 
  getTeacherDashboard, 
  getAssignedClasses, 
  getSubjectsByClass,
  getMainTeacherDashboard 
} = require('../controllers/teacherController');
const { createGrade, getClassGrades } = require('../controllers/gradeController');
const { createAppreciation, getClassAppreciations } = require('../controllers/appreciationController');
const { auth, authorize } = require('../middleware/auth');
const { canAccessClass, isMainTeacher } = require('../middleware/teacherPermissions');

// Toutes les routes nécessitent l'authentification et le rôle teacher
router.use(auth, authorize('teacher'));

// Dashboard enseignant
router.get('/dashboard', getTeacherDashboard);
router.get('/classes', getAssignedClasses);

// Gestion des notes
router.post('/classes/:classId/grades', canAccessClass, createGrade);
router.get('/classes/:classId/grades', canAccessClass, getClassGrades);
router.get('/classes/:classId/subjects', canAccessClass, getSubjectsByClass);

// Dashboard prof principal
router.get('/classes/:classId/main-teacher', canAccessClass, isMainTeacher, getMainTeacherDashboard);

// Appréciations (prof principal)
router.post('/appreciations', createAppreciation);
router.get('/classes/:classId/appreciations', canAccessClass, isMainTeacher, getClassAppreciations);

// Récupérer les matières d'une classe
router.get('/classes/:classId/subjects', teacherController.getClassSubjects)

// Dashboard prof principal
router.get('/classes/:classId/main-teacher', getMainTeacherDashboard)

module.exports = router;