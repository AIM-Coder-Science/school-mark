const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Student = require('./Student');
const Class = require('./Class');
const User = require('./User');

const History = sequelize.define('History', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    documentType: {
        type: DataTypes.ENUM('bulletin', 'emploi_temps', 'info'),
        allowNull: false,
        field: 'document_type'
    },
    filePath: {
        type: DataTypes.STRING(500),
        allowNull: false,
        field: 'file_path'
    },
    semester: {
        type: DataTypes.INTEGER,
        validate: {
            min: 1,
            max: 2
        }
    },
    academicYear: {
        type: DataTypes.INTEGER,
        field: 'academic_year',
        validate: {
            min: 2000,
            max: 2100
        }
    },
    studentId: {
        type: DataTypes.INTEGER,
        field: 'student_id'
    },
    classId: {
        type: DataTypes.INTEGER,
        field: 'class_id'
    },
    generatedBy: {
        type: DataTypes.INTEGER,
        field: 'generated_by'
    }
}, {
    tableName: 'history',
    timestamps: true,
    createdAt: 'generated_at',
    updatedAt: false
});

// Relations
History.belongsTo(Student, { 
    foreignKey: 'studentId', 
    as: 'student',
    onDelete: 'CASCADE'
});
History.belongsTo(Class, { 
    foreignKey: 'classId', 
    as: 'class',
    onDelete: 'CASCADE'
});
History.belongsTo(User, { 
    foreignKey: 'generatedBy', 
    as: 'generator',
    onDelete: 'CASCADE'
});

Student.hasMany(History, { 
    foreignKey: 'studentId', 
    as: 'documents',
    onDelete: 'CASCADE'
});
Class.hasMany(History, { 
    foreignKey: 'classId', 
    as: 'classDocuments',
    onDelete: 'CASCADE'
});
User.hasMany(History, { 
    foreignKey: 'generatedBy', 
    as: 'generatedDocuments',
    onDelete: 'CASCADE'
});

module.exports = History;