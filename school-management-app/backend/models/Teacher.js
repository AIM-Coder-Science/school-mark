const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Admin = require('./Admin');

const Teacher = sequelize.define('Teacher', {
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
    phone: {
        type: DataTypes.STRING(20)
    },
    specialties: {
        type: DataTypes.TEXT,
        get() {
            const rawValue = this.getDataValue('specialties');
            return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value) {
            this.setDataValue('specialties', JSON.stringify(value));
        }
    },
    score: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'teachers',
    timestamps: false
});

// Relations
/*Teacher.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Teacher.belongsTo(Admin, { foreignKey: 'createdBy', as: 'creator' });
User.hasOne(Teacher, { foreignKey: 'userId', as: 'teacher' });
Admin.hasMany(Teacher, { foreignKey: 'createdBy', as: 'createdTeachers' });
*/
module.exports = Teacher;