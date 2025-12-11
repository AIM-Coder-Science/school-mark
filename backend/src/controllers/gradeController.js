// src/controllers/gradeController.js - Version complète corrigée
const { Grade, Student, Subject, Class, TeacherClassSubject, sequelize } = require('../models');

// Obtenir les détails des notes d'une classe (format tableau)
const getClassGradesDetails = async (req, res) => {
  try {
    const { classId } = req.params;
    const { period, subjectId } = req.query; // subjectId est maintenant extrait du query
    
    console.log(`📋 GET /teacher/classes/${classId}/grades/details - Période: ${period}, Matière: ${subjectId}`);
    
    if (!req.user.Teacher || !req.user.Teacher.id) {
      return res.status(403).json({
        success: false,
        message: 'Profil enseignant non trouvé.'
      });
    }

    const teacherId = req.user.Teacher.id;

    // 💡 CORRECTION CLÉ : Vérifier l'assignation à la CLASSE ET à la MATIÈRE
    const assignment = await TeacherClassSubject.findOne({
      where: {
        teacher_id: teacherId,
        class_id: classId,
        subject_id: subjectId // <-- AJOUT pour cibler la matière
      },
      include: [
        { model: Subject, as: 'Subject' }
      ]
    });

    if (!assignment) {
      // Message d'erreur plus précis
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Vous n\'êtes pas assigné à cette classe pour cette matière.'
      });
    }

    // Récupérer toutes les notes pour cette classe, matière et période
    const grades = await Grade.findAll({
      where: {
        class_id: classId,
        subject_id: subjectId, // Utilisation de subjectId du query
        semester: period || 1,
      },
      include: [
        { 
          model: Student, 
          as: 'Student', 
          attributes: ['id', 'first_name', 'last_name', 'matricule']
        },
        { 
          model: Subject, 
          as: 'Subject', 
          attributes: ['name', 'coefficient']
        }
      ],
      order: [
        [{ model: Student, as: 'Student' }, 'last_name', 'ASC'],
        ['createdAt', 'ASC']
      ]
    });
    
    // Récupérer la liste des étudiants pour la classe (pour le formatage côté frontend)
    const students = await Student.findAll({
      where: { class_id: classId },
      attributes: ['id', 'first_name', 'last_name', 'matricule'],
      order: [['last_name', 'ASC']]
    });

    res.json({
        success: true,
        students: students,
        subject: assignment.Subject,
        grades: grades,
        config: {
          maxInterros: 5, // À remplacer par la config système si elle est dispo ici
          maxDevoirs: 3,
        }
    });

  } catch (error) {
    console.error('❌ Erreur récupération détails notes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des notes: ' + error.message
    });
  }
};

// Ajouter une note (ou la modifier si elle existe)
const createGrade = async (req, res) => {
  try {
    const { classId } = req.params;
    const { student_id, subject_id, exam_type, score, coefficient, semester, academic_year, exam_number } = req.body;
    const teacherId = req.user.Teacher.id;

    // ... (Logique de vérification de l'existence de la note et de l'accès enseignant) ...

    const [gradeRecord, created] = await Grade.findOrCreate({
        where: {
            student_id,
            subject_id,
            class_id: classId,
            exam_type,
            semester: semester || '1',
            academic_year: academic_year || '2023-2024',
            exam_number: exam_number || 1
        },
        defaults: {
            teacher_id: teacherId,
            score: parseFloat(score),
            coefficient: parseFloat(coefficient) || 1,
        }
    });

    if (!created) {
        await gradeRecord.update({
            teacher_id: teacherId,
            score: parseFloat(score), // Utilisation de 'score'
            coefficient: parseFloat(coefficient) || gradeRecord.coefficient,
        });
    }

    res.status(created ? 201 : 200).json({
      success: true,
      grade: gradeRecord,
      message: created ? 'Note ajoutée avec succès.' : 'Note mise à jour avec succès.'
    });
  } catch (error) {
    console.error('❌ Erreur ajout/modification note:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout/modification de la note: ' + error.message
    });
  }
};

