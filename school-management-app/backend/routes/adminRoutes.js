// Dans votre fichier routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  // Teachers
  createTeacher,
  getTeacher,
  getAllTeachers,
  updateTeacher,
  
  // Students
  createStudent,
  getStudent,
  getAllStudents,
  updateStudent,
  
  // Classes
  createClass,
  getClass,
  getAllClasses,
  updateClass,
  deleteClass,
  assignClassPrincipal,
  
  // Subjects
  createSubject,
  getAllSubjects,
  getSubject,
  updateSubject,
  deleteSubject,
  
  // Publications
  createPublication,
  
  // Stats
  getStats,
  
  // Users
  updateUser,
  deleteUser,
  toggleUserStatus,
} = require('../controllers/adminController');

// Appliquer la protection à toutes les routes
router.use(protect);
router.use(authorize('admin'));

// ========== TEACHERS ROUTES ==========
router.route('/teachers')
  .post(createTeacher)
  .get(getAllTeachers);

router.route('/teachers/:teacherId')
  .get(getTeacher)
  .put(updateTeacher);

// ========== STUDENTS ROUTES ==========
router.route('/students')
  .post(createStudent)
  .get(getAllStudents);

router.route('/students/:studentId')
  .get(getStudent)
  .put(updateStudent);

// ========== CLASSES ROUTES ==========
router.route('/classes')
  .post(createClass)
  .get(getAllClasses);

router.route('/classes/:classId')
  .get(getClass)
  .put(updateClass)
  .delete(deleteClass);

router.put('/classes/:classId/principal', assignClassPrincipal);

// ========== SUBJECTS ROUTES ==========
router.route('/subjects')
  .post(createSubject)
  .get(getAllSubjects);

router.route('/subjects/:subjectId')
  .get(getSubject)
  .put(updateSubject)
  .delete(deleteSubject);

// ========== PUBLICATIONS ROUTES ==========
router.post('/publications', createPublication);

// ========== STATS ROUTES ==========
router.get('/stats', getStats);

// ========== USERS ROUTES ==========
router.route('/users/:userId')
  .put(updateUser)
  .delete(deleteUser);

// Toggle user status (activer/désactiver)
router.patch('/users/:userId/status', toggleUserStatus);

// Reset password
router.patch('/users/:userId/reset-password', async (req, res) => {
  const transaction = await require('../config/database').transaction();
  const bcrypt = require('bcryptjs');
  const { User } = require('../models');
  
  try {
    const { userId } = req.params;
    const { password } = req.body;

    if (!password) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe est requis'
      });
    }

    const user = await User.findByPk(userId, { transaction });
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Hasher le nouveau mot de passe
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    
    await user.save({ transaction });
    await transaction.commit();

    res.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Erreur reset password:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

module.exports = router;