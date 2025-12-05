const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TeacherClassSubject = sequelize.define('TeacherClassSubject', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
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
    allowNull: false,
    references: {
      model: 'subjects',
      key: 'id'
    }
  },
  is_main_teacher: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'teacher_class_subject',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['teacher_id', 'class_id', 'subject_id']
    }
  ]
});

module.exports = TeacherClassSubject;