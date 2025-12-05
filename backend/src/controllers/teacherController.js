const { Teacher, User, TeacherClassSubject, Class, Subject, Grade, Student, sequelize } = require('../models');

// Tableau de bord enseignant
const getTeacherDashboard = async (req, res) => {
  try {
    console.log('👨‍🏫 GET /teacher/dashboard - Début');
    
    // Vérifier que l'utilisateur a un profil enseignant
    if (!req.user.Teacher || !req.user.Teacher.id) {
      console.log('❌ Profil enseignant manquant pour user:', req.user.id);
      return res.status(403).json({
        success: false,
        message: 'Profil enseignant non trouvé. Contactez l\'administrateur.'
      });
    }

    const teacherId = req.user.Teacher.id;
    console.log('👨‍🏫 ID Enseignant:', teacherId);

    // Récupérer les classes et matières assignées avec les bonnes associations
    const assignments = await TeacherClassSubject.findAll({
      where: { teacher_id: teacherId },
      include: [
        { 
          model: Class,
          as: 'Class',
          attributes: ['id', 'name', 'level', 'academic_year']
        },
        { 
          model: Subject,
          as: 'Subject',
          attributes: ['id', 'name', 'coefficient']
        }
      ],
      attributes: ['id', 'is_main_teacher', 'createdAt']
    });

    console.log('📊 Assignments trouvés:', assignments.length);

    // Statistiques
    const classesCount = new Set(assignments.map(a => a.class_id)).size;
    const subjectsCount = new Set(assignments.map(a => a.subject_id)).size;

    // Classes où l'enseignant est prof principal
    const mainTeacherClasses = assignments
      .filter(a => a.is_main_teacher)
      .map(a => ({
        id: a.Class?.id,
        name: a.Class?.name,
        level: a.Class?.level,
        subject: a.Subject?.name
      }))
      .filter(c => c.id); // Filtrer les classes nulles

    // Récupérer les dernières notes ajoutées
    const recentGrades = await Grade.findAll({
      where: { teacher_id: teacherId },
      include: [
        { 
          model: Student,
          as: 'Student',
          attributes: ['id', 'first_name', 'last_name', 'matricule']
        },
        { 
          model: Subject,
          as: 'Subject',
          attributes: ['name']
        },
        { 
          model: Class,
          as: 'Class',
          attributes: ['name']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    res.json({
      success: true,
      dashboard: {
        teacher: {
          id: req.user.Teacher.id,
          first_name: req.user.Teacher.first_name,
          last_name: req.user.Teacher.last_name,
          specialty: req.user.Teacher.specialty,
          phone: req.user.Teacher.phone
        },
        assignments: assignments.map(a => ({
          id: a.id,
          class: a.Class,
          subject: a.Subject,
          is_main_teacher: a.is_main_teacher,
          created_at: a.createdAt
        })),
        statistics: {
          classesCount,
          subjectsCount,
          mainTeacherClasses: mainTeacherClasses.length,
          totalAssignments: assignments.length
        },
        mainTeacherClasses,
        recentGrades: recentGrades.map(g => ({
          id: g.id,
          student_name: `${g.Student?.first_name} ${g.Student?.last_name}`,
          subject: g.Subject?.name,
          class: g.Class?.name,
          score: g.score,
          exam_type: g.exam_type,
          date: g.createdAt
        }))
      }
    });

    console.log('✅ Dashboard enseignant généré avec succès');
  } catch (error) {
    console.error('❌ Erreur dashboard enseignant DÉTAILLÉE:');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du tableau de bord.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtenir les classes assignées à un enseignant
const getAssignedClasses = async (req, res) => {
  try {
    console.log('👨‍🏫 GET /teacher/classes - Début');
    
    if (!req.user.Teacher || !req.user.Teacher.id) {
      return res.status(403).json({
        success: false,
        message: 'Profil enseignant non trouvé.'
      });
    }

    const teacherId = req.user.Teacher.id;
    console.log('👨‍🏫 ID Enseignant pour classes:', teacherId);

    const assignments = await TeacherClassSubject.findAll({
      where: { teacher_id: teacherId },
      include: [
        { 
          model: Class,
          as: 'Class',
          include: [
            { 
              model: Student,
              as: 'Students',
              attributes: ['id', 'first_name', 'last_name', 'matricule']
            }
          ]
        },
        { 
          model: Subject,
          as: 'Subject',
          attributes: ['id', 'name', 'coefficient']
        }
      ],
      attributes: ['id', 'is_main_teacher'],
      order: [[{ model: Class, as: 'Class' }, 'name', 'ASC']]
    });

    console.log('🏫 Assignments trouvés:', assignments.length);

    // Formater la réponse
    const formattedClasses = assignments.map(assignment => ({
      id: assignment.id,
      class: assignment.Class,
      subject: assignment.Subject,
      is_main_teacher: assignment.is_main_teacher,
      students_count: assignment.Class?.Students?.length || 0
    }));

    // Grouper par classe pour éviter les doublons
    const uniqueClasses = [];
    const classIds = new Set();
    
    formattedClasses.forEach(item => {
      if (item.class && !classIds.has(item.class.id)) {
        classIds.add(item.class.id);
        uniqueClasses.push({
          id: item.class.id,
          name: item.class.name,
          level: item.class.level,
          academic_year: item.class.academic_year,
          students: item.class.Students || [],
          subjects: [] // Initialiser le tableau de matières
        });
      }
    });

    // Ajouter les matières à chaque classe
    formattedClasses.forEach(item => {
      if (item.class && item.Subject) {
        const classObj = uniqueClasses.find(c => c.id === item.class.id);
        if (classObj) {
          classObj.subjects.push({
            id: item.Subject.id,
            name: item.Subject.name,
            coefficient: item.Subject.coefficient,
            is_main_teacher: item.is_main_teacher
          });
        }
      }
    });

    res.json({
      success: true,
      classes: uniqueClasses,
      assignments: formattedClasses,
      teacher: {
        id: req.user.Teacher.id,
        name: `${req.user.Teacher.first_name} ${req.user.Teacher.last_name}`,
        specialty: req.user.Teacher.specialty
      },
      statistics: {
        totalClasses: uniqueClasses.length,
        totalAssignments: assignments.length,
        totalSubjects: new Set(formattedClasses.map(a => a.subject?.id)).size
      }
    });

    console.log('✅ Classes assignées récupérées avec succès');
  } catch (error) {
    console.error('❌ Erreur classes assignées:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des classes: ' + error.message
    });
  }
};

// Obtenir les matières par classe pour un enseignant
const getSubjectsByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    
    if (!req.user.Teacher || !req.user.Teacher.id) {
      return res.status(403).json({
        success: false,
        message: 'Profil enseignant non trouvé.'
      });
    }

    const teacherId = req.user.Teacher.id;
    
    // Vérifier que l'enseignant est assigné à cette classe
    const canAccess = await TeacherClassSubject.findOne({
      where: {
        teacher_id: teacherId,
        class_id: classId
      }
    });

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas assigné à cette classe.'
      });
    }

    const subjects = await TeacherClassSubject.findAll({
      where: {
        teacher_id: teacherId,
        class_id: classId
      },
      include: [
        { 
          model: Subject,
          as: 'Subject',
          attributes: ['id', 'name', 'coefficient', 'description']
        }
      ],
      attributes: ['is_main_teacher']
    });

    res.json({
      success: true,
      class: await Class.findByPk(classId, {
        attributes: ['id', 'name', 'level']
      }),
      subjects: subjects.map(sub => ({
        id: sub.Subject.id,
        name: sub.Subject.name,
        coefficient: sub.Subject.coefficient,
        description: sub.Subject.description,
        is_main_teacher: sub.is_main_teacher
      }))
    });
  } catch (error) {
    console.error('❌ Erreur matières par classe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des matières: ' + error.message
    });
  }
};

