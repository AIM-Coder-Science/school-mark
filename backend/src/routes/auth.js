const express = require('express');
const router = express.Router();
const { login, getProfile } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

// Routes publiques - SEULEMENT login
router.post('/login', login);

// Routes protégées
router.get('/profile', auth, getProfile);

module.exports = router;