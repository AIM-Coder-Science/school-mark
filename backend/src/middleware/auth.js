const jwt = require('jsonwebtoken');
const { User, Student, Teacher } = require('../models');

// Vérifier le token JWT
const auth = async (req, res, next) => {
  try {
    console.log('🔐 Auth middleware - Début');
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('❌ Token manquant');
      return res.status(401).json({ 
        success: false, 
        message: 'Accès refusé. Token manquant.' 
      });
    }

    console.log('📝 Token reçu:', token.substring(0, 20) + '...');

    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votre_secret_par_defaut');
    console.log('✅ Token décodé:', decoded);
    
    // Récupérer l'utilisateur avec ses relations - AVEC LES ALIAS
    const user = await User.findOne({
      where: { id: decoded.id },
      attributes: { exclude: ['password'] },
      include: [
        { 
          model: Student, 
          as: 'Student',  // <-- AJOUTE CETTE LIGNE
          required: false,
          attributes: ['id', 'first_name', 'last_name', 'matricule', 'class_id', 'user_id']
        },
        { 
          model: Teacher, 
          as: 'Teacher',  // <-- AJOUTE CETTE LIGNE
          required: false,
          attributes: ['id', 'first_name', 'last_name', 'specialty', 'phone', 'user_id']
        }
      ]
    });

    console.log('👤 Utilisateur trouvé:', {
      id: user?.id,
      email: user?.email,
      role: user?.role,
      is_active: user?.is_active,
      hasStudent: !!user?.Student,
      hasTeacher: !!user?.Teacher
    });

    if (!user) {
      console.log('❌ Utilisateur non trouvé pour ID:', decoded.id);
      return res.status(401).json({ 
        success: false, 
        message: 'Token invalide ou utilisateur désactivé.' 
      });
    }

    if (!user.is_active) {
      console.log('❌ Utilisateur désactivé:', user.email);
      return res.status(401).json({ 
        success: false, 
        message: 'Compte désactivé. Contactez l\'administrateur.' 
      });
    }

    // Préparer l'objet user pour req.user
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      Student: user.Student,
      Teacher: user.Teacher
    };

    // Ajouter l'ID spécifique selon le rôle
    if (user.role === 'student' && user.Student) {
      req.user.studentId = user.Student.id;
    } else if (user.role === 'teacher' && user.Teacher) {
      req.user.teacherId = user.Teacher.id;
    }

    console.log('✅ Auth middleware - Succès:', {
      userId: req.user.id,
      role: req.user.role,
      studentId: req.user.studentId || 'N/A',
      teacherId: req.user.teacherId || 'N/A'
    });

    next();
  } catch (error) {
    console.error('❌ Erreur auth middleware:', error.message);
    console.error('Type d\'erreur:', error.name);
    console.error('Stack:', error.stack);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token invalide.' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expiré. Veuillez vous reconnecter.' 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Erreur d\'authentification.',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Vérifier le rôle
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Accès refusé. Rôle ${req.user.role} non autorisé pour cette action.`
      });
    }
    next();
  };
};

module.exports = {
  auth,
  authorize
};