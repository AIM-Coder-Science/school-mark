const express = require('express');
const router = express.Router();
const { 
  getAdminDashboard,
  createTeacher,
  deleteTeacher,
  deleteStudent,
  toggleUserStatus,
  assignTeacherToClass,
  createClass,
  createSubject,
  getAllData
} = require('../controllers/adminController');
const { createNews, getNews, updateNews, deleteNews } = require('../controllers/newsController');
const { auth, authorize } = require('../middleware/auth');

// Import des modèles
const { Teacher, User, Student, Class, Subject } = require('../models');

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
router.delete('/students/:id', deleteStudent);

// Gestion des utilisateurs
router.patch('/users/:id/status', toggleUserStatus);

// Gestion des classes
router.get('/classes', getAllClasses);
router.post('/classes', createClass);

// Gestion des matières
router.get('/subjects', getAllSubjects);
router.post('/subjects', createSubject);

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
        as: 'User',  // <-- AJOUTE CETTE LIGNE
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
          as: 'User',  // <-- AJOUTE CETTE LIGNE
          attributes: ['id', 'email', 'is_active', 'createdAt'] 
        },
        { 
          model: Class,
          as: 'Class',  // <-- AJOUTE CETTE LIGNE
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

    // Créer l'utilisateur
    const user = await User.create({
      email,
      password,
      role: 'student'
    });

    // Générer un matricule si non fourni
    const studentMatricule = matricule || `ETU${Date.now()}`;

    // Créer l'étudiant
    const student = await Student.create({
      user_id: user.id,
      first_name,
      last_name,
      matricule: studentMatricule,
      class_id: class_id || null,
      phone,
      birth_date: birth_date || null
    });

    // Récupérer l'étudiant avec ses relations - AVEC ALIAS
    const studentWithDetails = await Student.findByPk(student.id, {
      include: [
        { 
          model: User, 
          as: 'User',  // <-- AJOUTE CETTE LIGNE
          attributes: ['email', 'is_active'] 
        },
        { 
          model: Class,
          as: 'Class'  // <-- AJOUTE CETTE LIGNE
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

module.exports = router;