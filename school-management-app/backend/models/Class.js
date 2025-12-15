const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Teacher = require('./Teacher');
const Admin = require('./Admin');

const Class = sequelize.define('Class', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    level: {
        type: DataTypes.STRING(20),
        allowNull: false
    }
}, {
    tableName: 'classes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

// Relations
/*Class.belongsTo(Teacher, { 
    foreignKey: 'teacherPrincipalId', 
    as: 'principalTeacher',
    constraints: false
});
Class.belongsTo(Admin, { foreignKey: 'createdBy', as: 'creator' });
Teacher.hasMany(Class, { 
    foreignKey: 'teacherPrincipalId', 
    as: 'principalOfClasses' 
});
Admin.hasMany(Class, { foreignKey: 'createdBy', as: 'createdClasses' });*/

module.exports = Class;