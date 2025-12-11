// src/routes/teacher.js
const express = require('express');
const router = express.Router();

// Import des contrôleurs
const teacherController = require('../controllers/teacherController');
const gradeController = require('../controllers/gradeController');
const { createAppreciation, getClassAppreciations } = require('../controllers/appreciationController');
const { getNews, createNews, updateNews, deleteNews, searchNews } = require('../controllers/newsController');

// Import des middleware
const { auth, authorize, teacherAccessControl } = require('../middleware/auth');
const { 
  canViewStudents, 
  canAccessClass, 
  canModifyGrade, 
  isMainTeacher,
  addTeacherPermissions,
  canManageAppreciations,
  checkTeacherPermissions 
} = require('../middleware/teacherPermissions');

// Logging pour débogage
console.log('🛠️ Chargement routes teacher...');

// === MIDDLEWARE GLOBAUX ===
// Toutes les routes nécessitent l'authentification et le rôle teacher
router.use(auth, authorize('teacher'), teacherAccessControl, addTeacherPermissions, checkTeacherPermissions);

// === ROUTES DE TEST ET INFORMATIONS ===
// Route de test
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Route teacher fonctionnelle',
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      teacherId: req.user.teacherId,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      specialty: req.user.specialty
    },
    permissions: {
      isMainTeacher: req.user.isMainTeacher || false,
      mainTeacherCount: req.user.mainTeacherCount || 0,
      canViewStudents: req.canViewStudents || false,
      teacherPermissions: req.teacherPermissions || {}
    }
  });
});

// Info permissions de l'enseignant (détaillée)
router.get('/permissions', (req, res) => {
  res.json({
    success: true,
    permissions: {
      isMainTeacher: req.user.isMainTeacher || false,
      canViewStudents: req.canViewStudents || false,
      teacherId: req.user.teacherId,
      mainTeacherCount: req.user.mainTeacherCount || 0,
      fullPermissions: req.teacherPermissions || {
        isMainTeacher: false,
        classes: [],
        mainTeacherClasses: [],
        canManageGrades: false,
        canManageAppreciations: false
      }
    },
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      specialty: req.user.specialty
    }
  });
});

// === DASHBOARD ET INFORMATIONS ===
// Dashboard enseignant
router.get('/dashboard', teacherController.getTeacherDashboard);

// Classes assignées (format simplifié)
router.get('/classes', teacherController.getAssignedClasses);

// Classes assignées avec matières (pour la saisie des notes)
router.get('/classes-with-subjects', teacherController.getAssignedClasses);

// Matières d'une classe
//router.get('/classes/:classId/subjects', canAccessClass, teacherController.getSubjectsByClass);

// Dashboard prof principal (si applicable)
router.get('/classes/:classId/main-teacher', canAccessClass, isMainTeacher, teacherController.getPrincipalTeacherDashboard);

// Étudiants d'une classe
router.get('/classes/:classId/students', canAccessClass, teacherController.getClassStudents);

// === GESTION DES ÉTUDIANTS ===
// Étudiants (seulement si prof principal)
//router.get('/students', canViewStudents, teacherController.getMyStudents);

// === GESTION DES NOTES ===
// Obtenir les notes d'une classe (liste)
//router.get('/classes/:classId/grades', canAccessClass, gradeController.getClassGrades);

// Obtenir les détails des notes d'une classe (format tableau)
router.get('/classes/:classId/grades/details', canAccessClass, gradeController.getClassGradesDetails);

// Créer une note pour une classe
router.post('/classes/:classId/grades', canAccessClass, gradeController.createGrade);

// Sauvegarder plusieurs notes en une fois
router.post('/classes/:classId/grades/bulk', canAccessClass, gradeController.saveBulkGrades);

// Mettre à jour une note (seulement l'auteur ou prof principal)
router.put('/grades/:gradeId', canModifyGrade, gradeController.updateGrade);

// Supprimer une note (seulement l'auteur ou prof principal)
router.delete('/grades/:gradeId', canModifyGrade, gradeController.deleteGrade);

// === GESTION DES APPRÉCIATIONS ===
// Créer une appréciation (prof principal seulement)
router.post('/appreciations', canManageAppreciations, createAppreciation);

// Obtenir les appréciations d'une classe (prof principal seulement)
router.get('/classes/:classId/appreciations', canAccessClass, canManageAppreciations, getClassAppreciations);

// === GESTION DES ACTUALITÉS ===
// Obtenir les actualités pour enseignants
router.get('/news', getNews);

// Créer une actualité
router.post('/news', createNews);

// Mettre à jour une actualité (seulement l'auteur)
router.put('/news/:id', async (req, res, next) => {
  try {
    // Vérifier si l'utilisateur est l'auteur de l'actualité
    const News = require('../models').News;
    const news = await News.findByPk(req.params.id);
    
    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'Actualité non trouvée.'
      });
    }
    
    if (news.author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à modifier cette actualité.'
      });
    }
    
    // Si c'est l'auteur, passer à la mise à jour
    next();
  } catch (error) {
    console.error('❌ Erreur vérification auteur actualité:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification des permissions.'
    });
  }
}, updateNews);

