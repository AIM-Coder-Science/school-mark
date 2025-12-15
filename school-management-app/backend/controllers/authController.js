const { User, Teacher, Student, Admin } = require('../models');
const { generateToken } = require('../config/auth');
const { Op } = require('sequelize');

// @desc    Connexion utilisateur
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    try {
        const { email, password, matricule } = req.body;

        // Valider les données d'entrée
        if ((!email && !matricule) || !password) {
            return res.status(400).json({
                success: false,
                message: 'Veuillez fournir un email/matricule et un mot de passe'
            });
        }

        // 🛑 NOUVEAU : Construire la clause WHERE de manière conditionnelle 🛑
        const whereConditions = [];
        let includeModels = [
            { model: Admin, as: 'adminProfile', required: false }, // Inclure Admin pour tous
        ];
        
        // 1. Recherche par Email (si l'email est fourni)
        if (email) {
            whereConditions.push({ email: email });
        }

        // 2. Recherche par Matricule (si le matricule est fourni)
        if (matricule) {
            // Ajouter les modèles Teacher et Student aux inclusions si on cherche par matricule
            includeModels.push({ model: Teacher, as: 'teacherProfile', required: true });
            includeModels.push({ model: Student, as: 'studentProfile', required: true });

            whereConditions.push({
                [Op.or]: [
                    { // Recherche dans le profil enseignant
                        [Op.and]: [
                            { role: 'teacher' },
                            { '$teacherProfile.matricule$': matricule }
                        ]
                    },
                    { // Recherche dans le profil étudiant
                        [Op.and]: [
                            { role: 'student' },
                            { '$studentProfile.matricule$': matricule }
                        ]
                    }
                ]
            });
        }
        
        // Gérer le cas où un email est fourni mais est vide, ou un matricule est fourni mais vide (bien que la validation front le gère)
        if (whereConditions.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Veuillez fournir un email ou un matricule valide'
            });
        }


        // Chercher l'utilisateur
        let user = await User.findOne({
            where: { [Op.or]: whereConditions },
            include: includeModels
        });
        
        // ... (Le reste du code reste inchangé, à partir de la vérification !user)
        
// ...
        /*let user = await User.findOne({
            where: {
                [Op.or]: [
                    { email: email || '' },
                    { 
                        [Op.and]: [
                            { role: { [Op.in]: ['teacher', 'student'] } },
                            { '$teacherProfile.matricule$': matricule },
                            { email: { [Op.is]: null } }
                        ]
                    },
                    { 
                        [Op.and]: [
                            { role: { [Op.in]: ['teacher', 'student'] } },
                            { '$studentProfile.matricule$': matricule },
                            { email: { [Op.is]: null } }
                        ]
                    }
                ]
            },
            include: [
                {
                    model: Teacher,
                    as: 'teacherProfile',
                    required: false
                },
                {
                    model: Student,
                    as: 'studentProfile',
                    required: false
                },
                {
                    model: Admin,
                    as: 'adminProfile',
                    required: false
                }
            ]
        });*/

        // Vérifier si l'utilisateur existe
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Identifiants incorrects'
            });
        }

        // Vérifier si le compte est actif
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Votre compte est désactivé. Contactez l\'administrateur'
            });
        }

        // Vérifier le mot de passe
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Identifiants incorrects'
            });
        }

        // Récupérer les informations du profil selon le rôle
        let profile = null;
        switch (user.role) {
            case 'admin':
                profile = user.adminProfile;
                break;
            case 'teacher':
                profile = user.teacherProfile;
                break;
            case 'student':
                profile = user.studentProfile;
                break;
        }

        // Si pas de profil trouvé
        if (!profile) {
            return res.status(500).json({
                success: false,
                message: 'Profil utilisateur non trouvé'
            });
        }

        // Générer le token JWT
        const token = generateToken(user.id, user.role, user.email);

        // Réponse avec les informations de l'utilisateur
        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
                createdAt: user.created_at,
                profile: {
                    id: profile.id,
                    firstName: profile.firstName || profile.first_name,
                    lastName: profile.lastName || profile.last_name,
                    ...(profile.photo && { photo: profile.photo }),
                    ...(profile.phone && { phone: profile.phone }),
                    ...(user.role === 'teacher' && { 
                        matricule: profile.matricule,
                        specialties: profile.specialties,
                        score: profile.score
                    }),
                    ...(user.role === 'student' && { 
                        matricule: profile.matricule,
                        classId: profile.classId || profile.class_id,
                        ...(profile.birthDate && { birthDate: profile.birthDate }),
                        ...(profile.parentName && { parentName: profile.parentName }),
                        ...(profile.parentPhone && { parentPhone: profile.parentPhone })
                    }),
                    ...(user.role === 'admin' && {
                        phone: profile.phone
                    })
                }
            }
        });
    } catch (error) {
        console.error('Erreur de connexion:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la connexion'
        });
    }
};

