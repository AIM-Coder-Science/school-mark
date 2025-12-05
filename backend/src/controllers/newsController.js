const { News, User, Teacher, Student, sequelize } = require('../models');
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

    // Récupérer avec l'auteur et ses détails
    const newsWithAuthor = await News.findByPk(news.id, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'email', 'first_name', 'last_name', 'role'],
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
      }]
    });

    // Formater l'auteur pour l'affichage
    const formattedNews = {
      ...newsWithAuthor.toJSON(),
      author_display: getAuthorDisplayName(newsWithAuthor.author)
    };

    res.status(201).json({
      success: true,
      message: 'Actualité publiée avec succès.',
      data: {
        news: formattedNews
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

// Obtenir les actualités selon le rôle - VERSION OPTIMISÉE
const getNews = async (req, res) => {
  try {
    const userRole = req.user.role;
    const { page = 1, limit = 20 } = req.query;

    const offset = (page - 1) * limit;

    // Déterminer si on utilise MySQL
    const isMySQL = process.env.DB_DIALECT === 'mysql';
    let whereClause = { is_published: true };

    if (isMySQL) {
      // Version MySQL optimisée
      whereClause[Op.or] = [
        // Pour les rôles spécifiques
        sequelize.where(
          sequelize.fn('JSON_CONTAINS', sequelize.col('target_roles'), JSON.stringify(userRole)),
          true
        ),
        // Pour "all"
        sequelize.where(
          sequelize.fn('JSON_CONTAINS', sequelize.col('target_roles'), JSON.stringify('all')),
          true
        ),
        // Pour toutes les cibles
        { target_roles: { [Op.like]: '%admin%teacher%student%' } }
      ];
    } else {
      // Version PostgreSQL/SQLite
      whereClause[Op.or] = [
        { target_roles: { [Op.contains]: [userRole] } },
        { target_roles: { [Op.contains]: ['all'] } },
        { 
          [Op.and]: [
            { target_roles: { [Op.contains]: ['admin'] } },
            { target_roles: { [Op.contains]: ['teacher'] } },
            { target_roles: { [Op.contains]: ['student'] } }
          ]
        }
      ];
    }

    // Récupérer les actualités avec pagination
    const { count, rows: newsItems } = await News.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'email', 'first_name', 'last_name', 'role'],
        include: [
          { 
            model: Teacher, 
            as: 'Teacher',
            attributes: ['first_name', 'last_name', 'id'], 
            required: false 
          },
          { 
            model: Student, 
            as: 'Student',
            attributes: ['first_name', 'last_name', 'matricule'], 
            required: false 
          }
        ]
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    // Formater les actualités pour l'affichage
    const formattedNews = newsItems.map(item => {
      const newsData = item.toJSON();
      return {
        ...newsData,
        author_display: getAuthorDisplayName(newsData.author),
        // Ajouter un champ pour faciliter l'affichage frontend
        can_edit: req.user.role === 'admin' || req.user.id === newsData.author_id,
        is_recent: isRecent(item.createdAt)
      };
    });

    res.json({
      success: true,
      news: formattedNews,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(count / limit),
        totalItems: count,
        hasMore: (page * limit) < count,
        limit: parseInt(limit)
      },
      filters: {
        user_role: userRole,
        target_applicable: formattedNews.length > 0
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération actualités:', error);
    console.error('Stack:', error.stack);
    
    // Fallback simplifié en cas d'erreur
    try {
      const allNews = await News.findAll({
        where: { is_published: true },
        include: [{
          model: User,
          as: 'author',
          attributes: ['id', 'email', 'first_name', 'last_name'],
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
        if (!item.target_roles || !Array.isArray(item.target_roles)) return false;
        
        return item.target_roles.includes(userRole) || 
               item.target_roles.includes('all');
      }).map(item => ({
        ...item.toJSON(),
        author_display: getAuthorDisplayName(item.author)
      }));

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
        message: 'Erreur lors de la récupération des actualités.',
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
    const userId = req.user.id;
    const userRole = req.user.role;

    const news = await News.findByPk(id);
    
    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'Actualité non trouvée.'
      });
    }

    // Vérifier les permissions
    if (userRole !== 'admin' && news.author_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à modifier cette actualité.'
      });
    }

    // Préparer les données de mise à jour
    const updateData = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (is_published !== undefined) updateData.is_published = is_published;
    
    if (target_roles) {
      updateData.target_roles = Array.isArray(target_roles) 
        ? target_roles 
        : typeof target_roles === 'string'
          ? [target_roles]
          : news.target_roles;
    }

    await news.update(updateData);

    // Récupérer l'actualité mise à jour avec l'auteur
    const updatedNews = await News.findByPk(id, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'email', 'first_name', 'last_name']
      }]
    });

    res.json({
      success: true,
      message: 'Actualité mise à jour avec succès.',
      data: {
        news: {
          ...updatedNews.toJSON(),
          author_display: getAuthorDisplayName(updatedNews.author)
        }
      }
    });
  } catch (error) {
    console.error('Erreur mise à jour actualité:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'actualité.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Supprimer une actualité
const deleteNews = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const news = await News.findByPk(id);
    
    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'Actualité non trouvée.'
      });
    }

    // Vérifier les permissions
    if (userRole !== 'admin' && news.author_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à supprimer cette actualité.'
      });
    }

    await news.destroy();

    res.json({
      success: true,
      message: 'Actualité supprimée avec succès.',
      deletedId: id
    });
  } catch (error) {
    console.error('Erreur suppression actualité:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'actualité.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Fonction utilitaire pour obtenir le nom d'affichage de l'auteur
const getAuthorDisplayName = (author) => {
  if (!author) return 'Auteur inconnu';
  
  // Priorité 1: Nom complet du user
  if (author.first_name && author.last_name) {
    return `${author.first_name} ${author.last_name}`;
  }
  
  // Priorité 2: Informations de Teacher
  if (author.Teacher) {
    const teacher = author.Teacher;
    if (teacher.first_name && teacher.last_name) {
      return `${teacher.first_name} ${teacher.last_name} (Enseignant)`;
    }
  }
  
  // Priorité 3: Informations de Student
  if (author.Student) {
    const student = author.Student;
    if (student.first_name && student.last_name) {
      return `${student.first_name} ${student.last_name} (Étudiant)`;
    }
  }
  
  // Priorité 4: Email
  if (author.email) {
    return author.email;
  }
  
  return 'Auteur';
};

// Fonction utilitaire pour déterminer si une date est récente
const isRecent = (date) => {
  if (!date) return false;
  const newsDate = new Date(date);
  const now = new Date();
  const diffHours = (now - newsDate) / (1000 * 60 * 60);
  return diffHours < 24; // Moins de 24 heures
};

// Obtenir une actualité spécifique
const getNewsById = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;

    const news = await News.findByPk(id, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'email', 'first_name', 'last_name', 'role'],
        include: [
          { 
            model: Teacher, 
            as: 'Teacher',
            attributes: ['first_name', 'last_name', 'id'], 
            required: false 
          },
          { 
            model: Student, 
            as: 'Student',
            attributes: ['first_name', 'last_name', 'matricule'], 
            required: false 
          }
        ]
      }]
    });

    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'Actualité non trouvée.'
      });
    }

    // Vérifier si l'utilisateur a accès
    if (!news.is_published) {
      return res.status(403).json({
        success: false,
        message: 'Cette actualité n\'est pas publiée.'
      });
    }

    if (news.target_roles && !news.target_roles.includes(userRole) && 
        !news.target_roles.includes('all')) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'avez pas accès à cette actualité.'
      });
    }

    const formattedNews = {
      ...news.toJSON(),
      author_display: getAuthorDisplayName(news.author),
      can_edit: req.user.role === 'admin' || req.user.id === news.author_id
    };

    res.json({
      success: true,
      news: formattedNews
    });

  } catch (error) {
    console.error('Erreur récupération actualité:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'actualité.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Rechercher des actualités
const searchNews = async (req, res) => {
  try {
    const userRole = req.user.role;
    const { query, page = 1, limit = 10 } = req.query;

    if (!query || query.trim() === '') {
      return getNews(req, res); // Retourner toutes les actualités
    }

    const offset = (page - 1) * limit;
    const searchTerm = `%${query}%`;

    const { count, rows: newsItems } = await News.findAndCountAll({
      where: {
        is_published: true,
        [Op.or]: [
          { title: { [Op.like]: searchTerm } },
          { content: { [Op.like]: searchTerm } }
        ],
        // Filtrage par rôle
        [Op.or]: [
          sequelize.where(
            sequelize.fn('JSON_CONTAINS', sequelize.col('target_roles'), JSON.stringify(userRole)),
            true
          ),
          sequelize.where(
            sequelize.fn('JSON_CONTAINS', sequelize.col('target_roles'), JSON.stringify('all')),
            true
          )
        ]
      },
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'email', 'first_name', 'last_name']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const formattedNews = newsItems.map(item => ({
      ...item.toJSON(),
      author_display: getAuthorDisplayName(item.author)
    }));

    res.json({
      success: true,
      news: formattedNews,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(count / limit),
        totalItems: count,
        searchQuery: query
      }
    });

  } catch (error) {
    console.error('Erreur recherche actualités:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche des actualités.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  createNews,
  getNews,
  getNewsById,
  updateNews,
  deleteNews,
  searchNews
};