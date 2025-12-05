const express = require('express');
const router = express.Router();
const { 
  createNews, 
  getNews, 
  getNewsById,
  updateNews, 
  deleteNews,
  searchNews
} = require('../controllers/newsController');
const { auth, authorize } = require('../middleware/auth');

// Routes publiques pour la lecture des actualités (authentifiées)
router.get('/', auth, getNews);
router.get('/search', auth, searchNews);
router.get('/:id', auth, getNewsById);

// Routes protégées pour la création/modification (admin et teachers)
router.post('/', auth, authorize('admin', 'teacher'), createNews);
router.put('/:id', auth, authorize('admin', 'teacher'), updateNews);
router.delete('/:id', auth, authorize('admin', 'teacher'), deleteNews);

module.exports = router;