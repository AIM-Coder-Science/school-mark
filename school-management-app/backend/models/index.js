const sequelize = require('../config/database');

// Importer les modèles
const User = require('./User');
const Admin = require('./Admin');
const Teacher = require('./Teacher');
const Class = require('./Class');
const Subject = require('./Subject');
const Student = require('./Student');
const TeacherClassSubject = require('./TeacherClassSubject');
const Grade = require('./Grade');
const Publication = require('./Publication');
const History = require('./History');
const Average = require('./Average');

// Initialiser les modèles
const models = {
    User,
    Admin,
    Teacher,
    Student,
    Class,
    Subject,
    TeacherClassSubject,
    Grade,
    Publication,
    History,
    Average
};

// Configurer les relations UNE SEULE FOIS
const setupAssociations = () => {
    console.log('🔗 Setting up database associations...');
    
    // User relations
    User.hasOne(Admin, { 
        foreignKey: 'userId', 
        as: 'adminProfile', // Changé de 'admin' à 'adminProfile'
        onDelete: 'CASCADE' 
    });
    
    User.hasOne(Teacher, { 
        foreignKey: 'userId', 
        as: 'teacherProfile', // Changé de 'teacher' à 'teacherProfile'
        onDelete: 'CASCADE' 
    });
    
    User.hasOne(Student, { 
        foreignKey: 'userId', 
        as: 'studentProfile', // Changé de 'student' à 'studentProfile'
        onDelete: 'CASCADE' 
    });
    
    User.hasMany(Publication, { 
        foreignKey: 'authorId', 
        as: 'authoredPublications', // Changé de 'publications'
        onDelete: 'CASCADE' 
    });
    
    // Note: Supprimez la relation History depuis User car elle est déjà définie dans History

    // Admin relations
    Admin.belongsTo(User, { 
        foreignKey: 'userId', 
        as: 'user' 
    });
    
    Admin.hasMany(Teacher, { 
        foreignKey: 'createdBy', 
        as: 'createdTeachers' 
    });
    
    Admin.hasMany(Student, { 
        foreignKey: 'createdBy', 
        as: 'createdStudents' 
    });
    
    Admin.hasMany(Class, { 
        foreignKey: 'createdBy', 
        as: 'createdClasses' 
    });
    
    Admin.hasMany(Subject, { 
        foreignKey: 'createdBy', 
        as: 'createdSubjects' 
    });

    // Teacher relations
    Teacher.belongsTo(User, { 
        foreignKey: 'userId', 
        as: 'user' 
    });
    
    Teacher.belongsTo(Admin, { 
        foreignKey: 'createdBy', 
        as: 'creator' 
    });
    
    Teacher.hasMany(Class, { 
        foreignKey: 'teacherPrincipalId', 
        as: 'principalOfClasses' 
    });
    
    Teacher.hasMany(Grade, { 
        foreignKey: 'teacherId', 
        onDelete: 'CASCADE' 
    });

    // Student relations
    Student.belongsTo(User, { 
        foreignKey: 'userId', 
        as: 'user' 
    });
    
    Student.belongsTo(Class, { 
        foreignKey: 'classId', 
        as: 'class' 
    });
    
    Student.belongsTo(Admin, { 
        foreignKey: 'createdBy', 
        as: 'creator' 
    });
    
    Student.hasMany(Grade, { 
        foreignKey: 'studentId', 
        onDelete: 'CASCADE' 
    });
    
    Student.hasMany(Average, { 
        foreignKey: 'studentId', 
        onDelete: 'CASCADE' 
    });
    
    Student.hasMany(History, { 
        foreignKey: 'studentId', 
        as: 'studentDocuments', // Changé de 'documents'
        onDelete: 'CASCADE' 
    });

    // Class relations
    Class.belongsTo(Teacher, { 
        foreignKey: 'teacherPrincipalId', 
        as: 'principalTeacher' 
    });
    
    Class.belongsTo(Admin, { 
        foreignKey: 'createdBy', 
        as: 'creator' 
    });
    
    Class.hasMany(Student, { 
        foreignKey: 'classId', 
        as: 'students' 
    });
    
    Class.hasMany(Grade, { 
        foreignKey: 'classId', 
        onDelete: 'CASCADE' 
    });
    
    Class.hasMany(Average, { 
        foreignKey: 'classId', 
        onDelete: 'CASCADE' 
    });
    
    Class.hasMany(History, { 
        foreignKey: 'classId', 
        as: 'classHistories', // Changé de 'classDocuments'
        onDelete: 'CASCADE' 
    });

    // Subject relations
    Subject.belongsTo(Admin, { 
        foreignKey: 'createdBy', 
        as: 'creator' 
    });
    
    Subject.hasMany(Grade, { 
        foreignKey: 'subjectId', 
        onDelete: 'CASCADE' 
    });
    
    Subject.hasMany(Average, { 
        foreignKey: 'subjectId', 
        onDelete: 'CASCADE' 
    });

    // Many-to-Many relations (Teacher-Class-Subject)
    Teacher.belongsToMany(Class, { 
        through: TeacherClassSubject,
        foreignKey: 'teacherId',
        otherKey: 'classId',
        as: 'assignedClasses' // Changé de 'classes'
    });
    
    Class.belongsToMany(Teacher, { 
        through: TeacherClassSubject,
        foreignKey: 'classId',
        otherKey: 'teacherId',
        as: 'classTeachers' // Changé de 'teachers'
    });
    
    Teacher.belongsToMany(Subject, { 
        through: TeacherClassSubject,
        foreignKey: 'teacherId',
        otherKey: 'subjectId',
        as: 'teacherSubjects' // Changé de 'subjects'
    });
    
    Subject.belongsToMany(Teacher, { 
        through: TeacherClassSubject,
        foreignKey: 'subjectId',
        otherKey: 'teacherId',
        as: 'subjectTeachers' // Changé de 'teachers'
    });
    
    Class.belongsToMany(Subject, { 
        through: TeacherClassSubject,
        foreignKey: 'classId',
        otherKey: 'subjectId',
        as: 'classSubjects' // Changé de 'subjects'
    });
    
    Subject.belongsToMany(Class, { 
        through: TeacherClassSubject,
        foreignKey: 'subjectId',
        otherKey: 'classId',
        as: 'subjectClasses' // Changé de 'classes'
    });

    // TeacherClassSubject relations
    TeacherClassSubject.belongsTo(Teacher, { 
        foreignKey: 'teacherId', 
        onDelete: 'CASCADE' 
    });
    
    TeacherClassSubject.belongsTo(Class, { 
        foreignKey: 'classId', 
        onDelete: 'CASCADE' 
    });
    
    TeacherClassSubject.belongsTo(Subject, { 
        foreignKey: 'subjectId', 
        onDelete: 'CASCADE' 
    });

    // Grade relations (déjà définies dans le modèle Grade.js)
    
    // Publication relations
    Publication.belongsTo(User, { 
        foreignKey: 'authorId', 
        as: 'author' 
    });

    // History relations (déjà définies dans le modèle History.js)
    // Note: Les relations History sont déjà dans History.js, ne les répétez pas ici
    
    // Average relations (déjà définies dans le modèle Average.js)
    
    console.log('✅ Associations configured successfully');
};

// Exécuter la configuration
setupAssociations();

// Exporter
module.exports = {
    sequelize,
    ...models
};