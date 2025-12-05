const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AcademicYear = sequelize.define('AcademicYear', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  year: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  is_current: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'academic_years',
  timestamps: true
});

module.exports = AcademicYear;