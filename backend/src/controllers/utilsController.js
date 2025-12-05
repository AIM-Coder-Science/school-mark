const { Grade, Student, Subject, Class, sequelize } = require('../models');

// Calculer la moyenne générale d'un étudiant
const calculateGeneralAverage = async (req, res) => {
  try {
    const { studentId, semester } = req.params;

    const student = await Student.findByPk(studentId, {
      include: [{
        model: Grade,
        where: semester ? { semester } : {},
        include: [{ model: Subject }],
        required: false
      }]
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Étudiant non trouvé.'
      });
    }

    // Grouper les notes par matière
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

    // Calculer la moyenne par matière
    const subjectAverages = Object.values(gradesBySubject).map(subjectData => {
      const grades = subjectData.grades;
      const subject = subjectData.subject;
      
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
        subject: subject.name,
        coefficient: subject.coefficient,
        average: parseFloat(totalAverage.toFixed(2)),
        weightedAverage: parseFloat((totalAverage * subject.coefficient).toFixed(2))
      };
    });

    // Moyenne générale pondérée
    const totalWeighted = subjectAverages.reduce((sum, sub) => sum + sub.weightedAverage, 0);
    const totalCoefficient = subjectAverages.reduce((sum, sub) => sum + sub.coefficient, 0);
    const generalAverage = totalCoefficient > 0 ? totalWeighted / totalCoefficient : 0;

    res.json({
      success: true,
      student: {
        id: student.id,
        first_name: student.first_name,
        last_name: student.last_name,
        matricule: student.matricule
      },
      subjectAverages,
      generalAverage: parseFloat(generalAverage.toFixed(2)),
      semester: semester || 'Tous'
    });
  } catch (error) {
    console.error('Erreur calcul moyenne générale:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du calcul de la moyenne générale.'
    });
  }
};

// Générer un bulletin avec signature
const generateReportCard = async (req, res) => {
  try {
    const { studentId, semester } = req.params;

    // Récupérer les données de l'étudiant avec toutes les notes
    const student = await Student.findByPk(studentId, {
      include: [
        { model: Class },
        {
          model: Grade,
          where: semester ? { semester } : {},
          include: [
            { model: Subject },
            { model: Teacher, include: ['User'] }
          ],
          required: false
        }
      ]
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Étudiant non trouvé.'
      });
    }

    // Calculer les données du bulletin
    const reportData = await calculateGeneralAverageInternal(studentId, semester);

    // Ajouter la signature admin (simulée)
    const reportCard = {
      student: {
        id: student.id,
        first_name: student.first_name,
        last_name: student.last_name,
        matricule: student.matricule,
        class: student.Class
      },
      ...reportData,
      signature: {
        admin: "Administration School-Mark",
        date: new Date().toLocaleDateString('fr-FR'),
        stamp: "ÉCOLE CERTIFIÉE"
      },
      generated_at: new Date().toISOString()
    };

    res.json({
      success: true,
      reportCard
    });
  } catch (error) {
    console.error('Erreur génération bulletin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du bulletin.'
    });
  }
};

// Fonction interne pour le calcul de moyenne
const calculateGeneralAverageInternal = async (studentId, semester) => {
  // Implémentation similaire à calculateGeneralAverage
  // Retourne les données calculées sans la réponse HTTP
  return { /* données calculées */ };
};

module.exports = {
  calculateGeneralAverage,
  generateReportCard
};