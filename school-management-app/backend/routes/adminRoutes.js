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
    getAllSubjects,
    getClass,
    getSubject,
    updateClass,
    updateSubject,
    updateTeacher,
    deleteClass,
    deleteSubject,
    updateUser,
    deleteUser,
    getTeacher,
    getStudent,
    updateStudent,
    toggleUserStatus,
} = require('../controllers/adminController');

// Toutes les routes sont protégées et nécessitent le rôle admin
router.use(protect);
router.use(authorize('admin'));

// Routes pour les enseignants
router.route('/teachers')
    .post(createTeacher)
    .get(getAllTeachers);

router.route('/teachers/:teacherId')
    .get(getTeacher)
    .put(updateTeacher);

// Routes pour les apprenants
router.route('/students')
    .post(createStudent)
    .get(getAllStudents);

router.route('/students/:studentId')
    .get(getStudent)
    .put(updateStudent);

// Routes pour les classes
router.route('/classes')
    .post(createClass)
    .get(getAllClasses);

router.route('/classes/:classId')
    .get(getClass)
    .put(updateClass)
    .delete(deleteClass);

router.put('/classes/:classId/principal', assignClassPrincipal);

// Routes pour les matières
router.route('/subjects')
    .post(createSubject)
    .get(getAllSubjects);

router.route('/subjects/:subjectId')
    .get(getSubject)
    .put(updateSubject)
    .delete(deleteSubject);

// Routes pour les publications
router.post('/publications', createPublication);

// Routes pour les statistiques
router.get('/stats', getStats);

// Routes pour la gestion des utilisateurs
router.route('/users/:userId')
    .put(updateUser)
    .delete(deleteUser);


// Routes utilisateurs - Toggle status
router.route('/users/:userId/status')
    .patch(toggleUserStatus);

// Route reset password
router.route('/users/:userId/reset-password')
    .patch(
  async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      const { userId } = req.params;
      const { password } = req.body;

      if (!password) {
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
      const bcrypt = require('bcryptjs');
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
  }
);

module.exports = router;