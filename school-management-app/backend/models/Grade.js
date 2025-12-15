const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Student = require('./Student');
const Teacher = require('./Teacher');
const Class = require('./Class');
const Subject = require('./Subject');

const Grade = sequelize.define('Grade', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    examType: {
        type: DataTypes.ENUM('interro', 'devoir', 'composition'),
        allowNull: false,
        field: 'exam_type'
    },
    score: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        validate: {
            min: 0,
            max: 20
        }
    },
    maxScore: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 20.00,
        field: 'max_score'
    },
    coefficient: {
        type: DataTypes.DECIMAL(3, 2),
        defaultValue: 1.00
    },
    semester: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        validate: {
            min: 1,
            max: 2
        }
    },
    academicYear: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'academic_year',
        validate: {
            min: 2000,
            max: 2100
        }
    },
    studentId: {
        type: DataTypes.INTEGER,
        allowNull: false, // Changé à allowNull: false
        field: 'student_id'
    },
    teacherId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'teacher_id'
    },
    classId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'class_id'
    },
    subjectId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'subject_id'
    }
}, {
    tableName: 'grades',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
        {
            fields: ['student_id', 'subject_id', 'semester', 'academic_year']
        }
    ]
});

// Relations
Grade.belongsTo(Student, { 
    foreignKey: 'studentId',
    onDelete: 'CASCADE' // Changé de SET NULL à CASCADE
});
Grade.belongsTo(Teacher, { 
    foreignKey: 'teacherId',
    onDelete: 'CASCADE'
});
Grade.belongsTo(Class, { 
    foreignKey: 'classId',
    onDelete: 'CASCADE'
});
Grade.belongsTo(Subject, { 
    foreignKey: 'subjectId',
    onDelete: 'CASCADE'
});

Student.hasMany(Grade, { foreignKey: 'studentId', onDelete: 'CASCADE' });
Teacher.hasMany(Grade, { foreignKey: 'teacherId', onDelete: 'CASCADE' });
Class.hasMany(Grade, { foreignKey: 'classId', onDelete: 'CASCADE' });
Subject.hasMany(Grade, { foreignKey: 'subjectId', onDelete: 'CASCADE' });

module.exports = Grade;