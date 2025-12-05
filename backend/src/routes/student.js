// src/routes/student.js
const express = require('express');
const router = express.Router();
const { 
  getStudentDashboard, 
  getReportCard,
  getStudentProfile  // IMPORT CORRECT
} = require('../controllers/studentController');
const { getNews } = require('../controllers/newsController');
const { auth, authorize, studentAccessControl } = require('../middleware/auth');

// Toutes les routes nécessitent l'authentification et le rôle student
router.use(auth, authorize('student'), studentAccessControl);

// Dashboard étudiant
router.get('/dashboard', getStudentDashboard);

// Bulletin de notes
router.get('/report-card', getReportCard);
router.get('/report-card/:semester', getReportCard);

// Profil étudiant
router.get('/profile', getStudentProfile);

// Actualités
router.get('/news', getNews);

module.exports = router;