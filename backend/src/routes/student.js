const express = require('express');
const router = express.Router();
const { 
  getStudentDashboard, 
  getReportCard 
} = require('../controllers/studentController');
const { getNews } = require('../controllers/newsController');
const { auth, authorize } = require('../middleware/auth');

// Toutes les routes nécessitent l'authentification et le rôle student
router.use(auth, authorize('student'));

// Dashboard étudiant
router.get('/dashboard', getStudentDashboard);
router.get('/report-card', getReportCard);
router.get('/report-card/:semester', getReportCard);

// Actualités
router.get('/news', getNews);

module.exports = router;