// @desc    Récupérer le profil utilisateur
// @route   GET /api/auth/me
// @access  Privé
const getMe = async (req, res) => {
    try {
        let includeOptions = [];
        
        // Inclure le bon modèle selon le rôle
        switch (req.user.role) {
            case 'admin':
                includeOptions = [{
                    model: Admin,
                    as: 'adminProfile'
                }];
                break;
            case 'teacher':
                includeOptions = [{
                    model: Teacher,
                    as: 'teacherProfile'
                }];
                break;
            case 'student':
                includeOptions = [{
                    model: Student,
                    as: 'studentProfile',
                    include: [{
                        model: require('../models/Class'),
                        as: 'class'
                    }]
                }];
                break;
        }

        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] },
            include: includeOptions
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        // Formater la réponse
        const responseData = {
            id: user.id,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.created_at
        };

        // Ajouter les informations du profil
        if (user.role === 'admin' && user.adminProfile) {
            responseData.profile = {
                id: user.adminProfile.id,
                firstName: user.adminProfile.firstName || user.adminProfile.first_name,
                lastName: user.adminProfile.lastName || user.adminProfile.last_name,
                phone: user.adminProfile.phone
            };
        } else if (user.role === 'teacher' && user.teacherProfile) {
            responseData.profile = {
                id: user.teacherProfile.id,
                firstName: user.teacherProfile.firstName || user.teacherProfile.first_name,
                lastName: user.teacherProfile.lastName || user.teacherProfile.last_name,
                matricule: user.teacherProfile.matricule,
                photo: user.teacherProfile.photo,
                phone: user.teacherProfile.phone,
                specialties: user.teacherProfile.specialties,
                score: user.teacherProfile.score
            };
        } else if (user.role === 'student' && user.studentProfile) {
            responseData.profile = {
                id: user.studentProfile.id,
                firstName: user.studentProfile.firstName || user.studentProfile.first_name,
                lastName: user.studentProfile.lastName || user.studentProfile.last_name,
                matricule: user.studentProfile.matricule,
                photo: user.studentProfile.photo,
                birthDate: user.studentProfile.birthDate || user.studentProfile.birth_date,
                classId: user.studentProfile.classId || user.studentProfile.class_id,
                parentName: user.studentProfile.parentName || user.studentProfile.parent_name,
                parentPhone: user.studentProfile.parentPhone || user.studentProfile.parent_phone
            };
            
            // Inclure les informations de la classe si disponibles
            if (user.studentProfile.class) {
                responseData.profile.class = {
                    id: user.studentProfile.class.id,
                    name: user.studentProfile.class.name,
                    level: user.studentProfile.class.level
                };
            }
        }

        res.json({
            success: true,
            data: responseData
        });
    } catch (error) {
        console.error('Erreur récupération profil:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

// @desc    Changer le mot de passe
// @route   PUT /api/auth/change-password
// @access  Privé
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Veuillez fournir l\'ancien et le nouveau mot de passe'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
            });
        }

        const user = await User.findByPk(req.user.id);

        // Vérifier l'ancien mot de passe
        const isPasswordValid = await user.comparePassword(currentPassword);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Mot de passe actuel incorrect'
            });
        }

        // Mettre à jour le mot de passe
        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Mot de passe changé avec succès'
        });
    } catch (error) {
        console.error('Erreur changement mot de passe:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

// @desc    Déconnexion (côté client généralement)
// @route   POST /api/auth/logout
// @access  Privé
const logout = async (req, res) => {
    try {
        // Dans une implémentation JWT stateless, la déconnexion se fait côté client
        res.json({
            success: true,
            message: 'Déconnexion réussie'
        });
    } catch (error) {
        console.error('Erreur déconnexion:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

// @desc    Rafraîchir le token (optionnel)
// @route   POST /api/auth/refresh-token
// @access  Privé
const refreshToken = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: ['id', 'email', 'role']
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        // Générer un nouveau token
        const newToken = generateToken(user.id, user.role, user.email);

        res.json({
            success: true,
            token: newToken,
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Erreur rafraîchissement token:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

// @desc    Vérifier si l'email/matricule existe
// @route   POST /api/auth/check-availability
// @access  Public
const checkAvailability = async (req, res) => {
    try {
        const { email, matricule } = req.body;

        const checks = {};

        if (email) {
            const emailExists = await User.findOne({
                where: { email }
            });
            checks.email = !emailExists;
        }

        if (matricule) {
            // Vérifier chez les enseignants
            const teacherMatricule = await require('../models/Teacher').findOne({
                where: { matricule }
            });

            // Vérifier chez les étudiants
            const studentMatricule = await require('../models/Student').findOne({
                where: { matricule }
            });

            checks.matricule = !teacherMatricule && !studentMatricule;
        }

        res.json({
            success: true,
            data: checks
        });
    } catch (error) {
        console.error('Erreur vérification disponibilité:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

// @desc    Demande de réinitialisation de mot de passe
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
    try {
        const { email, matricule } = req.body;

        if (!email && !matricule) {
            return res.status(400).json({
                success: false,
                message: 'Veuillez fournir un email ou un matricule'
            });
        }

        // Chercher l'utilisateur
        let user = await User.findOne({
            where: {
                [Op.or]: [
                    { email: email || '' },
                    { 
                        [Op.and]: [
                            { role: 'teacher' },
                            { '$teacherProfile.matricule$': matricule }
                        ]
                    },
                    { 
                        [Op.and]: [
                            { role: 'student' },
                            { '$studentProfile.matricule$': matricule }
                        ]
                    }
                ]
            },
            include: [
                {
                    model: Teacher,
                    as: 'teacherProfile',
                    required: false
                },
                {
                    model: Student,
                    as: 'studentProfile',
                    required: false
                }
            ]
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Aucun compte trouvé avec ces informations'
            });
        }

        if (!user.isActive) {
            return res.status(400).json({
                success: false,
                message: 'Ce compte est désactivé. Contactez l\'administrateur'
            });
        }

        // Générer un token de réinitialisation (simplifié pour l'exemple)
        const resetToken = generateToken(user.id, user.role, user.email);
        const resetTokenExpiry = Date.now() + 3600000; // 1 heure

        // En production, vous sauvegarderiez le token dans la base
        // et enverriez un email avec le lien de réinitialisation

        res.json({
            success: true,
            message: 'Instructions de réinitialisation envoyées (simulé)',
            // En production, ne pas envoyer le token dans la réponse
            // data: { resetToken, resetTokenExpiry }
            data: {
                message: 'Dans une version réelle, un email serait envoyé avec un lien de réinitialisation'
            }
        });
    } catch (error) {
        console.error('Erreur demande réinitialisation:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

// @desc    Réinitialiser le mot de passe avec token
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Token et nouveau mot de passe requis'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Le mot de passe doit contenir au moins 6 caractères'
            });
        }

        // Vérifier le token (simplifié)
        // En production, vous vérifieriez le token dans la base
        const { verifyToken } = require('../config/auth');
        const decoded = verifyToken(token);

        if (!decoded) {
            return res.status(400).json({
                success: false,
                message: 'Token invalide ou expiré'
            });
        }

        // Trouver l'utilisateur
        const user = await User.findByPk(decoded.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        // Mettre à jour le mot de passe
        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Mot de passe réinitialisé avec succès'
        });
    } catch (error) {
        console.error('Erreur réinitialisation mot de passe:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

module.exports = {
    login,
    getMe,
    changePassword,
    logout,
    refreshToken,
    checkAvailability,
    forgotPassword,
    resetPassword
};