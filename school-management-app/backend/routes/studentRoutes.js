const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getProfile,
    getMyGrades,
    getMyBulletins,
    getPublications,
    getMySubjects,
    getMyRanking,
    getStudentStats
} = require('../controllers/studentController');

// Toutes les routes sont protégées et nécessitent le rôle student
router.use(protect);
router.use(authorize('student'));

// Routes pour le profil
router.get('/profile', getProfile);

// Routes pour les notes
router.get('/grades', getMyGrades);

// Routes pour les bulletins
router.get('/bulletins', getMyBulletins);

// Routes pour les publications
router.get('/publications', getPublications);

// Routes pour les matières
router.get('/subjects', getMySubjects);

// Routes pour le classement
router.get('/ranking', getMyRanking);

// Statistiques
router.get('/stats', getStudentStats);

module.exports = router;