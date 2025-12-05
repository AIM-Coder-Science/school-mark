const express = require('express');
const router = express.Router();
const { 
  createAppreciation, 
  getStudentAppreciations 
} = require('../controllers/appreciationController');
const { auth, authorize } = require('../middleware/auth');

// Routes pour les appréciations
router.post('/', auth, authorize('teacher'), createAppreciation);
router.get('/student/:studentId', auth, getStudentAppreciations);

module.exports = router;