const { Appreciation, Student, Teacher, Subject, Class } = require('../models');

// Ajouter une appréciation
const createAppreciation = async (req, res) => {
  try {
    const { studentId, classId, subjectId, appreciation, semester } = req.body;
    const teacherId = req.user.Teacher.id;

    // Vérifier que l'enseignant est prof principal ou enseigne la matière
    const isAuthorized = await require('../models/TeacherClassSubject').findOne({
      where: {
        teacher_id: teacherId,
        class_id: classId,
        ...(subjectId ? { subject_id: subjectId } : { is_main_teacher: true })
      }
    });

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à ajouter une appréciation pour cet étudiant.'
      });
    }

    const appreciationObj = await Appreciation.create({
      student_id: studentId,
      teacher_id: teacherId,
      class_id: classId,
      subject_id: subjectId || null,
      appreciation,
      semester: semester || '1'
    });

    // Inclure les relations dans la réponse
    const appreciationWithDetails = await Appreciation.findByPk(appreciationObj.id, {
      include: [
        { model: Student },
        { model: Teacher },
        { model: Subject },
        { model: Class }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Appréciation ajoutée avec succès.',
      appreciation: appreciationWithDetails
    });
  } catch (error) {
    console.error('Erreur création appréciation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout de l\'appréciation.'
    });
  }
};

// Obtenir les appréciations d'un étudiant
const getStudentAppreciations = async (req, res) => {
  try {
    const { studentId } = req.params;

    const appreciations = await Appreciation.findAll({
      where: { student_id: studentId },
      include: [
        { model: Teacher, include: ['User'] },
        { model: Subject },
        { model: Class }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      appreciations
    });
  } catch (error) {
    console.error('Erreur récupération appréciations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des appréciations.'
    });
  }
};

// Obtenir les appréciations d'une classe (pour prof principal)
const getClassAppreciations = async (req, res) => {
  try {
    const { classId } = req.params;

    const appreciations = await Appreciation.findAll({
      where: { class_id: classId },
      include: [
        { model: Student },
        { model: Teacher, include: ['User'] },
        { model: Subject }
      ],
      order: [['student_id', 'ASC'], ['created_at', 'DESC']]
    });

    res.json({
      success: true,
      appreciations
    });
  } catch (error) {
    console.error('Erreur récupération appréciations classe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des appréciations.'
    });
  }
};

module.exports = {
  createAppreciation,
  getStudentAppreciations,
  getClassAppreciations
};