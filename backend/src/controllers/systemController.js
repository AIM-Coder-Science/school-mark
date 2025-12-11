// src/controllers/systemController.js
const { SystemConfig } = require('../models');

const getSystemConfig = async (req, res) => {
  try {
    console.log('⚙️ GET /system/config - Début');
    
    // Chercher la configuration dans la base de données
    let config = await SystemConfig.findOne();
    
    // Si aucune configuration n'existe, créer une configuration par défaut
    if (!config) {
      config = await SystemConfig.create({
        system_type: 'semestre',
        max_interros: 5,
        max_devoirs: 3,
        school_name: 'École Secondaire',
        academic_year: '2023-2024'
      });
      console.log('✅ Configuration par défaut créée');
    }
    
    res.json({
      success: true,
      data: config
    });
    
    console.log('✅ Configuration système récupérée avec succès');
  } catch (error) {
    console.error('❌ Erreur récupération configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la configuration système: ' + error.message
    });
  }
};

const updateSystemConfig = async (req, res) => {
  try {
    console.log('⚙️ PUT /system/config - Début');
    const { system_type, max_interros, max_devoirs, school_name, academic_year } = req.body;
    
    let config = await SystemConfig.findOne();
    
    if (!config) {
      config = await SystemConfig.create({
        system_type: system_type || 'semestre',
        max_interros: max_interros || 5,
        max_devoirs: max_devoirs || 3,
        school_name: school_name || 'École Primaire',
        academic_year: academic_year || '2023-2024'
      });
      console.log('✅ Configuration créée');
    } else {
      config = await config.update({
        system_type: system_type || config.system_type,
        max_interros: max_interros || config.max_interros,
        max_devoirs: max_devoirs || config.max_devoirs,
        school_name: school_name || config.school_name,
        academic_year: academic_year || config.academic_year
      });
      console.log('✅ Configuration mise à jour');
    }
    
    res.json({
      success: true,
      data: config,
      message: 'Configuration mise à jour avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur mise à jour configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la configuration: ' + error.message
    });
  }
};

module.exports = {
  getSystemConfig,
  updateSystemConfig
};