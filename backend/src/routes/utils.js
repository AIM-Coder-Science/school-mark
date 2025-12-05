const express = require('express');
const router = express.Router();
const { 
  calculateGeneralAverage, 
  generateReportCard 
} = require('../controllers/utilsController');
const { auth, authorize } = require('../middleware/auth');

// Routes utilitaires
router.get('/students/:studentId/general-average', auth, calculateGeneralAverage);
router.get('/students/:studentId/general-average/:semester', auth, calculateGeneralAverage);
router.get('/students/:studentId/report-card/:semester', auth, generateReportCard);

// Route pour admin et prof principal
router.get('/students/:studentId/full-report', auth, authorize('admin', 'teacher'), generateReportCard);

module.exports = router;