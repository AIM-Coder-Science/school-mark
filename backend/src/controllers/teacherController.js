const { Teacher, User, TeacherClassSubject, Class, Subject, Grade, Student, sequelize, Op } = require('../models');

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
          attributes: ['id', 'name', 'level', 'academic_year'],
          // Inclure les étudiants pour que le frontend puisse les compter
          include: [{
            model: Student,
            as: 'Students', 
            attributes: ['id'] 
          }]
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
      .map(a => a.Class);

    res.json({
      success: true,
      dashboard: {
        assignments,
        statistics: {
          classesCount,
          subjectsCount,
          mainTeacherClasses: mainTeacherClasses.length
        },
        mainTeacherClasses
      }
    });
  } catch (error) {
    console.error('❌ Erreur dashboard enseignant:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du tableau de bord.'
    });
  }
};

const getAssignedClasses = async (req, res) => {
  try {
    if (!req.user.Teacher || !req.user.Teacher.id) {
      return res.status(403).json({
        success: false,
        message: 'Profil enseignant non trouvé.'
      });
    }

    const teacherId = req.user.Teacher.id;

    // 💡 CORRECTION CLÉ : Ajout des clauses 'include' pour Class et Subject
    // Le frontend Classes.jsx s'attend à ce que 'Class' et 'Subject' soient dans chaque assignation.
    const assignments = await TeacherClassSubject.findAll({
      where: { teacher_id: teacherId },
      include: [
        { 
          model: Class,
          as: 'Class', // Assurez-vous d'utiliser l'alias 'Class' défini dans vos associations
          attributes: ['id', 'name', 'level', 'academic_year']
        },
        { 
          model: Subject,
          as: 'Subject', // Assurez-vous d'utiliser l'alias 'Subject' défini dans vos associations
          attributes: ['id', 'name', 'coefficient']
        }
      ],
      attributes: ['id', 'is_main_teacher', 'createdAt', 'class_id', 'subject_id'], // Ajout des IDs pour le débogage
      order: [
        [{ model: Class, as: 'Class' }, 'level', 'ASC'],
        [{ model: Subject, as: 'Subject' }, 'name', 'ASC']
      ]
    });

    // Le frontend Classes.jsx s'attend à 'assignments'
    res.json({
      success: true,
      assignments: assignments || [],
    });
  } catch (error) {
    console.error('❌ Erreur récupération classes assignées:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des classes assignées: ' + error.message
    });
  }
};

// Obtenir les étudiants d'une classe (pour la saisie des notes)
const getClassStudents = async (req, res) => {
  try {
    const { classId } = req.params;
    
    // Vérification des permissions
    if (!req.teacherPermissions.classes.some(c => c.id === parseInt(classId))) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à cette classe.'
      });
    }

    const students = await Student.findAll({
      where: { class_id: classId },
      include: [
        // ✅ CORRECTION CLÉ 1 : Ajout de l'alias 'Class'
        { model: Class, as: 'Class', attributes: ['name', 'level'] }, 
        // ✅ CORRECTION CLÉ 2 : Ajout de l'alias 'User'
        { model: User, as: 'User', attributes: ['email', 'is_active'] } 
      ],
      attributes: ['id', 'first_name', 'last_name', 'matricule', 'birth_date'],
      order: [['last_name', 'ASC'], ['first_name', 'ASC']]
    });

    res.json({
      success: true,
      students
    });
  } catch (error) {
    console.error('❌ Erreur récupération étudiants de classe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des étudiants.'
    });
  }
};


// Tableau de bord pour le professeur principal (avec calcul des moyennes et rangs)
const getPrincipalTeacherDashboard = async (req, res) => {
  try {
    const teacherId = req.user.Teacher.id;
    
    console.log(`🎓 Récupération étudiants pour enseignant principal ${teacherId}`);
    
    // Trouver les classes où l'enseignant est principal
    const mainTeacherClasses = await Class.findAll({
      // ✅ CORRECTION : Le snippet montre `main_teacher_id`, on garde ça
      where: { teacher_id: teacherId }, 
      attributes: ['id', 'name', 'level']
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
        // ✅ CORRECTION CLÉ 3 : Ajout de l'alias 'Class'
        { model: Class, as: 'Class', attributes: ['name', 'level'] }, 
        // ✅ CORRECTION CLÉ 4 : Ajout de l'alias 'User'
        { model: User, as: 'User', attributes: ['email', 'is_active'] },
        // Inclure toutes les notes
        { 
          model: Grade, 
          include: [{ 
            model: Subject, 
            as: 'Subject', 
            attributes: ['id', 'name', 'coefficient'] 
          }] 
        }
      ],
      order: [['last_name', 'ASC'], ['first_name', 'ASC']]
    });

    // --------------------------------------------------------------------------------
    // Calcul des moyennes (Logique de calcul basée sur le snippet de code initial)
    // --------------------------------------------------------------------------------
    
    const studentsWithAverages = students.map(student => {
      // Regrouper les notes par matière
      const gradesBySubject = student.Grades.reduce((acc, grade) => {
        if (!acc[grade.subject_id]) {
          acc[grade.subject_id] = [];
        }
        acc[grade.subject_id].push(grade);
        return acc;
      }, {});

      // Calculer la moyenne par matière
      const subjectAverages = Object.entries(gradesBySubject).map(([subjectId, grades]) => {
        const total = grades.reduce((sum, grade) => sum + (grade.score * grade.Subject.coefficient), 0);
        const totalCoefficient = grades.reduce((sum, grade) => sum + grade.Subject.coefficient, 0);
        const average = totalCoefficient > 0 ? total / totalCoefficient : 0;
        
        return {
          subjectId: parseInt(subjectId),
          subjectName: grades[0].Subject.name,
          average: average
        };
      });

      // Moyenne générale
      const generalAverage = subjectAverages.length > 0
        ? subjectAverages.reduce((sum, sub) => sum + sub.average, 0) / subjectAverages.length
        : 0;

      return {
        ...student.toJSON(),
        subjectAverages,
        generalAverage
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

    res.json({
      success: true,
      class: mainTeacherClasses.length > 0 ? mainTeacherClasses[0] : null,
      students: studentsWithRank
    });
  } catch (error) {
    console.error('❌ Erreur dashboard prof principal:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du tableau de bord.'
    });
  }
};


module.exports = {
  getTeacherDashboard,
  getAssignedClasses,
  getClassStudents,
  getPrincipalTeacherDashboard,
};