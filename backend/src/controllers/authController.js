const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Student, Teacher } = require('../models');

const login = async (req, res) => {
  try {
    console.log('🔐 Tentative de login avec:', req.body.email);
    
    const { email, password } = req.body;

    // Validation des données
    if (!email || !password) {
      console.log('❌ Email ou mot de passe manquant');
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe sont requis.'
      });
    }

    // Chercher l'utilisateur AVEC ses relations en utilisant les bons alias
    const user = await User.findOne({
      where: { email },
      include: [
        { 
          model: Student, 
          as: 'Student',  // <-- AJOUTE 'as: Student'
          required: false,
          attributes: ['id', 'first_name', 'last_name', 'matricule', 'class_id']
        },
        { 
          model: Teacher, 
          as: 'Teacher',  // <-- AJOUTE 'as: Teacher'
          required: false,
          attributes: ['id', 'first_name', 'last_name', 'specialty', 'phone']
        }
      ]
    });

    console.log('👤 Utilisateur trouvé:', user ? 'Oui' : 'Non');
    
    if (!user) {
      console.log('❌ Aucun utilisateur avec cet email:', email);
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect.'
      });
    }

    // Vérifier si le compte est actif
    if (!user.is_active) {
      console.log('❌ Compte désactivé:', email);
      return res.status(401).json({
        success: false,
        message: 'Compte désactivé. Contactez l\'administrateur.'
      });
    }

    // Vérifier le mot de passe
    console.log('🔑 Vérification du mot de passe...');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      console.log('❌ Mot de passe incorrect pour:', email);
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect.'
      });
    }

    // Créer le token JWT
    console.log('🎫 Création du token JWT...');
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'default_secret_key_for_dev',
      { expiresIn: '24h' }
    );

    // Préparer la réponse
    const responseData = {
      success: true,
      message: 'Connexion réussie.',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
        student: user.Student,  // Note: 'Student' avec majuscule car c'est l'alias
        teacher: user.Teacher   // Note: 'Teacher' avec majuscule car c'est l'alias
      }
    };

    console.log('✅ Login réussi pour:', email);
    console.log('📊 Rôle:', user.role);
    console.log('👨‍🎓 Has Student:', !!user.Student);
    console.log('👨‍🏫 Has Teacher:', !!user.Teacher);

    res.json(responseData);

  } catch (error) {
    console.error('❌ Erreur détaillée dans login:');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    
    // Vérifier le type d'erreur
    if (error.name === 'SequelizeConnectionError') {
      return res.status(500).json({
        success: false,
        message: 'Erreur de connexion à la base de données.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion. Veuillez réessayer.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getProfile = async (req, res) => {
  try {
    // Récupérer l'utilisateur avec les relations pour le profil
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
      include: [
        { 
          model: Student, 
          as: 'Student',
          required: false 
        },
        { 
          model: Teacher, 
          as: 'Teacher',
          required: false 
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé.'
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
        created_at: user.createdAt,
        student: user.Student,
        teacher: user.Teacher
      }
    });
  } catch (error) {
    console.error('Erreur récupération profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil.'
    });
  }
};

module.exports = {
  login,
  getProfile
};