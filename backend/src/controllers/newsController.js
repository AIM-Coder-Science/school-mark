// backend/src/controllers/newsController.js
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
      rolesArray = ['all'];
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

    res.status(201).json({
      success: true,
      message: 'Actualité publiée avec succès.',
      data: {
        news: {
          ...newsWithAuthor.toJSON(),
          author_display: getAuthorDisplayName(newsWithAuthor.author)
        }
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

// ✅ VERSION OPTIMISÉE pour MySQL avec JSON_CONTAINS
const getNews = async (req, res) => {
  try {
    const userRole = req.user.role;
    console.log('📰 Récupération actualités pour rôle:', userRole);
    console.log('👤 Utilisateur:', req.user.id, req.user.email);

    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // ✅ VERSION pour MySQL avec JSON_CONTAINS
    let whereClause = { is_published: true };
    
    // Pour MySQL, on peut utiliser JSON_CONTAINS
    if (process.env.DB_DIALECT === 'mysql') {
      // Créer une condition avec JSON_CONTAINS pour MySQL
      whereClause = {
        is_published: true,
        [Op.or]: [
          // Vérifie si 'all' est dans le tableau JSON
          sequelize.where(
            sequelize.fn('JSON_CONTAINS', 
              sequelize.col('target_roles'), 
              JSON.stringify('all')
            ),
            1
          ),
          // Vérifie si le rôle de l'utilisateur est dans le tableau JSON
          sequelize.where(
            sequelize.fn('JSON_CONTAINS', 
              sequelize.col('target_roles'), 
              JSON.stringify(userRole)
            ),
            1
          )
        ]
      };
    } else {
      // Version simplifiée (filtrer côté serveur)
      whereClause = { is_published: true };
    }

    console.log('🔍 Requête SQL préparée pour MySQL');

    // D'abord compter
    const totalNews = await News.count({ where: { is_published: true } });
    
    // Puis récupérer avec pagination
    const newsItems = await News.findAll({
      where: { is_published: true }, // On récupère tout d'abord
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
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    console.log(`📊 Total actualités en base: ${totalNews}, récupérées: ${newsItems.length}`);

    // ✅ FILTRER CÔTÉ SERVEUR (méthode la plus fiable)
    const filteredNews = newsItems.filter(item => {
      try {
        const targetRoles = item.target_roles;
        
        // Si pas de target_roles ou vide, ne pas afficher
        if (!targetRoles || !Array.isArray(targetRoles) || targetRoles.length === 0) {
          return false;
        }
        
        // Si contient 'all', tout le monde peut voir
        if (targetRoles.includes('all')) {
          return true;
        }
        
        // Si contient le rôle de l'utilisateur
        if (targetRoles.includes(userRole)) {
          return true;
        }
        
        return false;
      } catch (error) {
        console.error('Erreur filtrage actualité:', error);
        return false;
      }
    });

    console.log(`✅ ${filteredNews.length} actualités filtrées pour ${userRole}`);

    // Formater les actualités
    const formattedNews = filteredNews.map(item => {
      try {
        const newsData = item.toJSON();
        return {
          ...newsData,
          author_display: getAuthorDisplayName(newsData.author),
          can_edit: req.user.role === 'admin' || req.user.id === newsData.author_id,
          is_recent: isRecent(item.createdAt),
          for_student: (newsData.target_roles || []).includes('student'),
          for_teacher: (newsData.target_roles || []).includes('teacher'),
          for_admin: (newsData.target_roles || []).includes('admin'),
          for_all: (newsData.target_roles || []).includes('all')
        };
      } catch (error) {
        console.error('Erreur formatage actualité:', error);
        return null;
      }
    }).filter(item => item !== null); // Filtrer les null

    // Calculer les totaux filtrés pour la pagination
    const totalFiltered = formattedNews.length;

    res.json({
      success: true,
      news: formattedNews,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(totalFiltered / limit),
        totalItems: totalFiltered,
        hasMore: (page * limit) < totalFiltered,
        limit: parseInt(limit),
        unfilteredTotal: totalNews // Pour débogage
      },
      filters: {
        user_role: userRole,
        target_applicable: formattedNews.length > 0
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération actualités:', error);
    console.error('Stack:', error.stack);
    
    // Fallback : récupérer les 10 dernières actualités
    try {
      const fallbackNews = await News.findAll({
        where: { is_published: true },
        include: [{
          model: User,
          as: 'author',
          attributes: ['id', 'email', 'first_name', 'last_name']
        }],
        order: [['createdAt', 'DESC']],
        limit: 10
      });

      const userRole = req.user.role;
      const filteredFallback = fallbackNews.filter(item => {
        const targetRoles = item.target_roles || [];
        return targetRoles.includes('all') || targetRoles.includes(userRole);
      });

      const formattedFallback = filteredFallback.map(item => ({
        ...item.toJSON(),
        author_display: getAuthorDisplayName(item.author)
      }));

      res.json({
        success: true,
        news: formattedFallback,
        pagination: {
          current: 1,
          total: 1,
          totalItems: formattedFallback.length,
          note: 'Mode fallback activé'
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

    if (userRole !== 'admin' && news.author_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à modifier cette actualité.'
      });
    }

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
  
  if (author.first_name && author.last_name) {
    return `${author.first_name} ${author.last_name}`;
  }
  
  if (author.Teacher) {
    const teacher = author.Teacher;
    if (teacher.first_name && teacher.last_name) {
      return `${teacher.first_name} ${teacher.last_name}`;
    }
  }
  
  if (author.Student) {
    const student = author.Student;
    if (student.first_name && student.last_name) {
      return `${student.first_name} ${student.last_name}`;
    }
  }
  
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
  return diffHours < 24;
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

    if (!news.is_published) {
      return res.status(403).json({
        success: false,
        message: 'Cette actualité n\'est pas publiée.'
      });
    }

    // Vérifier les permissions
    const targetRoles = news.target_roles || [];
    if (!targetRoles.includes('all') && !targetRoles.includes(userRole)) {
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
      return getNews(req, res);
    }

    const offset = (page - 1) * limit;
    const searchTerm = `%${query}%`;

    // Récupérer toutes les actualités correspondant à la recherche
    const newsItems = await News.findAll({
      where: {
        is_published: true,
        [Op.or]: [
          { title: { [Op.like]: searchTerm } },
          { content: { [Op.like]: searchTerm } }
        ]
      },
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'email', 'first_name', 'last_name']
      }],
      order: [['createdAt', 'DESC']],
      distinct: true
    });

    // Filtrer par rôle côté serveur
    const filteredNews = newsItems.filter(item => {
      const targetRoles = item.target_roles || [];
      return targetRoles.includes('all') || targetRoles.includes(userRole);
    });

    // Appliquer la pagination
    const paginatedNews = filteredNews.slice(offset, offset + parseInt(limit));

    const formattedNews = paginatedNews.map(item => ({
      ...item.toJSON(),
      author_display: getAuthorDisplayName(item.author)
    }));

    res.json({
      success: true,
      news: formattedNews,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(filteredNews.length / limit),
        totalItems: filteredNews.length,
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

// Fonction spéciale pour les étudiants (actualités spécifiques)
const getStudentNews = async (req, res) => {
  try {
    console.log('🎓 Récupération actualités étudiants');
    
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const newsItems = await News.findAll({
      where: { is_published: true },
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'email', 'first_name', 'last_name']
      }],
      order: [['createdAt', 'DESC']],
      distinct: true
    });

    // Filtrer pour n'avoir que celles destinées aux étudiants
    const studentNews = newsItems.filter(item => {
      const targetRoles = item.target_roles || [];
      return targetRoles.includes('student') || targetRoles.includes('all');
    });

    // Appliquer la pagination
    const paginatedNews = studentNews.slice(offset, offset + parseInt(limit));

    const formattedNews = paginatedNews.map(item => ({
      ...item.toJSON(),
      author_display: getAuthorDisplayName(item.author),
      is_for_student: true
    }));

    res.json({
      success: true,
      news: formattedNews,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(studentNews.length / limit),
        totalItems: studentNews.length,
        hasMore: (page * limit) < studentNews.length
      },
      note: 'Actualités spécifiques aux étudiants'
    });
  } catch (error) {
    console.error('Erreur actualités étudiants:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des actualités pour étudiants.'
    });
  }
};

module.exports = {
  createNews,
  getNews,
  getNewsById,
  updateNews,
  deleteNews,
  searchNews,
  getStudentNews
};