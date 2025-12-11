const sequelize = require('../config/database');

// Import des modèles
const User = require('./User');
const Student = require('./Student');
const Teacher = require('./Teacher');
const Class = require('./Class');
const Subject = require('./Subject');
const TeacherClassSubject = require('./TeacherClassSubject');
const Grade = require('./Grade');
const News = require('./News');
const Appreciation = require('./Appreciation');
const AcademicYear = require('./AcademicYear');
const SystemConfig = require('./SystemConfig');
// Configuration des associations
const setupAssociations = () => {
  console.log('🔗 Configuration des associations Sequelize...');
  
  // User relations
  User.hasOne(Student, { 
    foreignKey: 'user_id', 
    onDelete: 'CASCADE',
    as: 'Student'
  });
  User.hasOne(Teacher, { 
    foreignKey: 'user_id', 
    onDelete: 'CASCADE',
    as: 'Teacher'
  });
  Student.belongsTo(User, { 
    foreignKey: 'user_id',
    as: 'User'
  });
  Teacher.belongsTo(User, { 
    foreignKey: 'user_id',
    as: 'User'
  });

  // Student relations
  Student.belongsTo(Class, { 
    foreignKey: 'class_id',
    as: 'Class'
  });
  Class.hasMany(Student, { 
    foreignKey: 'class_id',
    as: 'Students'
  });

  // Teacher-Class-Subject relations (Many-to-Many avec table de jointure)
  Teacher.belongsToMany(Class, { 
    through: TeacherClassSubject, 
    foreignKey: 'teacher_id',
    otherKey: 'class_id',
    as: 'Classes'
  });
  
  Class.belongsToMany(Teacher, { 
    through: TeacherClassSubject, 
    foreignKey: 'class_id',
    otherKey: 'teacher_id',
    as: 'Teachers'
  });
  
  Teacher.belongsToMany(Subject, { 
    through: TeacherClassSubject, 
    foreignKey: 'teacher_id',
    otherKey: 'subject_id',
    as: 'Subjects'
  });
  
  Subject.belongsToMany(Teacher, { 
    through: TeacherClassSubject, 
    foreignKey: 'subject_id',
    otherKey: 'teacher_id',
    as: 'Teachers'
  });
  
  Class.belongsToMany(Subject, { 
    through: TeacherClassSubject, 
    foreignKey: 'class_id',
    otherKey: 'subject_id',
    as: 'Subjects'
  });
  
  Subject.belongsToMany(Class, { 
    through: TeacherClassSubject, 
    foreignKey: 'subject_id',
    otherKey: 'class_id',
    as: 'Classes'
  });

  // Associations directes pour TeacherClassSubject (TRÈS IMPORTANT!)
  TeacherClassSubject.belongsTo(Teacher, {
    foreignKey: 'teacher_id',
    as: 'Teacher'
  });
  
  TeacherClassSubject.belongsTo(Class, {
    foreignKey: 'class_id',
    as: 'Class'
  });
  
  TeacherClassSubject.belongsTo(Subject, {
    foreignKey: 'subject_id',
    as: 'Subject'
  });
  
  Teacher.hasMany(TeacherClassSubject, {
    foreignKey: 'teacher_id',
    as: 'TeacherAssignments'
  });
  
  Class.hasMany(TeacherClassSubject, {
    foreignKey: 'class_id',
    as: 'ClassAssignments'
  });
  
  Subject.hasMany(TeacherClassSubject, {
    foreignKey: 'subject_id',
    as: 'SubjectAssignments'
  });

  // Grade relations
  Grade.belongsTo(Student, { 
    foreignKey: 'student_id',
    as: 'Student'
  });
  Grade.belongsTo(Subject, { 
    foreignKey: 'subject_id',
    as: 'Subject'
  });
  Grade.belongsTo(Teacher, { 
    foreignKey: 'teacher_id',
    as: 'Teacher'
  });
  Grade.belongsTo(Class, { 
    foreignKey: 'class_id',
    as: 'Class'
  });
  
  Student.hasMany(Grade, { 
    foreignKey: 'student_id',
    as: 'Grades'
  });
  Subject.hasMany(Grade, { 
    foreignKey: 'subject_id',
    as: 'Grades'
  });
  Teacher.hasMany(Grade, { 
    foreignKey: 'teacher_id',
    as: 'Grades'
  });
  Class.hasMany(Grade, { 
    foreignKey: 'class_id',
    as: 'Grades'
  });

  // News relations
  News.belongsTo(User, { 
    foreignKey: 'author_id', 
    as: 'author'
  });
  User.hasMany(News, {
    foreignKey: 'author_id',
    as: 'News'
  });

  // Appreciation relations
  Appreciation.belongsTo(Student, { 
    foreignKey: 'student_id',
    as: 'Student'
  });
  Appreciation.belongsTo(Teacher, { 
    foreignKey: 'teacher_id',
    as: 'Teacher'
  });
  Appreciation.belongsTo(Class, { 
    foreignKey: 'class_id',
    as: 'Class'
  });
  Appreciation.belongsTo(Subject, { 
    foreignKey: 'subject_id',
    as: 'Subject'
  });
  
  Student.hasMany(Appreciation, {
    foreignKey: 'student_id',
    as: 'Appreciations'
  });
  Teacher.hasMany(Appreciation, {
    foreignKey: 'teacher_id',
    as: 'GivenAppreciations'
  });
  Class.hasMany(Appreciation, {
    foreignKey: 'class_id',
    as: 'ClassAppreciations'
  });
  Subject.hasMany(Appreciation, {
    foreignKey: 'subject_id',
    as: 'SubjectAppreciations'
  });

  // Class main teacher
  Class.belongsTo(Teacher, { 
    foreignKey: 'teacher_id', 
    as: 'mainTeacher'
  });
  Teacher.hasMany(Class, {
    foreignKey: 'teacher_id',
    as: 'MainTeacherClasses'
  });

  // AcademicYear relations
  Class.belongsTo(AcademicYear, {
    foreignKey: 'academic_year_id',
    as: 'AcademicYear'
  });
  AcademicYear.hasMany(Class, {
    foreignKey: 'academic_year_id',
    as: 'Classes'
  });

  SystemConfig.sync({ alter: true })
  .then(() => console.log('✅ Table SystemConfig synchronisée'))
  .catch(err => console.error('❌ Erreur synchronisation SystemConfig:', err));

  console.log('✅ Associations configurées avec succès');
};

