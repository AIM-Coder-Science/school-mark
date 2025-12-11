// backend/src/controllers/adminController.js
const { User, Student, Teacher, Class, Subject, TeacherClassSubject, News, sequelize, Op } = require('../models');


// Statistiques admin - VERSION CORRIGÉE
const getAdminDashboard = async (req, res) => {
  try {
    console.log('📊 Dashboard admin - Début récupération');
    
    // 1. COMPTAGES via User pour plus de fiabilité
    const studentsCount = await User.count({ 
      where: { role: 'student', is_active: true } 
    });

    const teachersCount = await User.count({ 
      where: { role: 'teacher', is_active: true } 
    });

    const classesCount = await Class.count();
    const subjectsCount = await Subject.count();
    const newsCount = await News.count();
    const activeUsersCount = await User.count({ where: { is_active: true } });

    // 2. Derniers étudiants inscrits - CORRECTION DES ASSOCIATIONS
    const recentStudents = await Student.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Class,
          as: 'Class', // ✅ CORRIGÉ : 'Class' au lieu de 'CurrentClass'
          attributes: ['id', 'name', 'level']
        }, 
        {
          model: User,
          as: 'User',
          attributes: ['email', 'is_active']
        }
      ],
      attributes: ['id', 'first_name', 'last_name', 'matricule', 'createdAt']
    });

    // 3. Derniers enseignants
    const recentTeachers = await Teacher.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']],
      include: [{
        model: User,
        as: 'User',
        attributes: ['email', 'is_active']
      }],
      attributes: ['id', 'first_name', 'last_name', 'specialty', 'phone', 'createdAt']
    });

    // 4. Dernières actualités
    const recentNews = await News.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'first_name', 'last_name', 'email']
      }],
      attributes: ['id', 'title', 'content', 'is_published', 'target_roles', 'createdAt']
    });

    // 5. Statistiques des notes
    let gradesStats = [];
    try {
      gradesStats = await sequelize.query(
        `SELECT 
          exam_type as type,
          COUNT(*) as count,
          ROUND(AVG(score), 2) as average 
         FROM grades
         GROUP BY exam_type`,
        { type: sequelize.QueryTypes.SELECT }
      );
    } catch (error) {
      console.warn('⚠️ Impossible de récupérer les stats des notes:', error.message);
    }

    const response = {
      success: true,
      dashboard: {
        statistics: {
          studentsCount,
          teachersCount,
          classesCount,
          subjectsCount,
          newsCount,
          activeUsers: activeUsersCount
        },
        recentStudents: recentStudents.map(s => ({
          id: s.id,
          first_name: s.first_name,
          last_name: s.last_name,
          matricule: s.matricule,
          class: s.Class ? { 
            id: s.Class.id, 
            name: s.Class.name 
          } : { name: 'Non assigné' },
          email: s.User?.email,
          createdAt: s.createdAt
        })),
        recentTeachers: recentTeachers.map(t => ({
          id: t.id,
          first_name: t.first_name,
          last_name: t.last_name,
          specialty: t.specialty,
          phone: t.phone,
          email: t.User?.email,
          createdAt: t.createdAt
        })),
        recentNews: recentNews.map(n => ({
          id: n.id,
          title: n.title,
          content: n.content?.substring(0, 100) + (n.content?.length > 100 ? '...' : ''),
          author: n.author ? `${n.author.first_name || ''} ${n.author.last_name || ''}` : 'Admin',
          is_published: n.is_published,
          createdAt: n.createdAt
        })),
        gradesStatistics: gradesStats
      }
    };

    console.log('✅ Dashboard admin généré avec succès');
    res.json(response);

  } catch (error) {
    console.error('❌ Erreur dashboard admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du dashboard admin',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtenir tous les enseignants - CORRIGÉ
const getAllTeachers = async (req, res) => {
  try {
    console.log('👨‍🏫 Récupération de tous les enseignants');
    
    const teachers = await Teacher.findAll({
      include: [{
        model: User,
        as: 'User',
        attributes: ['id', 'email', 'is_active', 'createdAt']
      }],
      attributes: ['id', 'first_name', 'last_name', 'specialty', 'phone', 'createdAt'],
      order: [['last_name', 'ASC'], ['first_name', 'ASC']]
    });

    res.json({
      success: true,
      teachers,
      count: teachers.length
    });
  } catch (error) {
    console.error('❌ Erreur récupération enseignants:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des enseignants: ' + error.message
    });
  }
};

// Obtenir tous les étudiants - CORRIGÉ
const getAllStudents = async (req, res) => {
  try {
    console.log('👨‍🎓 Récupération de tous les étudiants');
    
    const students = await Student.findAll({
      include: [
        {
          model: User,
          as: 'User',
          attributes: ['id', 'email', 'is_active', 'createdAt']
        },
        {
          model: Class,
          as: 'Class', // ✅ CORRIGÉ
          attributes: ['id', 'name', 'level']
        }
      ],
      attributes: ['id', 'first_name', 'last_name', 'matricule', 'birth_date', 'gender', 'phone', 'createdAt'],
      order: [['last_name', 'ASC'], ['first_name', 'ASC']]
    });

    res.json({
      success: true,
      students,
      count: students.length
    });
  } catch (error) {
    console.error('❌ Erreur récupération étudiants:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des étudiants: ' + error.message
    });
  }
};

