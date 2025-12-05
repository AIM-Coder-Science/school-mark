const { sequelize } = require('../src/models');

const cleanReset = async () => {
  try {
    console.log('🔄 Réinitialisation complète de la base...');
    
    // Désactiver les contraintes
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Supprimer toutes les tables
    await sequelize.query('DROP TABLE IF EXISTS grades, appreciations, news, teacher_class_subject, students, teachers, academic_years, subjects, classes, users');
    
    // Réactiver les contraintes
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('✅ Tables supprimées, redémarrez le serveur pour recréer la structure');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

cleanReset();