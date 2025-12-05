const { 
  User, 
  Student, 
  Teacher, 
  Class, 
  Subject, 
  TeacherClassSubject,
  AcademicYear,
  sequelize 
} = require('../src/models');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
  try {
    console.log('🌱 Début du seeding des données...');

    const ADMIN_PASSWORD = 'admin123';
    const TEACHER_PASSWORD = 'teacher123';
    const STUDENT_PASSWORD = 'student123';
    
    // Hachage des mots de passe en une seule fois
    //const HASHED_ADMIN_PASSWORD = await bcrypt.hash(ADMIN_PASSWORD, 10);
    const HASHED_TEACHER_PASSWORD = await bcrypt.hash(TEACHER_PASSWORD, 10);
    const HASHED_STUDENT_PASSWORD = await bcrypt.hash(STUDENT_PASSWORD, 10);

    // Créer l'année académique
    const academicYear = await AcademicYear.create({
      year: '2023-2024',
      is_current: true,
      start_date: new Date('2023-09-01'),
      end_date: new Date('2024-07-31')
    });

    // Créer les matières
    const subjects = await Subject.bulkCreate([
      { name: 'Mathématiques', coefficient: 4 },
      { name: 'Français', coefficient: 3 },
      { name: 'Histoire-Géographie', coefficient: 2 },
      { name: 'Sciences Physiques', coefficient: 3 },
      { name: 'Philosophie', coefficient: 2 }
    ]);

    // Créer les classes
    const classes = await Class.bulkCreate([
      { name: 'Terminale A', level: 'Terminale', academic_year: '2023-2024' },
      { name: 'Première B', level: 'Première', academic_year: '2023-2024' },
      { name: 'Seconde C', level: 'Seconde', academic_year: '2023-2024' }
    ]);

    console.log('>>> Création de l\'admin...');
    
    // Créer l'admin AVEC mot de passe hashé
    const adminUser = await User.create({
      email: 'admin@school.com',
      password: ADMIN_PASSWORD,
      role: 'admin'
    });
    
    console.log('✅ Admin créé: admin@school.com / admin123');
    console.log('Admin user ID:', adminUser.id);

    // Créer des enseignants
    const teacherUsers = await User.bulkCreate([
      { 
        email: 'dupont@school.com', 
        password: HASHED_TEACHER_PASSWORD, 
        role: 'teacher' 
      },
      { 
        email: 'martin@school.com', 
        password: HASHED_TEACHER_PASSWORD, 
        role: 'teacher' 
      },
      { 
        email: 'leroy@school.com', 
        password: HASHED_TEACHER_PASSWORD, 
        role: 'teacher' 
      }
    ]);

    const teachers = await Teacher.bulkCreate([
      { user_id: teacherUsers[0].id, first_name: 'Jean', last_name: 'Dupont', specialty: 'Mathématiques' },
      { user_id: teacherUsers[1].id, first_name: 'Marie', last_name: 'Martin', specialty: 'Français' },
      { user_id: teacherUsers[2].id, first_name: 'Pierre', last_name: 'Leroy', specialty: 'Histoire' }
    ]);

    console.log('✅ Enseignants créés: dupont@school.com / teacher123');

    // Assigner les enseignants aux classes/matières
    await TeacherClassSubject.bulkCreate([
      // Dupont - Maths en Terminale A (prof principal)
      { teacher_id: teachers[0].id, class_id: classes[0].id, subject_id: subjects[0].id, is_main_teacher: true },
      // Martin - Français en Terminale A
      { teacher_id: teachers[1].id, class_id: classes[0].id, subject_id: subjects[1].id },
      // Leroy - Histoire en Terminale A
      { teacher_id: teachers[2].id, class_id: classes[0].id, subject_id: subjects[2].id }
    ]);

    // Créer des étudiants
    const studentUsers = await User.bulkCreate([
      { 
        email: 'etudiant1@school.com', 
        password: HASHED_STUDENT_PASSWORD, 
        role: 'student' 
      },
      { 
        email: 'etudiant2@school.com', 
        password: HASHED_STUDENT_PASSWORD, 
        role: 'student' 
      },
      { 
        email: 'etudiant3@school.com', 
        password: HASHED_STUDENT_PASSWORD, 
        role: 'student' 
      }
    ]);

    await Student.bulkCreate([
      { 
        user_id: studentUsers[0].id, 
        matricule: 'ETU001', 
        first_name: 'Alice', 
        last_name: 'Durand', 
        class_id: classes[0].id 
      },
      { 
        user_id: studentUsers[1].id, 
        matricule: 'ETU002', 
        first_name: 'Bruno', 
        last_name: 'Moreau', 
        class_id: classes[0].id 
      },
      { 
        user_id: studentUsers[2].id, 
        matricule: 'ETU003', 
        first_name: 'Clara', 
        last_name: 'Petit', 
        class_id: classes[0].id 
      }
    ]);

    console.log('✅ Étudiants créés: etudiant1@school.com / student123');
    console.log('');
    console.log('🎯 COMPTES DE TEST CRÉÉS:');
    console.log('👑 Admin: admin@school.com / admin123');
    console.log('👨‍🏫 Enseignant: dupont@school.com / teacher123');
    console.log('👨‍🎓 Étudiant: etudiant1@school.com / student123');
    
    // Vérifier dans la base de données
    console.log('\n🔍 Vérification des utilisateurs créés:');
    const allUsers = await User.findAll({
      attributes: ['id', 'email', 'role']
    });
    
    allUsers.forEach(user => {
      console.log(`- ${user.email} (${user.role}) - ID: ${user.id}`);
    });
    
    console.log('\n✅ Base de données peuplée avec succès!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error);
    console.error('Détails:', error.message);
    process.exit(1);
  }
};

seedDatabase();