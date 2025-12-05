const { sequelize } = require('../src/models'); // N'importe PAS setupAssociations

const syncDatabase = async () => {
  try {
    console.log('🔄 Synchronisation de la base de données...');
    
    // Test de connexion
    await sequelize.authenticate();
    console.log('✅ Connexion à la DB établie');
    
    // NOTE: setupAssociations() est déjà appelée automatiquement dans models/index.js
    // Donc pas besoin de l'appeler ici
    
    console.log('📊 Configuration des modèles...');
    
    // Synchronisation avec alter (ne supprime pas les données existantes)
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ Base de données synchronisée');
    
    // Vérifier les tables créées
    const [tables] = await sequelize.query("SHOW TABLES");
    console.log(`📋 Tables disponibles (${tables.length}):`);
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`   - ${tableName}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur de synchronisation:');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

syncDatabase();