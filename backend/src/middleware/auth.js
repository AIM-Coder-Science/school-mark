const jwt = require('jsonwebtoken');
const { User, Student, Teacher } = require('../models');

// Middleware d'authentification
const auth = async (req, res, next) => {
  try {
    console.log('🔐 Auth middleware - Début');

    // Récupérer le token depuis le header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Accès non autorisé. Token manquant.'
      });
    }

    const token = authHeader.split(' ')[1];
    console.log('📝 Token reçu:', token.substring(0, 20) + '...');

    // Vérifier et décoder le token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'votre_secret_jwt_par_defaut');
      console.log('✅ Token décodé:', decoded);
    } catch (error) {
      console.log('❌ Erreur vérification token:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Token invalide ou expiré.'
      });
    }

    // Récupérer l'utilisateur avec ses associations
    const user = await User.findOne({
      where: { id: decoded.id },
      include: [
        {
          model: Student,
          as: 'Student',
          attributes: ['id', 'first_name', 'last_name', 'matricule', 'class_id'],
          required: false
        },
        {
          model: Teacher,
          as: 'Teacher',
          attributes: ['id', 'first_name', 'last_name', 'specialty', 'phone'],
          required: false
        }
      ]
    });

    if (!user) {
      console.log('❌ Utilisateur non trouvé avec ID:', decoded.id);
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé.'
      });
    }

    // Vérifier si l'utilisateur est actif
    if (!user.is_active) {
      console.log('❌ Utilisateur désactivé:', user.email);
      return res.status(403).json({
        success: false,
        message: 'Votre compte est désactivé. Contactez l\'administrateur.'
      });
    }

    console.log('👤 Utilisateur trouvé:', {
      id: user.id,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      hasStudent: !!user.Student,
      hasTeacher: !!user.Teacher
    });

    // Préparer les données de l'utilisateur pour le reste de l'application
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      // Ajouter les infos spécifiques selon le rôle
      ...(user.role === 'student' && user.Student && {
        studentId: user.Student.id,
        firstName: user.Student.first_name,
        lastName: user.Student.last_name,
        matricule: user.Student.matricule,
        classId: user.Student.class_id
      }),
      ...(user.role === 'teacher' && user.Teacher && {
        teacherId: user.Teacher.id,
        firstName: user.Teacher.first_name,
        lastName: user.Teacher.last_name,
        specialty: user.Teacher.specialty,
        phone: user.Teacher.phone
      })
    };

    console.log('✅ Auth middleware - Succès:', {
      userId: req.user.id,
      role: req.user.role,
      studentId: req.user.studentId || 'N/A',
      teacherId: req.user.teacherId || 'N/A'
    });

    next();
  } catch (error) {
    console.error('❌ Erreur auth middleware:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur d\'authentification.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Middleware de contrôle d'accès par rôle
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      console.log('🔒 Authorization middleware - Début');
      console.log('👤 Rôle utilisateur:', req.user?.role);
      console.log('🎯 Rôles autorisés:', allowedRoles);

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentification requise.'
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        console.log('❌ Accès refusé. Rôle non autorisé.');
        return res.status(403).json({
          success: false,
          message: `Accès refusé. Rôle ${req.user.role} non autorisé pour cette ressource.`
        });
      }

      console.log('✅ Authorization middleware - Succès');
      next();
    } catch (error) {
      console.error('❌ Erreur authorization middleware:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur de vérification des autorisations.'
      });
    }
  };
};

// Middleware spécifique pour les étudiants
const studentAccessControl = (req, res, next) => {
  try {
    console.log('🎓 Student access control - Début');

    if (req.user.role !== 'student') {
      return next(); // Passer au middleware suivant si ce n'est pas un étudiant
    }

    // Vérifier que l'étudiant a un profil complet
    if (!req.user.studentId) {
      console.log('❌ Étudiant sans profil complet:', req.user.email);
      return res.status(403).json({
        success: false,
        message: 'Profil étudiant incomplet. Contactez l\'administrateur.'
      });
    }

    // Vérifier que l'étudiant est dans une classe
    if (!req.user.classId) {
      console.log('⚠️ Étudiant sans classe assignée:', req.user.email);
      // On peut permettre l'accès mais afficher un avertissement
      req.user.hasNoClass = true;
    }

    console.log('✅ Student access control - Succès:', {
      studentId: req.user.studentId,
      classId: req.user.classId || 'Non assigné'
    });
    next();
  } catch (error) {
    console.error('❌ Erreur student access control:', error);
    next(error);
  }
};