// Tableau de bord prof principal
const getMainTeacherDashboard = async (req, res) => {
  try {
    const { classId } = req.params;
    
    if (!req.user.Teacher || !req.user.Teacher.id) {
      return res.status(403).json({
        success: false,
        message: 'Profil enseignant non trouvé.'
      });
    }

    const teacherId = req.user.Teacher.id;

    // Vérifier que l'enseignant est bien prof principal de cette classe
    const isMainTeacher = await TeacherClassSubject.findOne({
      where: {
        teacher_id: teacherId,
        class_id: classId,
        is_main_teacher: true
      }
    });

    if (!isMainTeacher) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Vous n\'êtes pas professeur principal de cette classe.'
      });
    }

    // Récupérer la classe avec ses étudiants
    const classData = await Class.findByPk(classId, {
      include: [
        {
          model: Student,
          as: 'Students',
          attributes: ['id', 'first_name', 'last_name', 'matricule', 'birth_date', 'phone']
        }
      ]
    });

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Classe non trouvée.'
      });
    }

    // Récupérer tous les étudiants de la classe avec leurs notes
    const students = await Student.findAll({
      where: { class_id: classId },
      include: [
        {
          model: Grade,
          as: 'Grades',
          include: [
            { 
              model: Subject,
              as: 'Subject',
              attributes: ['id', 'name']
            }
          ]
        }
      ],
      order: [['last_name', 'ASC'], ['first_name', 'ASC']]
    });

    // Calculer les moyennes générales par étudiant
    const studentsWithAverages = students.map(student => {
      const gradesBySubject = {};
      
      student.Grades?.forEach(grade => {
        if (!gradesBySubject[grade.subject_id]) {
          gradesBySubject[grade.subject_id] = {
            subjectId: grade.subject_id,
            subjectName: grade.Subject?.name,
            grades: [],
            total: 0,
            count: 0
          };
        }
        
        gradesBySubject[grade.subject_id].grades.push({
          id: grade.id,
          score: grade.score,
          coefficient: grade.coefficient,
          exam_type: grade.exam_type,
          date: grade.createdAt
        });
        
        gradesBySubject[grade.subject_id].total += (grade.score * grade.coefficient);
        gradesBySubject[grade.subject_id].count += grade.coefficient;
      });

      // Calculer la moyenne par matière
      const subjectAverages = Object.values(gradesBySubject).map(subjectData => {
        const average = subjectData.count > 0 ? subjectData.total / subjectData.count : 0;
        return {
          subjectId: subjectData.subjectId,
          subjectName: subjectData.subjectName,
          average: parseFloat(average.toFixed(2)),
          gradesCount: subjectData.grades.length
        };
      });

      // Moyenne générale (moyenne des moyennes par matière)
      const generalAverage = subjectAverages.length > 0
        ? subjectAverages.reduce((sum, sub) => sum + sub.average, 0) / subjectAverages.length
        : 0;

      return {
        ...student.toJSON(),
        subjectAverages,
        generalAverage: parseFloat(generalAverage.toFixed(2)),
        totalSubjects: subjectAverages.length
      };
    });

    // Calculer le rang général
    const rankedStudents = [...studentsWithAverages].sort((a, b) => b.generalAverage - a.generalAverage);
    const studentsWithRank = studentsWithAverages.map(student => {
      const rank = rankedStudents.findIndex(s => s.id === student.id) + 1;
      return {
        ...student,
        generalRank: rank
      };
    });

    // Statistiques de la classe
    const classStats = {
      totalStudents: students.length,
      studentsWithGrades: students.filter(s => s.Grades?.length > 0).length,
      averageClassScore: studentsWithAverages.length > 0
        ? studentsWithAverages.reduce((sum, s) => sum + s.generalAverage, 0) / studentsWithAverages.length
        : 0
    };

    res.json({
      success: true,
      class: {
        id: classData.id,
        name: classData.name,
        level: classData.level,
        academic_year: classData.academic_year
      },
      teacher: {
        id: req.user.Teacher.id,
        name: `${req.user.Teacher.first_name} ${req.user.Teacher.last_name}`
      },
      students: studentsWithRank,
      statistics: classStats,
      topStudents: studentsWithRank.slice(0, 5).map(s => ({
        id: s.id,
        name: `${s.first_name} ${s.last_name}`,
        average: s.generalAverage,
        rank: s.generalRank
      }))
    });
  } catch (error) {
    console.error('❌ Erreur dashboard prof principal:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du tableau de bord: ' + error.message
    });
  }
};

