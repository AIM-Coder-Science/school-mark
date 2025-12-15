const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Class = require('./Class');
const Admin = require('./Admin');

const Student = sequelize.define('Student', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    matricule: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    firstName: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'first_name'
    },
    lastName: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'last_name'
    },
    photo: {
        type: DataTypes.STRING(255)
    },
    birthDate: {
        type: DataTypes.DATEONLY,
        field: 'birth_date'
    },
    parentName: {
        type: DataTypes.STRING(100),
        field: 'parent_name'
    },
    parentPhone: {
        type: DataTypes.STRING(20),
        field: 'parent_phone'
    }
}, {
    tableName: 'students',
    timestamps: false
});

// Relations
/*Student.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Student.belongsTo(Class, { foreignKey: 'classId', as: 'class' });
Student.belongsTo(Admin, { foreignKey: 'createdBy', as: 'creator' });
User.hasOne(Student, { foreignKey: 'userId', as: 'student' });
Class.hasMany(Student, { foreignKey: 'classId', as: 'students' });
Admin.hasMany(Student, { foreignKey: 'createdBy', as: 'createdStudents' });
*/
module.exports = Student;