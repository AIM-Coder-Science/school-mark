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
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [3, 255]
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [10, 5000]
    }
  },
  target_roles: {
    type: DataTypes.TEXT, // TEXT pour MySQL
    allowNull: false,
    defaultValue: '["all"]',
    get() {
      try {
        const rawValue = this.getDataValue('target_roles');
        
        // Si vide, retourner ['all']
        if (!rawValue || rawValue.trim() === '') {
          return ['all'];
        }
        
        // Si c'est déjà un tableau, le retourner
        if (Array.isArray(rawValue)) {
          return rawValue;
        }
        
        // Si c'est une chaîne JSON, la parser
        if (typeof rawValue === 'string') {
          // Nettoyer la chaîne
          const cleaned = rawValue.trim();
          
          // Vérifier si c'est du JSON valide
          if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
            return JSON.parse(cleaned);
          }
          
          // Sinon, considérer comme une chaîne simple
          return [cleaned];
        }
        
        // Par défaut
        return ['all'];
      } catch (error) {
        console.warn('⚠️ Erreur parsing target_roles, utilisation de la valeur par défaut:', error);
        return ['all'];
      }
    },
    set(value) {
      try {
        let finalValue;
        
        if (Array.isArray(value)) {
          // S'assurer que c'est un tableau de strings
          finalValue = value.filter(v => typeof v === 'string');
          if (finalValue.length === 0) finalValue = ['all'];
        } else if (typeof value === 'string') {
          // Tenter de parser si c'est du JSON
          const trimmed = value.trim();
          if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            try {
              const parsed = JSON.parse(trimmed);
              if (Array.isArray(parsed)) {
                finalValue = parsed.filter(v => typeof v === 'string');
                if (finalValue.length === 0) finalValue = ['all'];
              } else {
                finalValue = ['all'];
              }
            } catch {
              finalValue = [trimmed];
            }
          } else {
            finalValue = [trimmed];
          }
        } else {
          finalValue = ['all'];
        }
        
        // Stocker comme JSON string
        this.setDataValue('target_roles', JSON.stringify(finalValue));
      } catch (error) {
        console.warn('⚠️ Erreur set target_roles, utilisation de la valeur par défaut');
        this.setDataValue('target_roles', JSON.stringify(['all']));
      }
    }
  },
  is_published: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  }
}, {
  tableName: 'news',
  timestamps: true,
  indexes: [
    {
      fields: ['is_published']
    },
    {
      fields: ['author_id']
    },
    {
      fields: ['createdAt']
    }
  ]
});

module.exports = News;