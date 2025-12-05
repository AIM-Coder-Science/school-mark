const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Appreciation = sequelize.define('Appreciation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'students',
      key: 'id'
    }
  },
  teacher_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'teachers',
      key: 'id'
    }
  },
  class_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'classes',
      key: 'id'
    }
  },
  subject_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'subjects',
      key: 'id'
    }
  },
  appreciation: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  semester: {
    type: DataTypes.ENUM('1', '2'),
    allowNull: false,
    defaultValue: '1'
  }
}, {
  tableName: 'appreciations',
  timestamps: true
});

module.exports = Appreciation;