const getClassStudents = async (req, res) => {
  try {
    const { classId } = req.params;
    res.json({
      success: true,
      message: `Étudiants de la classe ${classId}`,
      students: []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur récupération étudiants'
    });
  }
};

// Test des associations (pour debugging)
const testAssociations = async (req, res) => {
  try {
    console.log('🧪 Test des associations TeacherClassSubject');
    
    // Tester si TeacherClassSubject a bien les associations
    const associations = Object.keys(TeacherClassSubject.associations || {});
    console.log('Associations disponibles:', associations);
    
    // Tester une requête simple
    const testQuery = await TeacherClassSubject.findOne({
      include: [
        { model: Class, as: 'Class', attributes: ['id', 'name'] },
        { model: Subject, as: 'Subject', attributes: ['id', 'name'] }
      ],
      limit: 1
    });
    
    // Tester avec un enseignant spécifique si disponible
    const teacherId = req.user.Teacher?.id;
    let teacherTest = null;
    
    if (teacherId) {
      teacherTest = await TeacherClassSubject.findOne({
        where: { teacher_id: teacherId },
        include: [
          { model: Class, as: 'Class', attributes: ['id', 'name'] },
          { model: Subject, as: 'Subject', attributes: ['id', 'name'] }
        ]
      });
    }
    
    res.json({
      success: true,
      associations,
      hasClassAssociation: associations.includes('Class'),
      hasSubjectAssociation: associations.includes('Subject'),
      testQuery: testQuery ? {
        id: testQuery.id,
        class: testQuery.Class,
        subject: testQuery.Subject
      } : null,
      teacherTest: teacherTest ? {
        id: teacherTest.id,
        class: teacherTest.Class,
        subject: teacherTest.Subject
      } : null,
      teacherId
    });
  } catch (error) {
    console.error('❌ Erreur test associations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du test des associations: ' + error.message,
      error: error.stack
    });
  }
};

