const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const fixDatabase = async () => {
    let connection;
    
    try {
        console.log('🔧 Correction de la structure de la base de données...');
        
        // Se connecter directement à MySQL
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME
        });
        
        console.log('✅ Connecté à MySQL');
        
        // Désactiver les contraintes de clé étrangère
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        
        // Supprimer les tables problématiques
        const dropTables = [
            'grades',
            'averages',
            'history',
            'teacher_class_subject',
            'publications'
        ];
        
        for (const table of dropTables) {
            try {
                await connection.query(`DROP TABLE IF EXISTS ${table}`);
                console.log(`✅ Table ${table} supprimée`);
            } catch (error) {
                console.log(`⚠️  Erreur avec ${table}: ${error.message}`);
            }
        }
        
        // Réactiver les contraintes
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        
        console.log('\n📋 Création des tables corrigées...');
        
        // Créer les tables avec les bonnes contraintes
        const createTablesSQL = `
            -- Table teacher_class_subject
            CREATE TABLE IF NOT EXISTS teacher_class_subject (
                id INT PRIMARY KEY AUTO_INCREMENT,
                teacher_id INT NOT NULL,
                class_id INT NOT NULL,
                subject_id INT NOT NULL,
                UNIQUE KEY unique_assignment (teacher_id, class_id, subject_id),
                FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
                FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
                FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
            );
            
            -- Table grades
            CREATE TABLE IF NOT EXISTS grades (
                id INT PRIMARY KEY AUTO_INCREMENT,
                student_id INT NOT NULL,
                teacher_id INT NOT NULL,
                class_id INT NOT NULL,
                subject_id INT NOT NULL,
                exam_type ENUM('interro', 'devoir', 'composition') NOT NULL,
                score DECIMAL(5,2) NOT NULL,
                max_score DECIMAL(5,2) DEFAULT 20.00,
                coefficient DECIMAL(3,2) DEFAULT 1.00,
                semester INT DEFAULT 1,
                academic_year YEAR NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
                FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
                FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
                FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
                INDEX idx_student_subject (student_id, subject_id, semester, academic_year)
            );
            
            -- Table averages
            CREATE TABLE IF NOT EXISTS averages (
                id INT PRIMARY KEY AUTO_INCREMENT,
                student_id INT NOT NULL,
                class_id INT NOT NULL,
                subject_id INT,
                semester INT NOT NULL,
                academic_year YEAR NOT NULL,
                average DECIMAL(5,2),
                general_average DECIMAL(5,2),
                rank_in_class INT,
                appreciation TEXT,
                calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_student_subject_semester (student_id, subject_id, semester, academic_year),
                FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
                FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
                FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
            );
            
            -- Table publications
            CREATE TABLE IF NOT EXISTS publications (
                id INT PRIMARY KEY AUTO_INCREMENT,
                title VARCHAR(200) NOT NULL,
                content TEXT NOT NULL,
                author_id INT NOT NULL,
                author_role ENUM('admin', 'teacher') NOT NULL,
                target_roles TEXT,
                is_published BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
            );
            
            -- Table history
            CREATE TABLE IF NOT EXISTS history (
                id INT PRIMARY KEY AUTO_INCREMENT,
                student_id INT,
                class_id INT,
                document_type ENUM('bulletin', 'emploi_temps', 'info') NOT NULL,
                file_path VARCHAR(500) NOT NULL,
                semester INT,
                academic_year YEAR,
                generated_by INT,
                generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
                FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
                FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE CASCADE
            );
        `;
        
        // Exécuter chaque instruction SQL séparément
        const statements = createTablesSQL.split(';').filter(stmt => stmt.trim());
        
        for (const statement of statements) {
            try {
                await connection.query(statement + ';');
                console.log(`✅ Table créée: ${statement.split(' ')[5] || 'table'}`);
            } catch (error) {
                console.log(`⚠️  Erreur: ${error.message}`);
            }
        }
        
        console.log('\n✅ Base de données corrigée avec succès!');
        console.log('\n📌 Prochaines étapes:');
        console.log('1. Démarrer le serveur: npm run dev');
        console.log('2. Tester l\'API: curl http://localhost:5000/api/health');
        console.log('3. Se connecter: admin@school.com / Admin123!');
        
    } catch (error) {
        console.error('❌ Erreur lors de la correction:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
};

// Exécuter le script
fixDatabase()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });