const { User, sequelize } = require('../src/models');
const bcrypt = require('bcryptjs');

const fixPasswords = async () => {
  try {
    console.log('🔧 Correction des mots de passe...');

    // Mots de passe corrigés
    const users = [
      { email: 'admin@school.com', password: 'admin123', role: 'admin' },
      { email: 'dupont@school.com', password: 'teacher123', role: 'teacher' },
      { email: 'martin@school.com', password: 'teacher123', role: 'teacher' },
      { email: 'leroy@school.com', password: 'teacher123', role: 'teacher' },
      { email: 'etudiant1@school.com', password: 'student123', role: 'student' },
      { email: 'etudiant2@school.com', password: 'student123', role: 'student' },
      { email: 'etudiant3@school.com', password: 'student123', role: 'student' }
    ];

    for (const userData of users) {
      const user = await User.findOne({ where: { email: userData.email } });
      
      if (user) {
        // Hasher le nouveau mot de passe
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        await user.update({ password: hashedPassword });
        console.log(`✅ Mot de passe corrigé pour: ${userData.email}`);
      } else {
        console.log(`❌ Utilisateur non trouvé: ${userData.email}`);
      }
    }

    console.log('');
    console.log('🎯 COMPTES CORRIGÉS:');
    console.log('👑 Admin: admin@school.com / admin123');
    console.log('👨‍🏫 Enseignant: dupont@school.com / teacher123');
    console.log('👨‍🎓 Étudiant: etudiant1@school.com / student123');
    console.log('');
    console.log('✅ Mots de passe corrigés avec succès!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
    process.exit(1);
  }
};

fixPasswords();