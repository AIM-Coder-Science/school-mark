const { User, Student, Teacher, Class, Subject, TeacherClassSubject, AcademicYear, sequelize } = require('../models');

// Statistiques admin
const getAdminDashboard = async (req, res) => {
  try {
    console.log('📊 Dashboard admin - Début');
    
    // Compter les utilisateurs par rôle
    const userCounts = await User.findAll({
      attributes: ['role', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['role'],
      raw: true
    });

    // Compter les étudiants actifs
    const activeStudentsCount = await Student.count({
      include: [{
        model: User,
        where: { is_active: true },
        attributes: []
      }]
    });

    // Compter les enseignants actifs
    const activeTeachersCount = await Teacher.count({
      include: [{
        model: User,
        where: { is_active: true },
        attributes: []
      }]
    });

    // Compter les classes
    const classesCount = await Class.count();
    
    // Compter les matières
    const subjectsCount = await Subject.count();

    // Dernières actualités
    const recentNews = await News.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [{
        model: User,
        as: 'author',
        attributes: ['email']
      }]
    });

    // Statistiques des utilisateurs
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { is_active: true } });
    const inactiveUsers = await User.count({ where: { is_active: false } });

    const response = {
      success: true,
      data: {
        counts: {
          students: activeStudentsCount,
          teachers: activeTeachersCount,
          classes: classesCount,
          subjects: subjectsCount,
          totalUsers,
          activeUsers,
          inactiveUsers
        },
        userStats: userCounts,
        recentNews: recentNews.map(news => ({
          id: news.id,
          title: news.title,
          author: news.author?.email || 'Inconnu',
          createdAt: news.createdAt
        })),
        summary: {
          totalActiveAccounts: activeStudentsCount + activeTeachersCount,
          systemStatus: 'Opérationnel'
        }
      }
    };

    console.log('✅ Dashboard admin généré:', {
      students: activeStudentsCount,
      teachers: activeTeachersCount,
      classes: classesCount
    });

    res.json(response);
  } catch (error) {
    console.error('❌ Erreur dashboard admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du dashboard admin.',
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
// src/controllers/adminController.js - getAllData
const getAllData = async (req, res) => {
  try {
    console.log('📦 Récupération de toutes les données admin');
    
    // Récupérer tout en parallèle
    const [
      users,
      students,
      teachers,
      classes,
      subjects
    ] = await Promise.all([
      User.findAll({
        attributes: ['id', 'email', 'role', 'is_active', 'createdAt'],
        order: [['createdAt', 'DESC']]
      }),
      Student.findAll({
        include: [
          { model: User, attributes: ['email', 'is_active'] },
          { model: Class, attributes: ['name', 'level'] }
        ],
        order: [['createdAt', 'DESC']]
      }),
      Teacher.findAll({
        include: [
          { model: User, attributes: ['email', 'is_active'] }
        ],
        order: [['createdAt', 'DESC']]
      }),
      Class.findAll({
        include: [
          { 
            model: Teacher, 
            as: 'mainTeacher',
            attributes: ['first_name', 'last_name']
          },
          {
            model: Student,
            attributes: ['id']
          }
        ],
        order: [['name', 'ASC']]
      }),
      Subject.findAll({
        order: [['name', 'ASC']]
      })
    ]);

    const response = {
      success: true,
      data: {
        users: users.map(u => u.toJSON()),
        students: students.map(s => s.toJSON()),
        teachers: teachers.map(t => t.toJSON()),
        classes: classes.map(c => {
          const classData = c.toJSON();
          return {
            ...classData,
            studentCount: classData.Students ? classData.Students.length : 0
          };
        }),
        subjects: subjects.map(s => s.toJSON())
      },
      counts: {
        totalUsers: users.length,
        totalStudents: students.length,
        totalTeachers: teachers.length,
        totalClasses: classes.length,
        totalSubjects: subjects.length
      }
    };

    console.log('✅ Toutes les données récupérées:', response.counts);
    res.json(response);
  } catch (error) {
    console.error('❌ Erreur récupération données admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des données.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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