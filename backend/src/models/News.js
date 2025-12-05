// backend/src/models/News.js
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
  target_roles: {
    type: DataTypes.TEXT, // ✅ TEXT pour compatibilité MySQL
    allowNull: false,
    defaultValue: '["all"]',
    get() {
      const rawValue = this.getDataValue('target_roles');
      if (!rawValue) return ['all'];
      
      try {
        // Si c'est déjà un tableau, le retourner
        if (Array.isArray(rawValue)) return rawValue;
        
        // Si c'est une chaîne JSON, la parser
        if (typeof rawValue === 'string') {
          return JSON.parse(rawValue);
        }
        
        return ['all'];
      } catch (error) {
        console.error('Erreur parsing target_roles:', error);
        return ['all'];
      }
    },
    set(value) {
      // Toujours stocker en JSON string
      if (Array.isArray(value)) {
        this.setDataValue('target_roles', JSON.stringify(value));
      } else if (typeof value === 'string') {
        // Vérifier si c'est déjà du JSON
        try {
          JSON.parse(value);
          this.setDataValue('target_roles', value);
        } catch {
          // Si ce n'est pas du JSON, l'envelopper
          this.setDataValue('target_roles', JSON.stringify([value]));
        }
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