// Obtenir toutes les classes
const getAllClasses = async (req, res) => {
  try {
    console.log('🏫 Récupération de toutes les classes');
    
    const classes = await Class.findAll({
      include: [
        {
          model: Teacher,
          as: 'mainTeacher', // Alias pour le professeur principal
          attributes: ['id', 'first_name', 'last_name']
        },
        {
          model: Student,
          as: 'Students', // Alias pour les étudiants
          attributes: ['id']
        }
      ],
      order: [['level', 'ASC'], ['name', 'ASC']]
    });

    // Ajouter le nombre d'étudiants à chaque classe
    const classesWithCount = classes.map(classItem => {
      const classData = classItem.toJSON();
      return {
        ...classData,
        studentCount: classData.Students ? classData.Students.length : 0
      };
    });

    res.json({
      success: true,
      classes: classesWithCount,
      count: classes.length
    });
  } catch (error) {
    console.error('❌ Erreur récupération classes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des classes: ' + error.message
    });
  }
};

// Obtenir toutes les matières
const getAllSubjects = async (req, res) => {
  try {
    console.log('📚 Récupération de toutes les matières');
    
    const subjects = await Subject.findAll({
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      subjects,
      count: subjects.length
    });
  } catch (error) {
    console.error('❌ Erreur récupération matières:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des matières: ' + error.message
    });
  }
};

// Créer un enseignant
const createTeacher = async (req, res) => {
  try {
    const { email, password, first_name, last_name, specialty, phone } = req.body;

    console.log('➕ Création enseignant:', { email, first_name, last_name });

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
      password, // Le middleware de hash devrait être dans le modèle User
      role: 'teacher',
      first_name,
      last_name,
      is_active: true
    });

    // Créer le profil enseignant
    const teacher = await Teacher.create({
      user_id: user.id,
      first_name,
      last_name,
      specialty,
      phone,
      email
    });

    // Récupérer l'enseignant avec les détails complets
    const teacherWithDetails = await Teacher.findByPk(teacher.id, {
      include: [{ 
        model: User, 
        as: 'User',
        attributes: ['id', 'email', 'is_active', 'createdAt'] 
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Enseignant créé avec succès.',
      teacher: teacherWithDetails
    });

    console.log('✅ Enseignant créé:', teacher.id);
  } catch (error) {
    console.error('❌ Erreur création enseignant:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'enseignant: ' + error.message
    });
  }
};

// Supprimer un enseignant
const deleteTeacher = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🗑️ Suppression enseignant:', id);

    const teacher = await Teacher.findByPk(id);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Enseignant non trouvé.'
      });
    }

    // Supprimer d'abord les assignations
    await TeacherClassSubject.destroy({ where: { teacher_id: id } });
    
    // Supprimer le profil enseignant
    await teacher.destroy();
    
    // Supprimer l'utilisateur associé
    await User.destroy({ where: { id: teacher.user_id } });

    res.json({
      success: true,
      message: 'Enseignant supprimé avec succès.'
    });

    console.log('✅ Enseignant supprimé:', id);
  } catch (error) {
    console.error('❌ Erreur suppression enseignant:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'enseignant: ' + error.message
    });
  }
};

