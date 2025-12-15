const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const {
    createTeacher,
    createStudent,
    createClass,
    createSubject,
    assignClassPrincipal,
    createPublication,
    getStats,
    getAllTeachers,
    getAllStudents,
    getAllClasses,
    updateUser,
    deleteUser
} = require('../controllers/adminController');

// Toutes les routes sont protégées et nécessitent le rôle admin
router.use(protect);
router.use(authorize('admin'));

// Routes pour les enseignants
router.route('/teachers')
    .post(createTeacher)
    .get(getAllTeachers);

// Routes pour les apprenants
router.route('/students')
    .post(createStudent)
    .get(getAllStudents);

// Routes pour les classes
router.route('/classes')
    .post(createClass)
    .get(getAllClasses);

router.put('/classes/:classId/principal', assignClassPrincipal);

// Routes pour les matières
router.post('/subjects', createSubject);

// Routes pour les publications
router.post('/publications', createPublication);

// Routes pour les statistiques
router.get('/stats', getStats);

// Routes pour la gestion des utilisateurs
router.route('/users/:userId')
    .put(updateUser)
    .delete(deleteUser);

module.exports = router;