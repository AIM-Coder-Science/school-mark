const express = require('express');
const router = express.Router();
const { 
  getAdminDashboard,
  createTeacher,
  deleteTeacher,
  assignTeacherToClass,
  createClass,
  createSubject,
  getAllData,
  toggleUserStatus
} = require('../controllers/adminController');
const { createNews, getNews, updateNews, deleteNews } = require('../controllers/newsController');
const { auth, authorize } = require('../middleware/auth');

// Import des modèles
const { Teacher, User, Student, Class, Subject } = require('../models');
const bcrypt = require('bcryptjs');

// Toutes les routes nécessitent l'authentification et le rôle admin
router.use(auth, authorize('admin'));

// Dashboard admin
router.get('/dashboard', getAdminDashboard);
router.get('/all-data', getAllData);

// Gestion des enseignants
router.get('/teachers', getAllTeachers);
router.post('/teachers', createTeacher);
router.delete('/teachers/:id', deleteTeacher);
router.post('/teachers/assign', assignTeacherToClass);

// Gestion des étudiants
router.get('/students', getAllStudents);
router.post('/students', createStudent);
router.delete('/students/:id', deleteStudent); // CORRIGÉ : fonction maintenant définie
router.put('/students/:id', updateStudent);

// Gestion des utilisateurs
router.patch('/users/:id/status', toggleUserStatus);

// Gestion des classes
router.get('/classes', getAllClasses);
router.post('/classes', createClass);
router.put('/classes/:id', updateClass);
router.delete('/classes/:id', deleteClass);

// Gestion des matières
router.get('/subjects', getAllSubjects);
router.post('/subjects', createSubject);
router.put('/subjects/:id', updateSubject);
router.delete('/subjects/:id', deleteSubject);

// Gestion des actualités
router.get('/news', getNews);
router.post('/news', createNews);
router.put('/news/:id', updateNews);
router.delete('/news/:id', deleteNews);

// Fonctions manquantes
async function getAllTeachers(req, res) {
  try {
    const teachers = await Teacher.findAll({
      include: [{ 
        model: User, 
        attributes: ['id', 'email', 'is_active', 'createdAt'] 
      }],
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, teachers });
  } catch (error) {
    console.error('Erreur récupération enseignants:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

async function getAllStudents(req, res) {
  try {
    const students = await Student.findAll({
      include: [
        { 
          model: User, 
          attributes: ['id', 'email', 'is_active', 'createdAt'] 
        },
        { 
          model: Class,
          attributes: ['id', 'name', 'level']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, students });
  } catch (error) {
    console.error('Erreur récupération étudiants:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

async function getAllClasses(req, res) {
  try {
    const classes = await Class.findAll({
      include: [{ 
        model: Teacher, 
        as: 'mainTeacher',
        attributes: ['id', 'first_name', 'last_name']
      }],
      order: [['name', 'ASC']]
    });
    res.json({ success: true, classes });
  } catch (error) {
    console.error('Erreur récupération classes:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

async function getAllSubjects(req, res) {
  try {
    const subjects = await Subject.findAll({
      order: [['name', 'ASC']]
    });
    res.json({ success: true, subjects });
  } catch (error) {
    console.error('Erreur récupération matières:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

async function createStudent(req, res) {
  try {
    const { email, password, first_name, last_name, matricule, class_id, phone, birth_date } = req.body;

    // Vérifier si l'email existe déjà
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé.'
      });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password || 'password123', 10);

    // Créer l'utilisateur
    const user = await User.create({
      email,
      password: hashedPassword,
      role: 'student',
      is_active: true
    });

    // Générer un matricule si non fourni
    const studentMatricule = matricule || `ETU${Date.now().toString().slice(-6)}`;

    // Créer l'étudiant
    const student = await Student.create({
      user_id: user.id,
      first_name,
      last_name,
      matricule: studentMatricule,
      class_id: class_id || null,
      phone: phone || '',
      birth_date: birth_date || null
    });

    // Récupérer l'étudiant avec ses relations
    const studentWithDetails = await Student.findByPk(student.id, {
      include: [
        { 
          model: User, 
          attributes: ['email', 'is_active'] 
        },
        { 
          model: Class
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Étudiant créé avec succès',
      student: studentWithDetails
    });
  } catch (error) {
    console.error('Erreur création étudiant:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la création de l\'étudiant: ' + error.message 
    });
  }
}

async function updateStudent(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Étudiant non trouvé.'
      });
    }

    await student.update(updateData);

    const updatedStudent = await Student.findByPk(id, {
      include: [
        { model: User },
        { model: Class }
      ]
    });

    res.json({
      success: true,
      message: 'Étudiant mis à jour avec succès',
      student: updatedStudent
    });
  } catch (error) {
    console.error('Erreur mise à jour étudiant:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'étudiant.'
    });
  }
}

async function deleteStudent(req, res) { // FONCTION AJOUTÉE
  try {
    const { id } = req.params;

    const student = await Student.findByPk(id, {
      include: [{ model: User }]
    });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Étudiant non trouvé.'
      });
    }

    // Désactiver l'utilisateur plutôt que de le supprimer (pour garder l'historique)
    if (student.User) {
      await student.User.update({ is_active: false });
    }

    res.json({
      success: true,
      message: 'Étudiant désactivé avec succès.',
      studentId: id
    });
  } catch (error) {
    console.error('Erreur suppression étudiant:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la désactivation de l\'étudiant.'
    });
  }
}

async function updateClass(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const classObj = await Class.findByPk(id);
    if (!classObj) {
      return res.status(404).json({
        success: false,
        message: 'Classe non trouvée.'
      });
    }

    await classObj.update(updateData);

    const updatedClass = await Class.findByPk(id, {
      include: [{ model: Teacher, as: 'mainTeacher' }]
    });

    res.json({
      success: true,
      message: 'Classe mise à jour avec succès',
      class: updatedClass
    });
  } catch (error) {
    console.error('Erreur mise à jour classe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la classe.'
    });
  }
}

async function deleteClass(req, res) {
  try {
    const { id } = req.params;

    const classObj = await Class.findByPk(id);
    if (!classObj) {
      return res.status(404).json({
        success: false,
        message: 'Classe non trouvée.'
      });
    }

    await classObj.destroy();

    res.json({
      success: true,
      message: 'Classe supprimée avec succès.'
    });
  } catch (error) {
    console.error('Erreur suppression classe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la classe.'
    });
  }
}

async function updateSubject(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const subject = await Subject.findByPk(id);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Matière non trouvée.'
      });
    }

    await subject.update(updateData);

    res.json({
      success: true,
      message: 'Matière mise à jour avec succès',
      subject
    });
  } catch (error) {
    console.error('Erreur mise à jour matière:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la matière.'
    });
  }
}

async function deleteSubject(req, res) {
  try {
    const { id } = req.params;

    const subject = await Subject.findByPk(id);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Matière non trouvée.'
      });
    }

    await subject.destroy();

    res.json({
      success: true,
      message: 'Matière supprimée avec succès.'
    });
  } catch (error) {
    console.error('Erreur suppression matière:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la matière.'
    });
  }
}

module.exports = router;