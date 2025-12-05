const { Student, User, Grade, Subject, Class, Appreciation, Teacher } = require('../models');

// Tableau de bord étudiant
const getStudentDashboard = async (req, res) => {
  try {
    console.log('🔍 Récupération dashboard étudiant pour user:', req.user.id);
    
    // Vérifier que l'utilisateur a un profil étudiant
    if (!req.user.Student) {
      console.log('❌ Aucun profil étudiant trouvé pour user:', req.user.id);
      return res.status(403).json({
        success: false,
        message: 'Profil étudiant non trouvé ou non autorisé.'
      });
    }

    const studentId = req.user.Student.id;
    
    // Trouver l'étudiant avec ses relations - AVEC LES BONS ALIAS
    const student = await Student.findByPk(studentId, {
      include: [
        { 
          model: Class,
          as: 'Class',  // CORRECT: alias défini dans index.js
          attributes: ['id', 'name', 'level']
        },
        {
          model: Grade,
          as: 'Grades',  // CORRECT: alias défini dans index.js
          include: [
            { 
              model: Subject,
              as: 'Subject',  // CORRECT: alias défini dans index.js
              attributes: ['id', 'name', 'coefficient']
            },
            { 
              model: Teacher, 
              as: 'Teacher',  // CORRECT: alias défini dans index.js
              include: [{
                model: User,
                as: 'User',  // CORRECT: alias défini dans index.js
                attributes: ['email']
              }]
            }
          ]
        },
        {
          model: Appreciation,
          as: 'Appreciations',  // CORRECT: alias défini dans index.js
          include: [
            { 
              model: Teacher, 
              as: 'Teacher',  // CORRECT: alias défini dans index.js
              include: [{
                model: User,
                as: 'User',  // CORRECT: alias défini dans index.js
                attributes: ['email']
              }]
            },
            { 
              model: Subject,
              as: 'Subject',  // CORRECT: alias défini dans index.js
              attributes: ['name']
            }
          ]
        }
      ]
    });

    if (!student) {
      console.log('❌ Étudiant non trouvé pour ID:', studentId);
      return res.status(404).json({
        success: false,
        message: 'Profil étudiant non trouvé.'
      });
    }

    console.log('✅ Étudiant trouvé:', student.first_name, student.last_name);

    // Calculer les moyennes par matière
    const gradesBySubject = {};
    student.Grades.forEach(grade => {
      if (!gradesBySubject[grade.subject_id]) {
        gradesBySubject[grade.subject_id] = {
          subject: grade.Subject,
          grades: [],
          interrogations: [],
          devoirs: [],
          examens: []
        };
      }
      
      gradesBySubject[grade.subject_id].grades.push(grade);
      
      // Catégoriser les notes
      if (grade.exam_type === 'interrogation') {
        gradesBySubject[grade.subject_id].interrogations.push(grade);
      } else if (grade.exam_type === 'devoir') {
        gradesBySubject[grade.subject_id].devoirs.push(grade);
      } else if (grade.exam_type === 'examen') {
        gradesBySubject[grade.subject_id].examens.push(grade);
      }
    });

    // Calculer les moyennes
    const subjectAverages = Object.values(gradesBySubject).map(subjectData => {
      const { subject, interrogations, devoirs, examens } = subjectData;
      
      // Moyenne des interrogations
      const interroAvg = interrogations.length > 0
        ? interrogations.reduce((sum, g) => sum + (g.score * g.coefficient), 0) /
          interrogations.reduce((sum, g) => sum + g.coefficient, 0)
        : 0;

      // Dernier devoir
      const dernierDevoir = devoirs.length > 0 ? devoirs[devoirs.length - 1].score : 0;
      
      // Dernier examen
      const dernierExamen = examens.length > 0 ? examens[0].score : 0;

      // Moyenne totale (40% interro + 20% devoir + 40% examen)
      const totalAverage = (interroAvg * 0.4) + (dernierDevoir * 0.2) + (dernierExamen * 0.4);

      return {
        subject,
        interrogations,
        devoirs,
        examens,
        interroAvg: parseFloat(interroAvg.toFixed(2)),
        dernierDevoir: parseFloat(dernierDevoir.toFixed(2)),
        dernierExamen: parseFloat(dernierExamen.toFixed(2)),
        totalAverage: parseFloat(totalAverage.toFixed(2))
      };
    });

    // Moyenne générale
    const generalAverage = subjectAverages.length > 0
      ? subjectAverages.reduce((sum, sub) => sum + sub.totalAverage, 0) / subjectAverages.length
      : 0;

    const response = {
      success: true,
      student: {
        id: student.id,
        first_name: student.first_name,
        last_name: student.last_name,
        matricule: student.matricule,
        class: student.Class,
        subjectAverages,
        generalAverage: parseFloat(generalAverage.toFixed(2)),
        appreciations: student.Appreciations || []
      }
    };

    console.log('✅ Dashboard étudiant généré avec succès');
    res.json(response);
  } catch (error) {
    console.error('❌ Erreur dashboard étudiant DÉTAILLÉE:');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du tableau de bord: ' + error.message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Bulletin de notes
const getReportCard = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const student = await Student.findOne({
      where: { user_id: userId },
      include: [
        { 
          model: Class,
          as: 'Class',  // CORRECT
          attributes: ['id', 'name', 'level']
        },
        {
          model: Grade,
          as: 'Grades',  // CORRECT
          include: [
            { 
              model: Subject,
              as: 'Subject',  // CORRECT
              attributes: ['id', 'name', 'coefficient']
            },
            { 
              model: Teacher, 
              as: 'Teacher',  // CORRECT
              include: [{
                model: User,
                as: 'User',  // CORRECT
                attributes: ['email']
              }]
            }
          ]
        }
      ]
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Étudiant non trouvé.'
      });
    }

    // Calcul détaillé similaire au dashboard
    const gradesBySubject = {};
    student.Grades.forEach(grade => {
      if (!gradesBySubject[grade.subject_id]) {
        gradesBySubject[grade.subject_id] = {
          subject: grade.Subject,
          grades: []
        };
      }
      gradesBySubject[grade.subject_id].grades.push(grade);
    });

    const reportData = Object.values(gradesBySubject).map(subjectData => {
      const grades = subjectData.grades;
      const subject = subjectData.subject;
      
      // Calculs détaillés
      const interrogations = grades.filter(g => g.exam_type === 'interrogation');
      const devoirs = grades.filter(g => g.exam_type === 'devoir');
      const examens = grades.filter(g => g.exam_type === 'examen');

      const interroAvg = interrogations.length > 0
        ? interrogations.reduce((sum, g) => sum + (g.score * g.coefficient), 0) /
          interrogations.reduce((sum, g) => sum + g.coefficient, 0)
        : 0;

      const devoirNote = devoirs.length > 0 ? devoirs[devoirs.length - 1].score : 0;
      const examenNote = examens.length > 0 ? examens[0].score : 0;
      
      const totalAverage = (interroAvg * 0.4) + (devoirNote * 0.2) + (examenNote * 0.4);

      return {
        subject,
        interrogations,
        devoirs,
        examens,
        interroAvg: parseFloat(interroAvg.toFixed(2)),
        devoirNote: parseFloat(devoirNote.toFixed(2)),
        examenNote: parseFloat(examenNote.toFixed(2)),
        totalAverage: parseFloat(totalAverage.toFixed(2)),
        coefficient: subject.coefficient
      };
    });

    res.json({
      success: true,
      student: {
        id: student.id,
        first_name: student.first_name,
        last_name: student.last_name,
        matricule: student.matricule,
        class: student.Class
      },
      reportCard: reportData,
      semester: req.query.semester || '1'
    });
  } catch (error) {
    console.error('Erreur bulletin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du bulletin.'
    });
  }
};

module.exports = {
  getStudentDashboard,
  getReportCard
};