// Vérification des associations
const checkAssociations = () => {
  console.log('🔍 Vérification des associations...');
  
  const associations = {
    TeacherClassSubject: Object.keys(TeacherClassSubject.associations || {}),
    Teacher: Object.keys(Teacher.associations || {}),
    Class: Object.keys(Class.associations || {}),
    Subject: Object.keys(Subject.associations || {})
  };
  
  console.log('Associations TeacherClassSubject:', associations.TeacherClassSubject);
  console.log('Associations Teacher:', associations.Teacher);
  console.log('Associations Class:', associations.Class);
  console.log('Associations Subject:', associations.Subject);
  
  // Vérifier que TeacherClassSubject a les bonnes associations
  const requiredAssociations = ['Teacher', 'Class', 'Subject'];
  const missing = requiredAssociations.filter(
    assoc => !associations.TeacherClassSubject.includes(assoc)
  );
  
  if (missing.length > 0) {
    console.error(`❌ Associations manquantes dans TeacherClassSubject: ${missing.join(', ')}`);
    throw new Error(`Associations manquantes: ${missing.join(', ')}`);
  }
  
  console.log('✅ Toutes les associations sont correctement configurées');
};

// Configuration et vérification automatique
setupAssociations();
checkAssociations();

// Exportation des modèles
module.exports = {
  sequelize,
  User,
  Student,
  Teacher,
  Class,
  Subject,
  TeacherClassSubject,
  Grade,
  News,
  Appreciation,
  AcademicYear,
  SystemConfig
};