// Modifier une note existante
const updateGrade = async (req, res) => {
  try {
    const { gradeId } = req.params;
    const { grade } = req.body; // La variable d'entrée est encore 'grade'
    
    console.log(`✏️ PUT /grades/${gradeId} - Modification`);

    const gradeRecord = await Grade.findByPk(gradeId);
    
    if (!gradeRecord) {
      return res.status(404).json({
        success: false,
        message: 'Note non trouvée.'
      });
    }

    // Vérifier les permissions (simplifié)
    if (gradeRecord.teacher_id !== req.user.Teacher?.id && !req.teacherPermissions.isMainTeacher) {
        return res.status(403).json({
            success: false,
            message: 'Vous n\'êtes pas autorisé à modifier cette note.'
        });
    }
    
    // ✅ CORRECTION CLÉ : Mise à jour de la colonne 'score' avec la valeur de 'grade'
    await gradeRecord.update({
      score: parseFloat(grade),
      date: new Date()
    });

    res.json({
      success: true,
      grade: gradeRecord,
      message: 'Note mise à jour avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur mise à jour note:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la note: ' + error.message
    });
  }
};

// Supprimer une note
const deleteGrade = async (req, res) => {
  try {
    const { gradeId } = req.params;
    
    console.log(`🗑️ DELETE /grades/${gradeId} - Suppression`);
    
    const gradeRecord = await Grade.findByPk(gradeId);
    
    if (!gradeRecord) {
      return res.status(404).json({
        success: false,
        message: 'Note non trouvée.'
      });
    }

    // Vérifier les permissions
    if (gradeRecord.teacher_id !== req.user.Teacher?.id && !req.teacherPermissions.isMainTeacher) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à supprimer cette note.'
      });
    }

    await gradeRecord.destroy();

    res.json({
      success: true,
      message: 'Note supprimée avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur suppression note:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la note: ' + error.message
    });
  }
};

/**
 * Sauvegarde/Mise à jour en masse des notes d'une classe pour une matière et une période données.
 */
const saveBulkGrades = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { classId } = req.params;
    const { period, subjectId, grades: gradesData } = req.body;
    
    console.log(`💾 POST /teacher/classes/${classId}/grades/bulk - Données reçues:`, req.body);
    
    if (!subjectId) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'L\'identifiant de la matière est manquant.'
      });
    }
    
    if (!gradesData || !Array.isArray(gradesData) || gradesData.length === 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Aucune donnée de note fournie.'
      });
    }
    
    // Vérification d'accès
    const assignment = await TeacherClassSubject.findOne({
      where: { 
        teacher_id: req.user.Teacher.id, 
        class_id: classId, 
        subject_id: subjectId 
      }
    });
    
    if (!assignment) {
      await t.rollback();
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Vous n\'êtes pas assigné à cette classe pour cette matière.'
      });
    }
    
    // Préparer les données pour l'insertion
    const gradesToInsert = gradesData.map(grade => ({
      student_id: grade.student_id, // ✅ Utiliser student_id (nom du frontend)
      subject_id: subjectId,
      teacher_id: req.user.Teacher.id,
      class_id: parseInt(classId),
      exam_type: grade.exam_type, // ✅ 'interrogation' ou 'devoir'
      score: parseFloat(grade.score),
      coefficient: parseFloat(grade.coefficient) || 1,
      semester: period, // ✅ period doit être '1', '2', '3'
      academic_year: grade.academic_year || '2023-2024',
      // Note: pas de 'exam_number' car il n'existe pas dans le modèle
    }));
    
    console.log('📝 Grades à insérer:', gradesToInsert); // DEBUG
    
    // Vérifier que toutes les notes sont valides
    const invalidGrades = gradesToInsert.filter(g => 
      g.score < 0 || g.score > 20 || isNaN(g.score)
    );
    
    if (invalidGrades.length > 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: `${invalidGrades.length} notes invalides (doivent être entre 0 et 20).`
      });
    }
    
    // Utiliser bulkCreate sans updateOnDuplicate (plus simple pour commencer)
    const createdGrades = await Grade.bulkCreate(gradesToInsert, {
      transaction: t,
      validate: true
    });
    
    await t.commit();
    
    console.log(`✅ ${createdGrades.length} notes enregistrées avec succès.`);
    
    res.json({
      success: true,
      message: `${createdGrades.length} notes ont été enregistrées avec succès.`,
      grades: createdGrades
    });
    
  } catch (error) {
    await t.rollback();
    console.error('❌ Erreur sauvegarde bulk des notes:', error.message);
    console.error('❌ Détails:', error.errors || error);
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la sauvegarde des notes: ' + error.message,
      // Inclure les erreurs de validation Sequelize si disponibles
      errors: error.errors ? error.errors.map(e => e.message) : undefined
    });
  }
};

module.exports = {
  getClassGradesDetails,
  createGrade,
  updateGrade,
  deleteGrade,
  saveBulkGrades,
};