// Dans teacherController.js
const getMyStudents = async (req, res) => {
  try {
    const teacherId = req.user.teacherId;
    
    console.log(`🎓 Récupération étudiants pour enseignant principal ${teacherId}`);
    
    // Trouver les classes où l'enseignant est principal
    const mainTeacherClasses = await Class.findAll({
      where: { main_teacher_id: teacherId },
      attributes: ['id']
    });

    const classIds = mainTeacherClasses.map(c => c.id);

    if (classIds.length === 0) {
      return res.json({
        success: true,
        message: 'Vous n\'êtes pas professeur principal d\'aucune classe.',
        students: []
      });
    }

    // Récupérer les étudiants de ces classes
    const students = await Student.findAll({
      where: { class_id: classIds },
      include: [
        { model: Class, attributes: ['name', 'level'] },
        { model: User, attributes: ['email', 'is_active'] }
      ],
      order: [['last_name', 'ASC'], ['first_name', 'ASC']]
    });

    console.log(`✅ ${students.length} étudiants trouvés pour enseignant ${teacherId}`);

    res.json({
      success: true,
      students,
      classCount: classIds.length,
      studentCount: students.length
    });
  } catch (error) {
    console.error('❌ Erreur récupération étudiants:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des étudiants'
    });
  }
};

module.exports = {
  getTeacherDashboard,
  getAssignedClasses,
  getSubjectsByClass,
  getMainTeacherDashboard,
  getClassStudents,
  getMyStudents,
  testAssociations  // Pour debugging
};