// Middleware spécifique pour les enseignants
const teacherAccessControl = (req, res, next) => {
  try {
    console.log('👨‍🏫 Teacher access control - Début');

    if (req.user.role !== 'teacher') {
      return next();
    }

    // Vérifier que l'enseignant a un profil complet
    if (!req.user.teacherId) {
      console.log('❌ Enseignant sans profil complet:', req.user.email);
      return res.status(403).json({
        success: false,
        message: 'Profil enseignant incomplet. Contactez l\'administrateur.'
      });
    }

    console.log('✅ Teacher access control - Succès:', {
      teacherId: req.user.teacherId,
      specialty: req.user.specialty || 'Non spécifiée'
    });
    next();
  } catch (error) {
    console.error('❌ Erreur teacher access control:', error);
    next(error);
  }
};

// Middleware pour vérifier la propriété (un utilisateur ne peut modifier que ses propres données)
const isOwnerOrAdmin = (modelName, paramName = 'id') => {
  return async (req, res, next) => {
    try {
      console.log('👑 Ownership check - Début');

      // Les admins peuvent tout faire
      if (req.user.role === 'admin') {
        console.log('✅ Admin - accès autorisé');
        return next();
      }

      const resourceId = req.params[paramName];
      const userId = req.user.id;
      const userRole = req.user.role;

      console.log('📋 Vérification propriété:', {
        model: modelName,
        resourceId,
        userId,
        userRole
      });

      // Logique spécifique selon le modèle
      switch (modelName) {
        case 'User':
          // Un utilisateur ne peut modifier que son propre profil
          if (parseInt(resourceId) === userId) {
            console.log('✅ Propriétaire du profil - accès autorisé');
            return next();
          }
          break;

        case 'Student':
          // Un étudiant ne peut accéder qu'à son propre profil
          if (userRole === 'student' && req.user.studentId === parseInt(resourceId)) {
            console.log('✅ Étudiant propriétaire - accès autorisé');
            return next();
          }
          // Un enseignant peut voir les étudiants de ses classes
          if (userRole === 'teacher') {
            // Ici, vous devriez vérifier si l'étudiant est dans une classe de l'enseignant
            // Pour simplifier, on autorise temporairement
            console.log('✅ Enseignant - accès temporairement autorisé');
            return next();
          }
          break;

        case 'News':
          // Les auteurs peuvent modifier leurs propres actualités
          if (userRole === 'admin' || userRole === 'teacher') {
            // Vérifier si l'utilisateur est l'auteur de l'actualité
            const news = await require('../models').News.findByPk(resourceId);
            if (news && news.author_id === userId) {
              console.log('✅ Auteur de l\'actualité - accès autorisé');
              return next();
            }
          }
          break;

        default:
          console.log(`⚠️ Modèle ${modelName} non géré dans isOwnerOrAdmin`);
      }

      console.log('❌ Accès refusé - Pas propriétaire ni admin');
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à accéder à cette ressource.'
      });
    } catch (error) {
      console.error('❌ Erreur ownership check:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification des permissions.'
      });
    }
  };
};

// Fonction pour générer un token JWT
const generateToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role
  };

  const options = {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  };

  return jwt.sign(payload, process.env.JWT_SECRET || 'votre_secret_jwt_par_defaut', options);
};

// Fonction pour décoder un token (utile pour les tests)
const decodeToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'votre_secret_jwt_par_defaut');
  } catch (error) {
    return null;
  }
};

module.exports = {
  auth,
  authorize,
  studentAccessControl,
  teacherAccessControl,
  isOwnerOrAdmin,
  generateToken,
  decodeToken
};