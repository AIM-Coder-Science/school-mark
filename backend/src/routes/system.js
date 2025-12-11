// src/routes/system.js
const express = require('express');
const router = express.Router();
const { getSystemConfig, updateSystemConfig } = require('../controllers/systemController');
const { auth, authorize } = require('../middleware/auth');

// Route publique pour obtenir la configuration
router.get('/config', getSystemConfig);

// Route protégée pour mettre à jour la configuration (admin seulement)
router.put('/config', auth, authorize('admin'), updateSystemConfig);

console.log('✅ Routes system chargées');

module.exports = router;