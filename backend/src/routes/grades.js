const express = require('express');
const router = express.Router();
const { 
  createGrade, 
  getClassGrades 
} = require('../controllers/gradeController');
const { auth, authorize } = require('../middleware/auth');
const { canAccessClass } = require('../middleware/teacherPermissions');

// Routes pour la gestion des notes
router.post('/classes/:classId/grades', auth, authorize('teacher'), canAccessClass, createGrade);
router.get('/classes/:classId/grades', auth, authorize('teacher'), canAccessClass, getClassGrades);

module.exports = router;