// Créer un étudiant
const createStudent = async (req, res) => {
  try {
    const { email, password, first_name, last_name, matricule, birth_date, gender, class_id, phone } = req.body;

    console.log('➕ Création étudiant:', { email, first_name, last_name, matricule });

    // Vérifier si l'email existe déjà
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé.'
      });
    }

    // Vérifier si le matricule existe déjà
    const existingMatricule = await Student.findOne({ where: { matricule } });
    if (existingMatricule) {
      return res.status(400).json({
        success: false,
        message: 'Ce matricule est déjà utilisé.'
      });
    }

    // Créer l'utilisateur
    const user = await User.create({
      email,
      password,
      role: 'student',
      first_name,
      last_name,
      is_active: true
    });

    // Créer le profil étudiant
    const student = await Student.create({
      user_id: user.id,
      first_name,
      last_name,
      matricule,
      birth_date,
      gender,
      class_id,
      phone,
      email
    });

    // Récupérer l'étudiant avec les détails complets
    const studentWithDetails = await Student.findByPk(student.id, {
      include: [
        { 
          model: User, 
          as: 'User',
          attributes: ['id', 'email', 'is_active', 'createdAt'] 
        },
        {
          model: Class,
          as: 'Class',
          attributes: ['id', 'name', 'level']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Étudiant créé avec succès.',
      student: studentWithDetails
    });

    console.log('✅ Étudiant créé:', student.id);
  } catch (error) {
    console.error('❌ Erreur création étudiant:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'étudiant: ' + error.message
    });
  }
};

// Supprimer un étudiant
const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🗑️ Suppression étudiant:', id);

    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Étudiant non trouvé.'
      });
    }

    // Supprimer d'abord les notes de l'étudiant
    const Grade = require('../models').Grade;
    await Grade.destroy({ where: { student_id: id } });
    
    // Supprimer le profil étudiant
    await student.destroy();
    
    // Supprimer l'utilisateur associé
    await User.destroy({ where: { id: student.user_id } });

    res.json({
      success: true,
      message: 'Étudiant supprimé avec succès.'
    });

    console.log('✅ Étudiant supprimé:', id);
  } catch (error) {
    console.error('❌ Erreur suppression étudiant:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'étudiant: ' + error.message
    });
  }
};

// Désactiver/activer un utilisateur
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    console.log('🔄 Changement statut utilisateur:', { id, is_active });

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
      message: `Utilisateur ${is_active ? 'activé' : 'désactivé'} avec succès.`,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        is_active: user.is_active
      }
    });

    console.log('✅ Statut utilisateur changé:', { id, is_active: user.is_active });
  } catch (error) {
    console.error('❌ Erreur changement statut utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de statut: ' + error.message
    });
  }
};

// Assigner un enseignant à une classe/matière
const assignTeacherToClass = async (req, res) => {
  try {
    const { teacher_id, class_id, subject_id, is_main_teacher } = req.body;

    console.log('🔗 Assignment enseignant:', { teacher_id, class_id, subject_id, is_main_teacher });

    // Vérifier si l'enseignant existe
    const teacher = await Teacher.findByPk(teacher_id);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Enseignant non trouvé.'
      });
    }

    // Vérifier si la classe existe
    const classExists = await Class.findByPk(class_id);
    if (!classExists) {
      return res.status(404).json({
        success: false,
        message: 'Classe non trouvée.'
      });
    }

    // Vérifier si la matière existe
    const subject = await Subject.findByPk(subject_id);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Matière non trouvée.'
      });
    }

    // 💡 CORRECTION : Utiliser findOrCreate pour éviter les doublons
    const [assignment, created] = await TeacherClassSubject.findOrCreate({
      where: { 
        teacher_id, 
        class_id, 
        subject_id 
      },
      defaults: {
        is_main_teacher: is_main_teacher || false
      }
    });

    if (!created) {
      // Si l'assignation existe déjà, mettre à jour
      await assignment.update({
        is_main_teacher: is_main_teacher || assignment.is_main_teacher
      });
    }

    res.status(201).json({
      success: true,
      message: created ? 'Enseignant assigné avec succès.' : 'Assignation mise à jour avec succès.',
      assignment,
      created
    });

    console.log('✅ Enseignant assigné:', assignment.id);
  } catch (error) {
    console.error('❌ Erreur assignment enseignant:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'assignation de l\'enseignant: ' + error.message,
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Dans adminController.js
const updateTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, phone, specialty } = req.body;

    const teacher = await Teacher.findByPk(id);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Enseignant non trouvé.'
      });
    }

    await teacher.update({
      first_name,
      last_name,
      phone,
      specialty
    });

    res.json({
      success: true,
      message: 'Enseignant mis à jour avec succès.',
      teacher
    });
  } catch (error) {
    console.error('❌ Erreur mise à jour enseignant:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'enseignant: ' + error.message
    });
  }
};

