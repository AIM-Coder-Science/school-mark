const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Admin = sequelize.define('Admin', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
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
    phone: {
        type: DataTypes.STRING(20)
    }
}, {
    tableName: 'admins',
    timestamps: false
});

// Relations
/*Admin.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(Admin, { foreignKey: 'userId', as: 'admin' });
*/
module.exports = Admin;