// Supprimer une actualité (seulement l'auteur)
router.delete('/news/:id', async (req, res, next) => {
  try {
    // Vérifier si l'utilisateur est l'auteur de l'actualité
    const News = require('../models').News;
    const news = await News.findByPk(req.params.id);
    
    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'Actualité non trouvée.'
      });
    }
    
    if (news.author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à supprimer cette actualité.'
      });
    }
    
    // Si c'est l'auteur, passer à la suppression
    next();
  } catch (error) {
    console.error('❌ Erreur vérification auteur actualité:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification des permissions.'
    });
  }
}, deleteNews);

// === ROUTES SPÉCIFIQUES POUR LES ACTUALITÉS ===
// Actualités récentes (moins de 7 jours)
router.get('/news/recent', (req, res) => {
  // Rediriger vers la route principale avec un paramètre
  req.query.recent = 'true';
  return getNews(req, res);
});

// Actualités importantes
router.get('/news/important', (req, res) => {
  req.query.important = 'true';
  return getNews(req, res);
});

// Recherche d'actualités
router.get('/news/search', (req, res) => {
  return searchNews(req, res);
});

// === ROUTES SUPPLÉMENTAIRES ===
// Statistiques de l'enseignant
router.get('/stats', (req, res) => {
  res.json({
    success: true,
    stats: {
      classesCount: req.teacherPermissions?.classes?.length || 0,
      mainTeacherClassesCount: req.teacherPermissions?.mainTeacherClasses?.length || 0,
      canManageGrades: req.teacherPermissions?.canManageGrades || false,
      canManageAppreciations: req.teacherPermissions?.canManageAppreciations || false,
      isMainTeacher: req.user.isMainTeacher || false
    }
  });
});

// Classes où l'enseignant est prof principal
router.get('/main-teacher-classes', (req, res) => {
  res.json({
    success: true,
    classes: req.teacherPermissions?.mainTeacherClasses || [],
    count: req.teacherPermissions?.mainTeacherClasses?.length || 0
  });
});

// Classes assignées (détaillées)
router.get('/assigned-classes-detailed', teacherController.getAssignedClasses);

// === ROUTES D'ADMINISTRATION (pour les profs principaux) ===
// Informations détaillées sur une classe (prof principal seulement)
router.get('/classes/:classId/details', canAccessClass, isMainTeacher, async (req, res) => {
  try {
    const { Class, Student, Teacher, Subject } = require('../models');
    const classId = req.params.classId;
    
    const classDetails = await Class.findByPk(classId, {
      include: [
        {
          model: Student,
          attributes: ['id', 'first_name', 'last_name', 'matricule', 'email']
        },
        {
          model: Teacher,
          as: 'mainTeacher',
          attributes: ['id', 'first_name', 'last_name', 'specialty']
        },
        {
          model: Subject,
          attributes: ['id', 'name', 'coefficient']
        }
      ]
    });
    
    if (!classDetails) {
      return res.status(404).json({
        success: false,
        message: 'Classe non trouvée.'
      });
    }
    
    res.json({
      success: true,
      class: classDetails
    });
  } catch (error) {
    console.error('❌ Erreur récupération détails classe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des détails de la classe.'
    });
  }
});

// Exporter les statistiques d'une classe (prof principal seulement)
router.get('/classes/:classId/export', canAccessClass, isMainTeacher, (req, res) => {
  res.json({
    success: true,
    message: 'Export des données de la classe (fonctionnalité à implémenter)',
    classId: req.params.classId,
    exportType: 'statistics',
    date: new Date().toISOString()
  });
});

// Test des associations (pour debugging)
//router.get('/test-associations', teacherController.testAssociations);

console.log('✅ Routes teacher chargées avec succès');
console.log('📋 Routes disponibles:');
console.log('  GET  /test                    - Route de test');
console.log('  GET  /dashboard               - Dashboard enseignant');
console.log('  GET  /classes                 - Classes assignées (format simplifié)');
console.log('  GET  /classes-with-subjects   - Classes assignées avec matières (saisie notes)');
console.log('  GET  /students                - Étudiants (prof principal seulement)');
console.log('  GET  /classes/:classId/students - Étudiants d\'une classe');
console.log('  GET  /classes/:classId/grades - Notes d\'une classe (liste)');
console.log('  GET  /classes/:classId/grades/details - Détails des notes (format tableau)');
console.log('  POST /classes/:classId/grades - Ajouter une note');
console.log('  POST /classes/:classId/grades/bulk - Sauvegarder plusieurs notes');
console.log('  PUT  /grades/:gradeId         - Modifier une note');
console.log('  DELETE /grades/:gradeId       - Supprimer une note');
console.log('  GET  /classes/:classId/subjects - Matières d\'une classe');
console.log('  POST /appreciations           - Ajouter une appréciation');
console.log('  GET  /classes/:classId/appreciations - Appréciations d\'une classe');
console.log('  GET  /news                    - Actualités');
console.log('  POST /news                    - Publier une actualité');
console.log('  PUT  /news/:id                - Modifier une actualité');
console.log('  DELETE /news/:id              - Supprimer une actualité');
console.log('  GET  /permissions             - Permissions de l\'enseignant');
console.log('  GET  /stats                   - Statistiques');
console.log('  GET  /main-teacher-classes    - Classes où l\'enseignant est prof principal');
console.log('  GET  /test-associations       - Test des associations (debug)');

module.exports = router;