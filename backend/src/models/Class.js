const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

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
    type: DataTypes.STRING(50),
    allowNull: false
  },
  academic_year: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: '2023-2024'
  },
  teacher_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'teachers',
      key: 'id'
    }
  }
}, {
  tableName: 'classes',
  timestamps: true
});

module.exports = Class;