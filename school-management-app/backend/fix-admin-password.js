// backend/fix-admin-password.js
const { User } = require('./models'); // Assurez-vous que le chemin est correct pour votre projet
const sequelize = require('./config/database'); // Assurez-vous que le chemin est correct

const fixAdminPassword = async () => {
    try {
        await sequelize.sync(); // Connexion à la BDD

        console.log("Recherche de l'administrateur...");
        const adminUser = await User.findOne({ where: { email: 'admin@school.com' } });

        if (!adminUser) {
            console.error("❌ Erreur: Utilisateur admin@school.com non trouvé. Vérifiez seedAdmin.js.");
            return;
        }

        console.log("Admin trouvé. Mise à jour du mot de passe...");
        
        // 🛑 Ceci déclenchera le hook beforeUpdate dans User.js, hachant le mot de passe.
        adminUser.password = 'Admin123!';
        
        await adminUser.save();

        console.log('✅ Mot de passe Admin mis à jour et haché avec succès.');
        console.log('Vous pouvez maintenant vous connecter avec admin@school.com / Admin123!');

    } catch (error) {
        console.error('❌ Erreur lors de la correction du mot de passe admin:', error);
    } finally {
        // Optionnel : Fermer la connexion
        // await sequelize.close(); 
    }
};

fixAdminPassword();