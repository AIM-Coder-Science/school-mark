const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Teacher = require('./Teacher');
const Class = require('./Class');
const Subject = require('./Subject');

const TeacherClassSubject = sequelize.define('TeacherClassSubject', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    }
}, {
    tableName: 'teacher_class_subject',
    timestamps: false
});

// Relations
Teacher.belongsToMany(Class, { 
    through: TeacherClassSubject,
    foreignKey: 'teacherId',
    otherKey: 'classId',
    as: 'classes'
});
Class.belongsToMany(Teacher, { 
    through: TeacherClassSubject,
    foreignKey: 'classId',
    otherKey: 'teacherId',
    as: 'teachers'
});
Teacher.belongsToMany(Subject, { 
    through: TeacherClassSubject,
    foreignKey: 'teacherId',
    otherKey: 'subjectId',
    as: 'subjects'
});
Subject.belongsToMany(Teacher, { 
    through: TeacherClassSubject,
    foreignKey: 'subjectId',
    otherKey: 'teacherId',
    as: 'teachers'
});
Class.belongsToMany(Subject, { 
    through: TeacherClassSubject,
    foreignKey: 'classId',
    otherKey: 'subjectId',
    as: 'subjects'
});
Subject.belongsToMany(Class, { 
    through: TeacherClassSubject,
    foreignKey: 'subjectId',
    otherKey: 'classId',
    as: 'classes'
});

// Relations directes pour faciliter les requêtes
TeacherClassSubject.belongsTo(Teacher, { foreignKey: 'teacherId' });
TeacherClassSubject.belongsTo(Class, { foreignKey: 'classId' });
TeacherClassSubject.belongsTo(Subject, { foreignKey: 'subjectId' });

module.exports = TeacherClassSubject;