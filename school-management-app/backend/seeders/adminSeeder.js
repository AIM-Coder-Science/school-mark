const { User, Admin } = require('../models');
const bcrypt = require('bcryptjs');

const createDefaultAdmin = async () => {
    try {
        // Vérifier si l'admin existe déjà
        const existingAdmin = await User.findOne({ where: { email: 'admin@school.com' } });
        
        if (!existingAdmin) {
            // Créer l'utilisateur admin
            const adminUser = await User.create({
                email: 'admin@school.com',
                password: 'Admin123!', // À changer en production
                role: 'admin'
            });

            // Créer le profil admin
            await Admin.create({
                userId: adminUser.id,
                firstName: 'Admin',
                lastName: 'Principal',
                phone: '+243000000000'
            });

            console.log('Default admin created successfully');
            console.log('Email: admin@school.com');
            console.log('Password: Admin123!');
        } else {
            console.log('Default admin already exists');
        }
    } catch (error) {
        console.error('Error creating default admin:', error);
    }
};

// Exécuter si appelé directement
if (require.main === module) {
    createDefaultAdmin()
        .then(() => process.exit(0))
        .catch(err => {
            console.error(err);
            process.exit(1);
        });
}

module.exports = createDefaultAdmin;