// src/middleware/teacherPermissions.js
const { Teacher, Class, TeacherClassSubject, Grade } = require('../models');

// Middleware pour vérifier si l'enseignant peut voir les étudiants
const canViewStudents = async (req, res, next) => {
  try {
    const teacherId = req.user.teacherId || req.user.Teacher?.id;

    if (!teacherId) {
      console.log('❌ Enseignant non trouvé dans req.user');
      req.canViewStudents = false;
      return next();
    }

    console.log(`🔍 Vérification vue étudiants pour enseignant: ${teacherId}`);

    // Vérifier si l'enseignant est prof principal d'au moins une classe
    const mainTeacherClasses = await Class.findAll({
      where: { 
        main_teacher_id: teacherId 
      }
    });

    // Vérifier aussi dans TeacherClassSubject
    const mainTeacherAssignments = await TeacherClassSubject.findAll({
      where: {
        teacher_id: teacherId,
        is_main_teacher: true
      }
    });

    const canView = mainTeacherClasses.length > 0 || mainTeacherAssignments.length > 0;

    console.log(`👀 Enseignant ${teacherId} peut voir étudiants: ${canView}`, {
      mainTeacherClassesCount: mainTeacherClasses.length,
      mainTeacherAssignmentsCount: mainTeacherAssignments.length
    });

    req.canViewStudents = canView;
    req.mainTeacherClasses = mainTeacherClasses;
    next();
  } catch (error) {
    console.error('❌ Erreur vérification vue étudiants:', error);
    req.canViewStudents = false;
    next();
  }
};

// Vérifier si l'enseignant peut accéder à cette classe
const canAccessClass = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const teacherId = req.user.teacherId || req.user.Teacher?.id;

    console.log(`🔐 Vérification accès classe ${classId} pour enseignant ${teacherId}`);

    if (!teacherId) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Enseignant non trouvé.'
      });
    }

    // Vérifier si l'enseignant est le prof principal de la classe
    const isMainTeacher = await Class.findOne({
      where: { 
        id: classId,
        main_teacher_id: teacherId 
      }
    });

    if (isMainTeacher) {
      console.log(`✅ Enseignant ${teacherId} est prof principal de la classe ${classId}`);
      req.isMainTeacherOfClass = true;
      return next();
    }

    // Vérifier dans TeacherClassSubject
    const assignment = await TeacherClassSubject.findOne({
      where: {
        teacher_id: teacherId,
        class_id: classId
      }
    });

    if (assignment) {
      console.log(`✅ Enseignant ${teacherId} est assigné à la classe ${classId}`);
      req.teacherAssignment = assignment;
      req.isMainTeacherOfClass = assignment.is_main_teacher || false;
      return next();
    }

    console.log(`❌ Enseignant ${teacherId} n'a pas accès à la classe ${classId}`);
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Vous n\'êtes pas assigné à cette classe.'
    });
  } catch (error) {
    console.error('❌ Erreur canAccessClass:', error);
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
    const teacherId = req.user.teacherId || req.user.Teacher?.id;

    console.log(`✏️ Vérification modification note ${gradeId} pour enseignant ${teacherId}`);

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

    console.log(`✅ Enseignant ${teacherId} peut modifier la note ${gradeId}`);
    req.grade = grade;
    next();
  } catch (error) {
    console.error('❌ Erreur canModifyGrade:', error);
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
    const teacherId = req.user.teacherId || req.user.Teacher?.id;

    console.log(`👑 Vérification prof principal pour classe ${classId}, enseignant ${teacherId}`);

    // Vérifier d'abord dans Class
    const classAsMainTeacher = await Class.findOne({
      where: { 
        id: classId,
        main_teacher_id: teacherId 
      }
    });

    if (classAsMainTeacher) {
      console.log(`✅ Enseignant ${teacherId} est prof principal (via Class)`);
      req.mainTeacherAssignment = { is_main_teacher: true };
      return next();
    }

    // Vérifier dans TeacherClassSubject
    const assignment = await TeacherClassSubject.findOne({
      where: {
        teacher_id: teacherId,
        class_id: classId,
        is_main_teacher: true
      }
    });

    if (assignment) {
      console.log(`✅ Enseignant ${teacherId} est prof principal (via TeacherClassSubject)`);
      req.mainTeacherAssignment = assignment;
      return next();
    }

    console.log(`❌ Enseignant ${teacherId} n'est pas prof principal de la classe ${classId}`);
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Vous n\'êtes pas professeur principal de cette classe.'
    });
  } catch (error) {
    console.error('❌ Erreur isMainTeacher:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la vérification des permissions.'
    });
  }
};

// Middleware pour ajouter les infos de permissions au user
const addTeacherPermissions = async (req, res, next) => {
  try {
    if (req.user.role !== 'teacher') {
      return next();
    }

    const teacherId = req.user.teacherId || req.user.Teacher?.id;
    
    if (!teacherId) {
      console.log('⚠️ Aucun ID enseignant trouvé');
      return next();
    }

    // Vérifier si l'enseignant est prof principal
    const mainTeacherClasses = await Class.count({
      where: { main_teacher_id: teacherId }
    });

    const mainTeacherAssignments = await TeacherClassSubject.count({
      where: {
        teacher_id: teacherId,
        is_main_teacher: true
      }
    });

    req.user.isMainTeacher = (mainTeacherClasses + mainTeacherAssignments) > 0;
    req.user.mainTeacherCount = mainTeacherClasses + mainTeacherAssignments;

    console.log(`📋 Permissions enseignant ${teacherId}:`, {
      isMainTeacher: req.user.isMainTeacher,
      mainTeacherCount: req.user.mainTeacherCount
    });

    next();
  } catch (error) {
    console.error('❌ Erreur addTeacherPermissions:', error);
    next();
  }
};

module.exports = {
  canViewStudents,
  canAccessClass,
  canModifyGrade,
  isMainTeacher,
  addTeacherPermissions
};