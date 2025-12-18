const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Admin = require('./Admin');

const Subject = sequelize.define('Subject', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    code: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },
    coefficient: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        validate: {
            min: 1
        },
        allowNull: false
    }
}, {
    tableName: 'subjects',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

// Relations
/*Subject.belongsTo(Admin, { foreignKey: 'createdBy', as: 'creator' });
Admin.hasMany(Subject, { foreignKey: 'createdBy', as: 'createdSubjects' });
*/
module.exports = Subject;