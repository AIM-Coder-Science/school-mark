const express = require('express');
const router = express.Router();

// Importer toutes les routes
const authRoutes = require('./auth');
const teacherRoutes = require('./teacher');
const studentRoutes = require('./student');
const adminRoutes = require('./admin');
const gradeRoutes = require('./grades');
const newsRoutes = require('./news');
const appreciationRoutes = require('./appreciations');
const utilRoutes = require('./utils');

// Monter toutes les routes
router.use('/auth', authRoutes);
router.use('/teacher', teacherRoutes);
router.use('/student', studentRoutes);
router.use('/admin', adminRoutes);
router.use('/grades', gradeRoutes);
router.use('/news', newsRoutes);
router.use('/appreciations', appreciationRoutes);
router.use('/utils', utilRoutes);

// Route de santé de l'API
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'School Mark API is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Route 404 - Pour toutes les autres routes non définies
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} non trouvée.`
  });
});

module.exports = router;