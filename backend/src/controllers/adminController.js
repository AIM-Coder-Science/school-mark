const { User, Student, Teacher, Class, Subject, TeacherClassSubject, AcademicYear, sequelize } = require('../models');

// Statistiques admin
const getAdminDashboard = async (req, res) => {
  try {
    const [
      studentsCount,
      teachersCount,
      classesCount,
      subjectsCount
    ] = await Promise.all([
      Student.count(),
      Teacher.count(),
      Class.count(),
      Subject.count()
    ]);

    // Dernières inscriptions - AVEC LES ALIAS
    const recentStudents = await Student.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [
        { 
          model: Class,
          as: 'Class'  // <-- AJOUTE CETTE LIGNE
        }
      ]
    });

    const recentTeachers = await Teacher.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [
        { 
          model: User, 
          as: 'User',  // <-- AJOUTE CETTE LIGNE
          attributes: ['email'] 
        }
      ]
    });

    res.json({
      success: true,
      dashboard: {
        statistics: {
          studentsCount,
          teachersCount,
          classesCount,
          subjectsCount,
          currentYear: '2023-2024'
        },
        recentStudents,
        recentTeachers
      }
    });
  } catch (error) {
    console.error('Erreur dashboard admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du tableau de bord: ' + error.message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Créer un enseignant
const createTeacher = async (req, res) => {
  try {
    const { email, password, first_name, last_name, specialty, phone } = req.body;

    // Vérifier si l'utilisateur existe déjà
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
      role: 'teacher'
    });

    // Créer le profil enseignant
    const teacher = await Teacher.create({
      user_id: user.id,
      first_name,
      last_name,
      specialty,
      phone
    });

    // Récupérer l'enseignant avec ses relations - AVEC ALIAS
    const teacherWithDetails = await Teacher.findByPk(teacher.id, {
      include: [
        { 
          model: User, 
          as: 'User',  // <-- AJOUTE CETTE LIGNE
          attributes: ['email', 'is_active'] 
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Enseignant créé avec succès.',
      teacher: teacherWithDetails
    });
  } catch (error) {
    console.error('Erreur création enseignant:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'enseignant: ' + error.message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Supprimer un enseignant
const deleteTeacher = async (req, res) => {
  try {
    const { id } = req.params;

    const teacher = await Teacher.findByPk(id);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Enseignant non trouvé.'
      });
    }

    // Supprimer l'utilisateur associé
    await User.destroy({ where: { id: teacher.user_id } });

    res.json({
      success: true,
      message: 'Enseignant supprimé avec succès.'
    });
  } catch (error) {
    console.error('Erreur suppression enseignant:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'enseignant: ' + error.message
    });
  }
};

// Supprimer un étudiant
const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Étudiant non trouvé.'
      });
    }

    // Supprimer l'utilisateur associé
    await User.destroy({ where: { id: student.user_id } });

    res.json({
      success: true,
      message: 'Étudiant supprimé avec succès.'
    });
  } catch (error) {
    console.error('Erreur suppression étudiant:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'étudiant: ' + error.message
    });
  }
};

// Désactiver un utilisateur
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé.'
      });
    }

    await user.update({ is_active });

    res.json({
      success: true,
      message: `Utilisateur ${is_active ? 'activé' : 'désactivé'} avec succès.`
    });
  } catch (error) {
    console.error('Erreur changement statut utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de statut: ' + error.message
    });
  }
};

// Assigner un enseignant à une classe/matière
const assignTeacherToClass = async (req, res) => {
  try {
    const { teacherId, classId, subjectId, is_main_teacher } = req.body;

    // Vérifier si l'assignment existe déjà
    const existingAssignment = await TeacherClassSubject.findOne({
      where: { teacher_id: teacherId, class_id: classId, subject_id: subjectId }
    });

    if (existingAssignment) {
      return res.status(400).json({
        success: false,
        message: 'Cet enseignant est déjà assigné à cette matière dans cette classe.'
      });
    }

    const assignment = await TeacherClassSubject.create({
      teacher_id: teacherId,
      class_id: classId,
      subject_id: subjectId,
      is_main_teacher: is_main_teacher || false
    });

    res.status(201).json({
      success: true,
      message: 'Enseignant assigné avec succès.',
      assignment
    });
  } catch (error) {
    console.error('Erreur assignment enseignant:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'assignation de l\'enseignant: ' + error.message
    });
  }
};

// Créer une classe
const createClass = async (req, res) => {
  try {
    const { name, level, academic_year, teacher_id } = req.body;

    const classObj = await Class.create({
      name,
      level,
      academic_year: academic_year || '2023-2024',
      teacher_id: teacher_id || null
    });

    res.status(201).json({
      success: true,
      message: 'Classe créée avec succès.',
      class: classObj
    });
  } catch (error) {
    console.error('Erreur création classe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la classe: ' + error.message
    });
  }
};

// Créer une matière
const createSubject = async (req, res) => {
  try {
    const { name, coefficient, description } = req.body;

    const subject = await Subject.create({
      name,
      coefficient: coefficient || 1,
      description
    });

    res.status(201).json({
      success: true,
      message: 'Matière créée avec succès.',
      subject
    });
  } catch (error) {
    console.error('Erreur création matière:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la matière: ' + error.message
    });
  }
};

// Obtenir toutes les données
const getAllData = async (req, res) => {
  try {
    const [teachers, students, classes, subjects] = await Promise.all([
      Teacher.findAll({ 
        include: [
          { 
            model: User, 
            as: 'User',  // <-- AJOUTE CETTE LIGNE
            attributes: ['email', 'is_active'] 
          }
        ] 
      }),
      Student.findAll({ 
        include: [
          { 
            model: Class,
            as: 'Class'  // <-- AJOUTE CETTE LIGNE
          }, 
          { 
            model: User, 
            as: 'User',  // <-- AJOUTE CETTE LIGNE
            attributes: ['email', 'is_active'] 
          }
        ] 
      }),
      Class.findAll({ 
        include: [
          { 
            model: Teacher, 
            as: 'mainTeacher' 
          }
        ] 
      }),
      Subject.findAll()
    ]);

    res.json({
      success: true,
      data: {
        teachers,
        students,
        classes,
        subjects
      }
    });
  } catch (error) {
    console.error('Erreur récupération données:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des données: ' + error.message
    });
  }
};

module.exports = {
  getAdminDashboard,
  createTeacher,
  deleteTeacher,
  deleteStudent,
  toggleUserStatus,
  assignTeacherToClass,
  createClass,
  createSubject,
  getAllData
};