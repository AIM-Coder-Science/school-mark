// src/routes/teacher.js
const express = require('express');
const router = express.Router();

// Import des contrôleurs
const { 
  getTeacherDashboard, 
  getAssignedClasses, 
  getSubjectsByClass,
  getMainTeacherDashboard,
  getClassStudents,
  getMyStudents
} = require('../controllers/teacherController');

const { createGrade, getClassGrades, updateGrade, deleteGrade } = require('../controllers/gradeController');
const { createAppreciation, getClassAppreciations } = require('../controllers/appreciationController');

// Import des middleware
const { auth, authorize, teacherAccessControl } = require('../middleware/auth');
const { 
  canViewStudents, 
  canAccessClass, 
  canModifyGrade, 
  isMainTeacher,
  addTeacherPermissions 
} = require('../middleware/teacherPermissions');

// Logging pour débogage
console.log('🛠️ Chargement routes teacher...');

// Toutes les routes nécessitent l'authentification et le rôle teacher
router.use(auth, authorize('teacher'), teacherAccessControl, addTeacherPermissions);

// Middleware pour vérifier si l'enseignant peut voir les étudiants
router.use(canViewStudents);

// Route de test
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Route teacher fonctionnelle',
    user: {
      id: req.user.id,
      role: req.user.role,
      teacherId: req.user.teacherId,
      isMainTeacher: req.user.isMainTeacher,
      canViewStudents: req.canViewStudents
    }
  });
});

// Dashboard enseignant
router.get('/dashboard', getTeacherDashboard);

// Classes assignées
router.get('/classes', getAssignedClasses);

// Étudiants (seulement si prof principal)
router.get('/students', (req, res) => {
  console.log('👥 Route /students appelée, canViewStudents:', req.canViewStudents);
  
  if (!req.canViewStudents) {
    return res.status(403).json({
      success: false,
      message: 'Seuls les professeurs principaux peuvent accéder à la liste des étudiants.',
      userInfo: {
        isMainTeacher: req.user.isMainTeacher,
        teacherId: req.user.teacherId
      }
    });
  }
  
  // Appeler le contrôleur approprié
  getMyStudents(req, res);
});

// Étudiants d'une classe spécifique
router.get('/classes/:classId/students', canAccessClass, getClassStudents);

// Gestion des notes
router.post('/classes/:classId/grades', canAccessClass, createGrade);
router.get('/classes/:classId/grades', canAccessClass, getClassGrades);
router.put('/grades/:gradeId', canModifyGrade, updateGrade);
router.delete('/grades/:gradeId', canModifyGrade, deleteGrade);

// Matières d'une classe
router.get('/classes/:classId/subjects', canAccessClass, getSubjectsByClass);

// Dashboard prof principal
router.get('/classes/:classId/main-teacher', canAccessClass, isMainTeacher, getMainTeacherDashboard);

// Appréciations (prof principal)
router.post('/appreciations', isMainTeacher, createAppreciation);
router.get('/classes/:classId/appreciations', canAccessClass, isMainTeacher, getClassAppreciations);

// Info permissions de l'enseignant
router.get('/permissions', (req, res) => {
  res.json({
    success: true,
    permissions: {
      isMainTeacher: req.user.isMainTeacher || false,
      canViewStudents: req.canViewStudents || false,
      teacherId: req.user.teacherId,
      mainTeacherCount: req.user.mainTeacherCount || 0
    },
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role
    }
  });
});

console.log('✅ Routes teacher chargées avec succès');

module.exports = router;