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
    // CORRECTION : Utiliser teacher_id au lieu de main_teacher_id
    const mainTeacherClasses = await Class.findAll({
      where: { 
        teacher_id: teacherId // CORRIGÉ : main_teacher_id -> teacher_id
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
    req.mainTeacherAssignments = mainTeacherAssignments;
    next();
  } catch (error) {
    console.error('❌ Erreur canViewStudents:', error);
    next();
  }
};

// Middleware pour vérifier l'accès à une classe (par exemple pour l'ajout de notes)
const canAccessClass = async (req, res, next) => {
  const teacherId = req.user.teacherId || req.user.Teacher?.id;
  const classId = parseInt(req.params.classId);

  // 1. Vérification par données pré-chargées (si un autre middleware a tourné)
  const assignments = req.user.assignments || [];
  if (assignments.some(a => a.class_id === classId)) {
    console.log(`✅ Accès classe ${classId} accordé via assignations pré-chargées.`);
    return next();
  }

  // 2. 💡 CORRECTION CLÉ : Vérification directe dans la base de données pour robustesse
  if (teacherId && !isNaN(classId)) {
    const isAssigned = await TeacherClassSubject.findOne({
      where: {
        teacher_id: teacherId,
        class_id: classId
      },
      attributes: ['class_id'] 
    });

    if (isAssigned) {
      console.log(`✅ Accès classe ${classId} accordé via vérification DB.`);
      return next();
    }
  }

  // 3. Vérification Prof Principal (au cas où l'assignation n'est pas dans TCS)
  // Cette vérification est souvent faite par le middleware addTeacherPermissions 
  // mais une vérification rapide peut être utile.
  if (req.user.mainTeacherClasses?.some(c => c.id === classId)) {
      console.log(`✅ Accès classe ${classId} accordé via rôle Prof Principal.`);
      return next();
  }


  console.log(`❌ Accès refusé à la classe ${classId} pour enseignant ${teacherId}.`);
  res.status(403).json({
    success: false,
    message: 'Accès non autorisé à cette classe.'
  });
};

// Middleware pour autoriser la modification de notes (simplifié)
const canModifyGrade = (req, res, next) => {
  // Logique simplifiée : tout enseignant assigné à la classe peut modifier/ajouter des notes
  // La vérification détaillée pourrait impliquer de vérifier si la note appartient à l'enseignant
  // Dans le contexte actuel, on suppose que canAccessClass suffit pour l'accès
  next();
};

// Middleware pour vérifier si l'enseignant est le prof principal de la classe
const isMainTeacher = (req, res, next) => {
  const classId = parseInt(req.params.classId);
  const mainTeacherClasses = req.user.mainTeacherClasses || [];

  if (mainTeacherClasses.some(c => c.id === classId)) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Seul le professeur principal de cette classe peut effectuer cette action.'
    });
  }
};

// Middleware pour vérifier si l'enseignant peut gérer les appréciations
const canManageAppreciations = (req, res, next) => {
    // Dans le cas où nous aurions la colonne dans la DB, on utiliserait req.teacherPermissions.canManageAppreciations
    // Puisque la colonne n'existe pas, on autorise temporairement si l'enseignant est prof principal
    if (req.user.isMainTeacher) { // Utilisation de l'information du token/session
        return next();
    }
    
    res.status(403).json({
        success: false,
        message: 'Vous n\'avez pas la permission de gérer les appréciations.'
    });
};


// Middleware pour ajouter les permissions de base au req.user
const addTeacherPermissions = async (req, res, next) => {
  try {
    // Déjà implémenté dans un middleware avant celui-ci, il est probable que les infos de base soient déjà dans req.user.Teacher
    // On peut sauter cette étape si elle est redondante. 
    // Cependant, le 'teacherController' semble faire ce travail dans getTeacherDashboard.
    // L'ajout de permissions est plus efficace si fait une fois.

    // Si le token contient déjà toutes les infos (via une requête de login), c'est mieux.
    // Sinon, c'est le rôle de checkTeacherPermissions de tout regrouper.
    
    // On passe au next() en attendant la consolidation des données.
    next(); 
  } catch (error) {
    console.error('❌ Erreur addTeacherPermissions:', error);
    next(); // Continuer même en cas d'erreur
  }
};

// Middleware pour vérifier toutes les permissions (à placer après addTeacherPermissions)
const checkTeacherPermissions = async (req, res, next) => {
  try {
    const teacherId = req.user.teacherId || req.user.Teacher?.id;
    
    if (!teacherId) {
      console.log('⚠️ Aucun ID enseignant trouvé pour vérification permissions');
      return next();
    }

    // Récupérer toutes les permissions de l'enseignant
    const teacher = await Teacher.findByPk(teacherId, {
      include: [
        {
          model: Class,
          as: 'MainTeacherClasses', // Alias Class.hasMany(Teacher, {as: 'MainTeacherClasses'})
          attributes: ['id', 'name']
        },
        {
          model: Class,
          as: 'Classes', // Alias Teacher.belongsToMany(Class, {as: 'Classes'})
          through: { 
            // ✅ CORRECTION CLÉ : Retirer les colonnes qui n'existent pas dans teacher_class_subject
            attributes: ['is_main_teacher'] 
          },
          attributes: ['id', 'name']
        }
      ]
    });

    if (teacher) {
      // Les permissions canManageGrades et canManageAppreciations ne sont plus dérivées de colonnes manquantes.
      // Elles doivent être implémentées via une logique ou une autre table de configuration.
      // Pour l'instant, on les met à "false" (ou basées sur isMainTeacher si c'est la règle métier)
      req.teacherPermissions = {
        isMainTeacher: teacher.MainTeacherClasses?.length > 0,
        classes: teacher.Classes || [],
        mainTeacherClasses: teacher.MainTeacherClasses || [],
        // ✅ NOUVELLE LOGIQUE : Puisque les colonnes n'existent pas, la permission est gérée autrement.
        canManageGrades: true, // Autoriser temporairement la saisie de notes à tout enseignant assigné
        canManageAppreciations: teacher.MainTeacherClasses?.length > 0, // Seulement prof principal
      };

      console.log(`🔑 Permissions complètes enseignant ${teacherId}:`, req.teacherPermissions);
    }

    next();
  } catch (error) {
    console.error('❌ Erreur checkTeacherPermissions:', error);
    next(); // Continuer même en cas d'erreur
  }
};

module.exports = {
  canViewStudents,
  canAccessClass,
  canModifyGrade,
  isMainTeacher,
  addTeacherPermissions,
  canManageAppreciations,
  checkTeacherPermissions
};
/*
module.exports = {
  canViewStudents,
  canAccessClass,
  canModifyGrade,
  isMainTeacher,
  addTeacherPermissions,
  canManageAppreciations,
  checkTeacherPermissions
};
*/