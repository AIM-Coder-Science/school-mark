const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Student = require('./Student');
const Class = require('./Class');
const Subject = require('./Subject');

const Average = sequelize.define('Average', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    semester: {
        type: DataTypes.INTEGER,
        allowNull: false,
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
    average: {
        type: DataTypes.DECIMAL(5, 2),
        validate: {
            min: 0,
            max: 20
        }
    },
    generalAverage: {
        type: DataTypes.DECIMAL(5, 2),
        field: 'general_average',
        validate: {
            min: 0,
            max: 20
        }
    },
    rankInClass: {
        type: DataTypes.INTEGER,
        field: 'rank_in_class'
    },
    appreciation: {
        type: DataTypes.TEXT
    },
    studentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'student_id'
    },
    classId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'class_id'
    },
    subjectId: {
        type: DataTypes.INTEGER,
        field: 'subject_id'
    }
}, {
    tableName: 'averages',
    timestamps: true,
    createdAt: 'calculated_at',
    updatedAt: false,
    indexes: [
        {
            unique: true,
            fields: ['student_id', 'subject_id', 'semester', 'academic_year']
        }
    ]
});

// Relations
Average.belongsTo(Student, { 
    foreignKey: 'studentId',
    onDelete: 'CASCADE'
});
Average.belongsTo(Class, { 
    foreignKey: 'classId',
    onDelete: 'CASCADE'
});
Average.belongsTo(Subject, { 
    foreignKey: 'subjectId',
    onDelete: 'CASCADE'
});

Student.hasMany(Average, { 
    foreignKey: 'studentId',
    onDelete: 'CASCADE'
});
Class.hasMany(Average, { 
    foreignKey: 'classId',
    onDelete: 'CASCADE'
});
Subject.hasMany(Average, { 
    foreignKey: 'subjectId',
    onDelete: 'CASCADE'
});

module.exports = Average;