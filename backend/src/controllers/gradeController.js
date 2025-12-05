const { Grade, Student, Subject, Class, TeacherClassSubject, sequelize } = require('../models');

// Calculer la moyenne et le rang
const calculateAveragesAndRanks = async (classId, subjectId, semester) => {
  const students = await Student.findAll({
    where: { class_id: classId },
    include: [{
      model: Grade,
      where: { 
        subject_id: subjectId,
        semester: semester
      },
      required: false
    }]
  });

  // Calcul des moyennes par étudiant
  const studentAverages = students.map(student => {
    const grades = student.Grades || [];
    
    const interrogationGrades = grades.filter(g => g.exam_type === 'interrogation');
    const devoirGrades = grades.filter(g => g.exam_type === 'devoir');
    const examenGrades = grades.filter(g => g.exam_type === 'examen');

    // Moyenne des interrogations
    const interroAvg = interrogationGrades.length > 0 
      ? interrogationGrades.reduce((sum, g) => sum + (g.score * g.coefficient), 0) / 
        interrogationGrades.reduce((sum, g) => sum + g.coefficient, 0)
      : 0;

    // Note de devoir (prend le dernier)
    const devoirNote = devoirGrades.length > 0 ? devoirGrades[devoirGrades.length - 1].score : 0;

    // Note d'examen
    const examenNote = examenGrades.length > 0 ? examenGrades[0].score : 0;

    // Moyenne totale (40% interro + 20% devoir + 40% examen)
    const totalAverage = (interroAvg * 0.4) + (devoirNote * 0.2) + (examenNote * 0.4);

    return {
      studentId: student.id,
      average: totalAverage,
      interroAvg,
      devoirNote,
      examenNote
    };
  });

  // Calcul des rangs
  const sortedAverages = [...studentAverages].sort((a, b) => b.average - a.average);
  const ranks = studentAverages.map(avg => {
    const rank = sortedAverages.findIndex(sa => sa.studentId === avg.studentId) + 1;
    return {
      ...avg,
      rank
    };
  });

  return ranks;
};

// Saisir une note
const createGrade = async (req, res) => {
  try {
    const { studentId, subjectId, examType, score, coefficient, semester } = req.body;
    const classId = req.params.classId;
    const teacherId = req.user.Teacher.id;

    // Vérifier les permissions
    const assignment = await TeacherClassSubject.findOne({
      where: {
        teacher_id: teacherId,
        class_id: classId,
        subject_id: subjectId
      }
    });

    if (!assignment) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à saisir des notes pour cette matière/classe.'
      });
    }

    // Créer la note
    const grade = await Grade.create({
      student_id: studentId,
      subject_id: subjectId,
      teacher_id: teacherId,
      class_id: classId,
      exam_type: examType,
      score: parseFloat(score),
      coefficient: coefficient || 1,
      semester: semester || '1',
      academic_year: '2023-2024'
    });

    // Recalculer les moyennes et rangs
    const updatedRanks = await calculateAveragesAndRanks(classId, subjectId, semester || '1');

    res.status(201).json({
      success: true,
      message: 'Note saisie avec succès.',
      grade,
      rankings: updatedRanks
    });
  } catch (error) {
    console.error('Erreur saisie note:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la saisie de la note.'
    });
  }
};

// Obtenir les notes d'une classe
const getClassGrades = async (req, res) => {
  try {
    const { classId } = req.params;
    const { subjectId, semester } = req.query;
    const teacherId = req.user.Teacher.id;

    // Vérifier les permissions
    const assignment = await TeacherClassSubject.findOne({
      where: {
        teacher_id: teacherId,
        class_id: classId,
        ...(subjectId && { subject_id: subjectId })
      }
    });

    if (!assignment) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à cette classe/matière.'
      });
    }

    // Récupérer les étudiants avec leurs notes
    const students = await Student.findAll({
      where: { class_id: classId },
      include: [{
        model: Grade,
        where: {
          ...(subjectId && { subject_id: subjectId }),
          semester: semester || '1'
        },
        required: false,
        include: ['Subject']
      }],
      order: [['last_name', 'ASC']]
    });

    // Calculer les moyennes et rangs
    const rankings = subjectId 
      ? await calculateAveragesAndRanks(classId, subjectId, semester || '1')
      : [];

    res.json({
      success: true,
      students: students.map(student => {
        const studentRank = rankings.find(r => r.studentId === student.id);
        return {
          ...student.toJSON(),
          average: studentRank?.average || 0,
          rank: studentRank?.rank || 0,
          interroAvg: studentRank?.interroAvg || 0,
          devoirNote: studentRank?.devoirNote || 0,
          examenNote: studentRank?.examenNote || 0
        };
      })
    });
  } catch (error) {
    console.error('Erreur récupération notes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des notes.'
    });
  }
};

module.exports = {
  createGrade,
  getClassGrades,
  calculateAveragesAndRanks
};