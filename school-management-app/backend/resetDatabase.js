const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.join(__dirname, '.env') });

const resetDatabase = async () => {
    let connection;
    
    try {
        console.log('🔄 Réinitialisation complète de la base de données...');
        
        // Se connecter à MySQL (sans base spécifique)
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD || ''
        });
        
        console.log('✅ Connecté à MySQL');
        
        // Supprimer et recréer la base de données
        await connection.query(`DROP DATABASE IF EXISTS ${process.env.DB_NAME}`);
        console.log(`🗑️  Base ${process.env.DB_NAME} supprimée`);
        
        await connection.query(`CREATE DATABASE ${process.env.DB_NAME}`);
        console.log(`📦 Base ${process.env.DB_NAME} créée`);
        
        await connection.query(`USE ${process.env.DB_NAME}`);
        console.log(`🔧 Utilisation de ${process.env.DB_NAME}`);
        
        // Lire et exécuter le script SQL
        const fs = require('fs');
        const sqlScript = fs.readFileSync(path.join(__dirname, 'db.sql'), 'utf8');
        
        // Diviser et exécuter chaque instruction
        const statements = sqlScript.split(';').filter(stmt => stmt.trim());
        
        for (const statement of statements) {
            if (statement.trim()) {
                try {
                    await connection.query(statement + ';');
                } catch (error) {
                    // Ignorer les erreurs de contrainte pour l'instant
                    if (!error.message.includes('Duplicate entry')) {
                        console.log(`⚠️  SQL: ${error.message.substring(0, 100)}...`);
                    }
                }
            }
        }
        
        console.log('✅ Structure de base créée');
        
        // Vérifier si l'admin existe déjà
        const [existingAdmin] = await connection.query(
            "SELECT id FROM users WHERE email = 'admin@school.com'"
        );
        
        if (existingAdmin.length === 0) {
            // Créer l'admin
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('Admin123!', salt);
            
            await connection.query(`
                INSERT INTO users (email, password, role, is_active) 
                VALUES ('admin@school.com', ?, 'admin', true)
            `, [hashedPassword]);
            
            const [result] = await connection.query('SELECT LAST_INSERT_ID() as id');
            const adminUserId = result[0].id;
            
            await connection.query(`
                INSERT INTO admins (user_id, first_name, last_name, phone) 
                VALUES (?, 'Admin', 'Principal', '+243000000000')
            `, [adminUserId]);
            
            console.log('👨‍💼 Admin créé: admin@school.com / Admin123!');
        } else {
            console.log('👨‍💼 Admin existe déjà');
        }
        
        console.log('\n✨ Base de données réinitialisée avec succès!');
        console.log('\n📌 Pour démarrer:');
        console.log('1. Arrêtez le serveur si en cours (Ctrl+C)');
        console.log('2. npm run dev');
        console.log('3. Se connecter avec admin@school.com / Admin123!');
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
};

// Exécuter
if (require.main === module) {
    resetDatabase()
        .then(() => process.exit(0))
        .catch(err => {
            console.error(err);
            process.exit(1);
        });
}

module.exports = resetDatabase;