// Créer une classe
const createClass = async (req, res) => {
  try {
    const { name, level, academic_year, teacher_id } = req.body;

    console.log('➕ Création classe:', { name, level, academic_year, teacher_id });

    const classObj = await Class.create({
      name,
      level,
      academic_year: academic_year || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      main_teacher_id: teacher_id || null
    });

    res.status(201).json({
      success: true,
      message: 'Classe créée avec succès.',
      class: classObj
    });

    console.log('✅ Classe créée:', classObj.id);
  } catch (error) {
    console.error('❌ Erreur création classe:', error);
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

    console.log('➕ Création matière:', { name, coefficient, description });

    const subject = await Subject.create({
      name,
      coefficient: coefficient || 1,
      description: description || null
    });

    res.status(201).json({
      success: true,
      message: 'Matière créée avec succès.',
      subject
    });

    console.log('✅ Matière créée:', subject.id);
  } catch (error) {
    console.error('❌ Erreur création matière:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la matière: ' + error.message
    });
  }
};

const checkMainTeacher = async (req, res) => {
  try {
    const { classId } = req.params;

    const mainTeacher = await TeacherClassSubject.findOne({
      where: { 
        class_id: classId,
        is_main_teacher: true 
      },
      include: [
        { model: Teacher, as: 'Teacher', attributes: ['id', 'first_name', 'last_name'] }
      ]
    });

    res.json({
      success: true,
      hasMainTeacher: !!mainTeacher,
      mainTeacher: mainTeacher?.Teacher
    });
  } catch (error) {
    console.error('❌ Erreur vérification prof principal:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification: ' + error.message
    });
  }
};

// Obtenir toutes les données (pour export ou vue d'ensemble)
const getAllData = async (req, res) => {
  try {
    console.log('📦 Récupération de toutes les données admin');
    
    const [
      users,
      students,
      teachers,
      classes,
      subjects
    ] = await Promise.all([
      User.findAll({
        attributes: ['id', 'email', 'role', 'is_active', 'first_name', 'last_name', 'createdAt'],
        order: [['createdAt', 'DESC']]
      }),
      Student.findAll({
        include: [
          { 
            model: User, 
            as: 'User',
            attributes: ['id', 'email', 'is_active', 'createdAt'] 
          },
          { 
            model: Class, 
            as: 'Class',
            attributes: ['id', 'name', 'level'] 
          }
        ],
        order: [['createdAt', 'DESC']]
      }),
      Teacher.findAll({
        include: [
          { 
            model: User, 
            as: 'User',
            attributes: ['id', 'email', 'is_active', 'createdAt'] 
          }
        ],
        order: [['createdAt', 'DESC']]
      }),
      Class.findAll({
        include: [
          { 
            model: Teacher, 
            as: 'mainTeacher',
            attributes: ['id', 'first_name', 'last_name']
          },
          {
            model: Student,
            as: 'Students',
            attributes: ['id']
          }
        ],
        order: [['level', 'ASC'], ['name', 'ASC']]
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
      message: 'Erreur lors de la récupération des données: ' + error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

module.exports = {
  getAdminDashboard,
  getAllTeachers,
  getAllStudents,
  getAllClasses,
  getAllSubjects,
  createTeacher,
  deleteTeacher,
  createStudent,
  deleteStudent,
  toggleUserStatus,
  assignTeacherToClass,
  createClass,
  createSubject,
  getAllData,
  updateTeacher,
  checkMainTeacher
};