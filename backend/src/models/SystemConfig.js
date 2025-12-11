// src/models/SystemConfig.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SystemConfig = sequelize.define('SystemConfig', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  system_type: {
    type: DataTypes.ENUM('semestre', 'trimestre'),
    defaultValue: 'semestre',
    allowNull: false
  },
  max_interros: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
    allowNull: false
  },
  max_devoirs: {
    type: DataTypes.INTEGER,
    defaultValue: 3,
    allowNull: false
  },
  school_name: {
    type: DataTypes.STRING(255),
    defaultValue: 'École Primaire',
    allowNull: false
  },
  academic_year: {
    type: DataTypes.STRING(50),
    defaultValue: '2023-2024',
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'system_config',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = SystemConfig;