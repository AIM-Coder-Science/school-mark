const { Grade, Student, Subject, Class, Teacher, User, sequelize } = require('../models');

// Calculer la moyenne générale d'un étudiant
const calculateGeneralAverage = async (req, res) => {
  try {
    const { studentId } = req.params;
    const semester = req.params.semester || req.query.semester;

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
        subjectId: subject.id,
        coefficient: subject.coefficient,
        average: parseFloat(totalAverage.toFixed(2)),
        weightedAverage: parseFloat((totalAverage * subject.coefficient).toFixed(2)),
        grades: grades.map(g => ({
          id: g.id,
          exam_type: g.exam_type,
          score: g.score,
          coefficient: g.coefficient,
          date: g.date,
          semester: g.semester
        }))
      };
    });

    // Moyenne générale pondérée
    const totalWeighted = subjectAverages.reduce((sum, sub) => sum + sub.weightedAverage, 0);
    const totalCoefficient = subjectAverages.reduce((sum, sub) => sum + sub.coefficient, 0);
    const generalAverage = totalCoefficient > 0 ? totalWeighted / totalCoefficient : 0;

    // Calculer le rang (simplifié - à adapter selon votre logique métier)
    const allStudentsInClass = await Student.findAll({
      where: { class_id: student.class_id },
      include: [{ model: Grade }]
    });

    const studentRanks = await Promise.all(allStudentsInClass.map(async (s) => {
      const avg = await calculateGeneralAverageInternal(s.id, semester);
      return { studentId: s.id, average: avg.generalAverage };
    }));

    studentRanks.sort((a, b) => b.average - a.average);
    const rank = studentRanks.findIndex(r => r.studentId.toString() === studentId.toString()) + 1;

    res.json({
      success: true,
      student: {
        id: student.id,
        first_name: student.first_name,
        last_name: student.last_name,
        matricule: student.matricule,
        class_id: student.class_id
      },
      subjectAverages,
      generalAverage: parseFloat(generalAverage.toFixed(2)),
      rank: rank,
      totalCoefficient,
      semester: semester || 'Tous',
      calculationDate: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur calcul moyenne générale:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du calcul de la moyenne générale.',
      error: error.message
    });
  }
};

// Alias pour compatibilité avec l'API frontend
const getGeneralAverage = calculateGeneralAverage;

// Générer un bulletin avec signature
const generateReportCard = async (req, res) => {
  try {
    const { studentId, semester } = req.params;

    // Récupérer les données de l'étudiant avec toutes les notes
    const student = await Student.findByPk(studentId, {
      include: [
        { 
          model: Class,
          include: [{ 
            model: Teacher, 
            as: 'MainTeacher',
            include: [{ model: User }]
          }]
        },
        {
          model: Grade,
          where: semester ? { semester } : {},
          include: [
            { model: Subject },
            { 
              model: Teacher, 
              include: [{ model: User }]
            }
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
        class: student.Class ? {
          id: student.Class.id,
          name: student.Class.name,
          level: student.Class.level,
          mainTeacher: student.Class.MainTeacher ? {
            id: student.Class.MainTeacher.id,
            firstName: student.Class.MainTeacher.User?.first_name,
            lastName: student.Class.MainTeacher.User?.last_name
          } : null
        } : null
      },
      ...reportData,
      signature: {
        admin: "Administration School-Mark",
        signed: false, // Par défaut non signé
        date: null,
        signatory: null,
        stamp: "ÉCOLE CERTIFIÉE"
      },
      generated_at: new Date().toISOString(),
      academic_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1)
    };

    res.json({
      success: true,
      reportCard
    });
  } catch (error) {
    console.error('Erreur génération bulletin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du bulletin.',
      error: error.message
    });
  }
};

// Fonction pour signer le bulletin (admin seulement)
const signBulletin = async (req, res) => {
  try {
    const { studentId } = req.params;
    const semester = req.params.semester || req.query.semester;
    const { signature, signatory, signatureDate } = req.body;
    
    // Récupérer l'étudiant
    const student = await Student.findByPk(studentId, {
      include: [{ model: Class }]
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Étudiant non trouvé.'
      });
    }

    // Vérifier que le bulletin peut être signé
    const reportData = await calculateGeneralAverageInternal(studentId, semester);
    
    if (reportData.generalAverage === 0 || reportData.subjectAverages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de signer un bulletin sans notes.'
      });
    }

    // Dans un système réel, vous sauvegarderiez la signature dans la base
    // Pour l'exemple, nous simulons la signature
    const signedBulletin = {
      student: {
        id: student.id,
        fullName: `${student.first_name} ${student.last_name}`,
        matricule: student.matricule,
        class: student.Class?.name
      },
      ...reportData,
      signature: {
        admin: signatory || req.user.first_name + ' ' + req.user.last_name,
        signed: true,
        date: signatureDate || new Date().toISOString(),
        signatory: signatory || req.user.first_name + ' ' + req.user.last_name,
        stamp: "SIGNÉ ET APPROUVÉ",
        digitalSignature: signature || `signature-${studentId}-${Date.now()}`
      },
      signed_at: new Date().toISOString(),
      signed_by_user_id: req.user.id,
      academic_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1)
    };

    // Ici, vous pourriez sauvegarder dans une table BulletinSignature
    // await BulletinSignature.create({ ... });

    res.json({
      success: true,
      message: 'Bulletin signé avec succès',
      bulletin: signedBulletin,
      downloadUrl: `/api/utils/students/${studentId}/report-card/${semester || 'all'}/pdf`
    });
  } catch (error) {
    console.error('Erreur signature bulletin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la signature du bulletin.',
      error: error.message
    });
  }
};

// Fonction interne pour le calcul de moyenne
const calculateGeneralAverageInternal = async (studentId, semester) => {
  try {
    const student = await Student.findByPk(studentId, {
      include: [{
        model: Grade,
        where: semester ? { semester } : {},
        include: [{ model: Subject }],
        required: false
      }]
    });

    if (!student || !student.Grades || student.Grades.length === 0) {
      return {
        subjectAverages: [],
        generalAverage: 0,
        totalCoefficient: 0,
        rank: 0,
        hasGrades: false
      };
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
        subjectId: subject.id,
        coefficient: subject.coefficient,
        average: parseFloat(totalAverage.toFixed(2)),
        weightedAverage: parseFloat((totalAverage * subject.coefficient).toFixed(2)),
        grades: grades.map(g => ({
          id: g.id,
          exam_type: g.exam_type,
          score: g.score,
          coefficient: g.coefficient,
          date: g.date,
          semester: g.semester,
          teacher: g.teacher_id
        }))
      };
    });

    // Moyenne générale pondérée
    const totalWeighted = subjectAverages.reduce((sum, sub) => sum + sub.weightedAverage, 0);
    const totalCoefficient = subjectAverages.reduce((sum, sub) => sum + sub.coefficient, 0);
    const generalAverage = totalCoefficient > 0 ? totalWeighted / totalCoefficient : 0;

    return {
      subjectAverages,
      generalAverage: parseFloat(generalAverage.toFixed(2)),
      totalCoefficient,
      rank: 0, // À calculer si nécessaire
      hasGrades: true
    };
  } catch (error) {
    console.error('Erreur calcul interne:', error);
    return {
      subjectAverages: [],
      generalAverage: 0,
      totalCoefficient: 0,
      rank: 0,
      hasGrades: false,
      error: error.message
    };
  }
};

module.exports = {
  calculateGeneralAverage,
  getGeneralAverage,
  generateReportCard,
  signBulletin,
  calculateGeneralAverageInternal // Exporté pour usage interne si besoin
};