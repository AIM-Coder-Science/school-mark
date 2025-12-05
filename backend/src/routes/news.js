const express = require('express');
const router = express.Router();
const { 
  createNews, 
  getNews, 
  updateNews, 
  deleteNews 
} = require('../controllers/newsController');
const { auth, authorize } = require('../middleware/auth');

// Routes publiques pour la lecture des actualités
router.get('/', auth, getNews);

// Routes protégées pour la création/modification (admin et teachers)
router.post('/', auth, authorize('admin', 'teacher'), createNews);
router.put('/:id', auth, authorize('admin', 'teacher'), updateNews);
router.delete('/:id', auth, authorize('admin', 'teacher'), deleteNews);

module.exports = router;