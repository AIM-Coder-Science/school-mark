const express = require('express');
const router = express.Router();

// Importer TOUTES les routes
const authRoutes = require('./auth');
const teacherRoutes = require('./teacher');
const studentRoutes = require('./student');
const adminRoutes = require('./admin');
const gradeRoutes = require('./grades');
const newsRoutes = require('./news');
const appreciationRoutes = require('./appreciations');
const utilRoutes = require('./utils');

// Monter TOUTES les routes
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
    timestamp: new Date().toISOString()
  });
});

// Route 404 - CORRECTION DÉFINITIVE
// Utiliser un middleware sans chemin spécifique pour attraper toutes les routes non trouvées
router.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} non trouvée.`
  });
});

module.exports = router;


/*
const express = require('express');
const router = express.Router();

// Routes imports
const authRoutes = require('./auth');
const teacherRoutes = require('./teacher');
const studentRoutes = require('./student');
const adminRoutes = require('./admin');

// Mount routes
router.use('/auth', authRoutes);
router.use('/teacher', teacherRoutes);
router.use('/student', studentRoutes);
router.use('/admin', adminRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler - SIMPLIFIÉ
router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

module.exports = router;
*/


/*
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

// Définir les endpoints
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
    timestamp: new Date().toISOString()
  });
});
*/
// Route 404 - CORRECTION : utiliser router.all au lieu de router.use
/*
router.all('/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route API non trouvée.',
    path: req.originalUrl
  });
});

module.exports = router;*/