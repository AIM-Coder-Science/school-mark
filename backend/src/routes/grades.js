const express = require('express');
const router = express.Router();
const { 
  createGrade, 
  getClassGrades,
  updateGrade,
  deleteGrade,
  getStudentGrades
} = require('../controllers/gradeController');
const { auth, authorize } = require('../middleware/auth');
const { canAccessClass } = require('../middleware/teacherPermissions');

// Routes pour la gestion des notes (enseignants)
router.post('/classes/:classId/grades', auth, authorize('teacher'), canAccessClass, createGrade);
router.get('/classes/:classId/grades', auth, authorize('teacher'), canAccessClass, getClassGrades);
router.put('/grades/:id', auth, authorize('teacher'), updateGrade);
router.delete('/grades/:id', auth, authorize('teacher'), deleteGrade);

// Route pour obtenir les notes d'un étudiant (admin/enseignant/étudiant lui-même)
router.get('/students/:studentId/grades', auth, getStudentGrades);

module.exports = router;