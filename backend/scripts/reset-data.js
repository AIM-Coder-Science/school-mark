const { 
  User, 
  Student, 
  Teacher, 
  Class, 
  Subject, 
  TeacherClassSubject,
  AcademicYear,
  Grade,
  Appreciation,
  News,
  sequelize 
} = require('../src/models');

const resetDatabase = async () => {
  try {
    console.log('🔄 Réinitialisation de la base de données...');

    // Désactiver temporairement les contraintes de clés étrangères
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    // Supprimer toutes les données existantes dans le bon ordre
    await Grade.destroy({ where: {}, force: true });
    await Appreciation.destroy({ where: {}, force: true });
    await News.destroy({ where: {}, force: true });
    await TeacherClassSubject.destroy({ where: {}, force: true });
    await Student.destroy({ where: {}, force: true });
    await Teacher.destroy({ where: {}, force: true });
    await AcademicYear.destroy({ where: {}, force: true });
    await Subject.destroy({ where: {}, force: true });
    await Class.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });

    // Réactiver les contraintes
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('✅ Données existantes supprimées');

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

    // Créer l'admin
    const adminUser = await User.create({
      email: 'admin@school.com',
      password: 'admin123',
      role: 'admin'
    });
    console.log('✅ Admin créé: admin@school.com / admin123');

    // Créer des enseignants
    const teacherUsers = await User.bulkCreate([
      { email: 'dupont@school.com', password: 'teacher123', role: 'teacher' },
      { email: 'martin@school.com', password: 'teacher123', role: 'teacher' },
      { email: 'leroy@school.com', password: 'teacher123', role: 'teacher' }
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
      { email: 'etudiant1@school.com', password: 'student123', role: 'student' },
      { email: 'etudiant2@school.com', password: 'student123', role: 'student' },
      { email: 'etudiant3@school.com', password: 'student123', role: 'student' }
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

    // Créer quelques notes d'exemple
    await Grade.bulkCreate([
      // Notes pour Alice Durand
      {
        student_id: 1,
        subject_id: subjects[0].id, // Mathématiques
        teacher_id: teachers[0].id,
        class_id: classes[0].id,
        exam_type: 'interrogation',
        score: 15,
        coefficient: 1,
        semester: '1',
        academic_year: '2023-2024'
      },
      {
        student_id: 1,
        subject_id: subjects[0].id,
        teacher_id: teachers[0].id,
        class_id: classes[0].id,
        exam_type: 'devoir',
        score: 16,
        coefficient: 1,
        semester: '1',
        academic_year: '2023-2024'
      },
      {
        student_id: 1,
        subject_id: subjects[1].id, // Français
        teacher_id: teachers[1].id,
        class_id: classes[0].id,
        exam_type: 'interrogation',
        score: 14,
        coefficient: 1,
        semester: '1',
        academic_year: '2023-2024'
      }
    ]);

    // Créer une actualité d'exemple
    await News.create({
      author_id: adminUser.id,
      title: 'Bienvenue sur School Mark',
      content: 'Bienvenue dans notre nouvelle plateforme de gestion des notes. Cette application vous permettra de suivre vos notes et actualités scolaires.',
      target_roles: ['student', 'teacher', 'admin'],
      is_published: true
    });

    console.log('');
    console.log('🎯 COMPTES DE TEST CRÉÉS:');
    console.log('👑 Admin: admin@school.com / admin123');
    console.log('👨‍🏫 Enseignant: dupont@school.com / teacher123');
    console.log('👨‍🎓 Étudiant: etudiant1@school.com / student123');
    console.log('');
    console.log('✅ Base de données réinitialisée avec succès!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation:', error);
    
    // Réactiver les contraintes en cas d'erreur
    try {
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    } catch (e) {
      console.error('Erreur lors de la réactivation des contraintes:', e);
    }
    
    process.exit(1);
  }
};

resetDatabase();