const { TeacherClassSubject, Grade } = require('../models');

// Vérifier si l'enseignant peut accéder à cette classe
const canAccessClass = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const teacherId = req.user.Teacher?.id;

    if (!teacherId) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Enseignant non trouvé.'
      });
    }

    const assignment = await TeacherClassSubject.findOne({
      where: {
        teacher_id: teacherId,
        class_id: classId
      }
    });

    if (!assignment) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Vous n\'êtes pas assigné à cette classe.'
      });
    }

    req.teacherAssignment = assignment;
    next();
  } catch (error) {
    console.error('Erreur canAccessClass:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la vérification des permissions.'
    });
  }
};

// Vérifier si l'enseignant peut modifier cette note
const canModifyGrade = async (req, res, next) => {
  try {
    const { gradeId } = req.params;
    const teacherId = req.user.Teacher?.id;

    const grade = await Grade.findByPk(gradeId);
    
    if (!grade) {
      return res.status(404).json({
        success: false,
        message: 'Note non trouvée.'
      });
    }

    if (grade.teacher_id !== teacherId) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Vous n\'êtes pas l\'auteur de cette note.'
      });
    }

    req.grade = grade;
    next();
  } catch (error) {
    console.error('Erreur canModifyGrade:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la vérification des permissions.'
    });
  }
};

// Vérifier si l'enseignant est prof principal de cette classe
const isMainTeacher = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const teacherId = req.user.Teacher?.id;

    const assignment = await TeacherClassSubject.findOne({
      where: {
        teacher_id: teacherId,
        class_id: classId,
        is_main_teacher: true
      }
    });

    if (!assignment) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Vous n\'êtes pas professeur principal de cette classe.'
      });
    }

    req.mainTeacherAssignment = assignment;
    next();
  } catch (error) {
    console.error('Erreur isMainTeacher:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la vérification des permissions.'
    });
  }
};

module.exports = {
  canAccessClass,
  canModifyGrade,
  isMainTeacher
};