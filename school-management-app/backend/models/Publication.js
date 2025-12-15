const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Publication = sequelize.define('Publication', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    authorRole: {
        type: DataTypes.ENUM('admin', 'teacher'),
        allowNull: false,
        field: 'author_role'
    },
    targetRoles: {
        type: DataTypes.TEXT,
        allowNull: false,
        get() {
            const rawValue = this.getDataValue('targetRoles');
            return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value) {
            this.setDataValue('targetRoles', JSON.stringify(value));
        }
    },
    isPublished: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_published'
    }
}, {
    tableName: 'publications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

// Relations
/*Publication.belongsTo(User, { foreignKey: 'authorId', as: 'author' });
User.hasMany(Publication, { foreignKey: 'authorId', as: 'publications' });
*/
module.exports = Publication;