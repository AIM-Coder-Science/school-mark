const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getMyClasses,
    getClassStudents,
    addGrade,
    calculateStudentAverage,
    getClassGrades,
    getPrincipalClasses,
    calculateGeneralAverage,
    addAppreciation,
    getTeacherStats
} = require('../controllers/teacherController');

// Toutes les routes sont protégées et nécessitent le rôle teacher
router.use(protect);
router.use(authorize('teacher'));

// Routes pour les classes
router.get('/classes', getMyClasses);
router.get('/classes/:classId/students', getClassStudents);
router.get('/classes/:classId/subjects/:subjectId/grades', getClassGrades);

// Routes pour les notes
router.post('/grades', addGrade);
router.get('/students/:studentId/subjects/:subjectId/average', calculateStudentAverage);

// Routes pour les professeurs principaux
router.get('/principal-classes', getPrincipalClasses);
router.get('/principal/students/:studentId/general-average', calculateGeneralAverage);
router.post('/principal/students/:studentId/appreciation', addAppreciation);

// Statistiques
router.get('/stats', getTeacherStats);

module.exports = router;