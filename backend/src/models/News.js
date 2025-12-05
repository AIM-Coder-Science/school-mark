const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const News = sequelize.define('News', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  author_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  // backend/src/models/News.js
target_roles: {
  type: DataTypes.JSON, // ou DataTypes.TEXT pour MySQL
  allowNull: false,
  defaultValue: ['all'],
  get() {
    const rawValue = this.getDataValue('target_roles');
    if (typeof rawValue === 'string') {
      try {
        return JSON.parse(rawValue);
      } catch {
        return ['all'];
      }
    }
    return rawValue || ['all'];
  },
  set(value) {
    if (Array.isArray(value)) {
      this.setDataValue('target_roles', JSON.stringify(value));
    } else if (typeof value === 'string') {
      this.setDataValue('target_roles', JSON.stringify([value]));
    } else {
      this.setDataValue('target_roles', JSON.stringify(['all']));
    }
  }
},
  is_published: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'news',
  timestamps: true
});

module.exports = News;