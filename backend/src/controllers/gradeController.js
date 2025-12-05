// src/controllers/gradeController.js
const { Grade, Student, Subject, Teacher, Class } = require('../models');

const createGrade = async (req, res) => {
  try {
    console.log('📝 Création note:', req.body);
    
    const { classId } = req.params;
    const teacherId = req.user.teacherId;
    
    const grade = await Grade.create({
      ...req.body,
      teacher_id: teacherId,
      class_id: classId
    });

    // Récupérer la note avec les relations
    const gradeWithDetails = await Grade.findByPk(grade.id, {
      include: [
        { model: Student, attributes: ['first_name', 'last_name', 'matricule'] },
        { model: Subject, attributes: ['name', 'coefficient'] },
        { model: Teacher, attributes: ['first_name', 'last_name'] }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Note créée avec succès',
      grade: gradeWithDetails
    });
  } catch (error) {
    console.error('❌ Erreur création note:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la note',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getClassGrades = async (req, res) => {
  try {
    const { classId } = req.params;
    
    const grades = await Grade.findAll({
      where: { class_id: classId },
      include: [
        { model: Student, attributes: ['first_name', 'last_name', 'matricule'] },
        { model: Subject, attributes: ['name', 'coefficient'] },
        { model: Teacher, attributes: ['first_name', 'last_name'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      grades,
      count: grades.length
    });
  } catch (error) {
    console.error('❌ Erreur récupération notes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des notes'
    });
  }
};

const updateGrade = async (req, res) => {
  try {
    const { gradeId } = req.params;
    
    await req.grade.update(req.body);
    
    const updatedGrade = await Grade.findByPk(gradeId, {
      include: [
        { model: Student, attributes: ['first_name', 'last_name', 'matricule'] },
        { model: Subject, attributes: ['name', 'coefficient'] },
        { model: Teacher, attributes: ['first_name', 'last_name'] }
      ]
    });

    res.json({
      success: true,
      message: 'Note mise à jour avec succès',
      grade: updatedGrade
    });
  } catch (error) {
    console.error('❌ Erreur mise à jour note:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la note'
    });
  }
};

const deleteGrade = async (req, res) => {
  try {
    const { gradeId } = req.params;
    
    await req.grade.destroy();
    
    res.json({
      success: true,
      message: 'Note supprimée avec succès',
      gradeId
    });
  } catch (error) {
    console.error('❌ Erreur suppression note:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la note'
    });
  }
};

// AJOUTEZ L'EXPORT POUR updateGrade
module.exports = {
  createGrade,
  getClassGrades,
  updateGrade,  // ASSUREZ-VOUS QUE CETTE LIGNE EST PRÉSENTE
  deleteGrade
};