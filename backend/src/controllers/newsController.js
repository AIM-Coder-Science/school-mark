const { News, User, Teacher, Student } = require('../models');
const { Op } = require('sequelize');

// Créer une actualité
const createNews = async (req, res) => {
  try {
    console.log('📝 Création d\'actualité - Début')
    console.log('👤 Utilisateur:', req.user)
    console.log('📦 Données reçues:', req.body)
    
    const { title, content, target_roles } = req.body;
    const authorId = req.user.id;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Le titre et le contenu sont requis.'
      });
    }

    // S'assurer que target_roles est un tableau
    let rolesArray;
    if (Array.isArray(target_roles)) {
      rolesArray = target_roles;
    } else if (typeof target_roles === 'string') {
      rolesArray = [target_roles];
    } else {
      rolesArray = ['all']; // Par défaut pour tous
    }

    console.log('🎯 Rôles formatés:', rolesArray);

    const news = await News.create({
      author_id: authorId,
      title,
      content,
      target_roles: rolesArray,
      is_published: true
    });

    console.log('✅ Actualité créée avec ID:', news.id);

    // Récupérer avec l'auteur
    const newsWithAuthor = await News.findByPk(news.id, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'email']
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Actualité publiée avec succès.',
      data: {
        news: newsWithAuthor
      }
    });

  } catch (error) {
    console.error('❌ Erreur création actualité:', error.message);
    console.error('Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la publication de l\'actualité.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtenir les actualités selon le rôle
const getNews = async (req, res) => {
  try {
    const userRole = req.user.role;
    const { page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;

    // Pour MySQL, on ne peut pas utiliser @> (opérateur JSON PostgreSQL)
    // On doit utiliser JSON_CONTAINS ou LIKE pour MySQL
    const isMySQL = process.env.DB_DIALECT === 'mysql';
    
    let whereClause = {
      is_published: true
    };

    if (isMySQL) {
      // Pour MySQL - utiliser JSON_CONTAINS ou LIKE
      whereClause[Op.or] = [
        sequelize.where(
          sequelize.fn('JSON_CONTAINS', sequelize.col('target_roles'), JSON.stringify([userRole])),
          true
        ),
        sequelize.where(
          sequelize.fn('JSON_CONTAINS', sequelize.col('target_roles'), JSON.stringify(['all'])),
          true
        ),
        sequelize.where(
          sequelize.fn('JSON_CONTAINS', sequelize.col('target_roles'), JSON.stringify(['admin', 'teacher', 'student'])),
          true
        )
      ];
    } else {
      // Pour PostgreSQL/SQLite - utiliser Op.contains
      whereClause[Op.or] = [
        { target_roles: { [Op.contains]: [userRole] } },
        { target_roles: { [Op.contains]: ['all'] } },
        { target_roles: { [Op.contains]: ['admin', 'teacher', 'student'] } }
      ];
    }

    // Récupérer toutes les actualités publiées
    const { count, rows: news } = await News.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'email'],
        include: [
          { 
            model: Teacher, 
            as: 'Teacher',
            attributes: ['first_name', 'last_name'], 
            required: false 
          },
          { 
            model: Student, 
            as: 'Student',
            attributes: ['first_name', 'last_name'], 
            required: false 
          }
        ]
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Méthode alternative plus simple pour MySQL : filtrer côté serveur
    const filteredNews = news.filter(item => {
      if (!item.target_roles) return false;
      return item.target_roles.includes(userRole) || 
             item.target_roles.includes('all') ||
             (item.target_roles.includes('admin') && item.target_roles.includes('teacher') && item.target_roles.includes('student'));
    });

    res.json({
      success: true,
      news: filteredNews,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(filteredNews.length / limit),
        totalItems: filteredNews.length
      }
    });
  } catch (error) {
    console.error('Erreur récupération actualités:', error);
    console.error('Stack:', error.stack);
    
    // Version simplifiée en cas d'erreur
    try {
      const allNews = await News.findAll({
        where: { is_published: true },
        include: [{
          model: User,
          as: 'author',
          attributes: ['id', 'email'],
          include: [
            { 
              model: Teacher, 
              as: 'Teacher',
              attributes: ['first_name', 'last_name'], 
              required: false 
            },
            { 
              model: Student, 
              as: 'Student',
              attributes: ['first_name', 'last_name'], 
              required: false 
            }
          ]
        }],
        order: [['createdAt', 'DESC']],
        limit: 10
      });

      // Filtrer côté serveur
      const userRole = req.user.role;
      const filteredNews = allNews.filter(item => {
        if (!item.target_roles) return false;
        return item.target_roles.includes(userRole) || 
               item.target_roles.includes('all');
      });

      res.json({
        success: true,
        news: filteredNews,
        pagination: {
          current: 1,
          total: 1,
          totalItems: filteredNews.length
        }
      });
    } catch (fallbackError) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des actualités. Veuillez contacter l\'administrateur.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

// Mettre à jour une actualité
const updateNews = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, target_roles, is_published } = req.body;

    const news = await News.findByPk(id);
    
    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'Actualité non trouvée.'
      });
    }

    await news.update({
      ...(title && { title }),
      ...(content && { content }),
      ...(target_roles && { target_roles: Array.isArray(target_roles) ? target_roles : news.target_roles }),
      ...(is_published !== undefined && { is_published })
    });

    res.json({
      success: true,
      message: 'Actualité mise à jour avec succès.',
      news
    });
  } catch (error) {
    console.error('Erreur mise à jour actualité:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'actualité: ' + error.message
    });
  }
};

// Supprimer une actualité
const deleteNews = async (req, res) => {
  try {
    const { id } = req.params;

    const news = await News.findByPk(id);
    
    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'Actualité non trouvée.'
      });
    }

    await news.destroy();

    res.json({
      success: true,
      message: 'Actualité supprimée avec succès.'
    });
  } catch (error) {
    console.error('Erreur suppression actualité:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'actualité: ' + error.message
    });
  }
};

module.exports = {
  createNews,
  getNews,
  updateNews,
  deleteNews
};