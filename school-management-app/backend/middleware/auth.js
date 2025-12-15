const { verifyToken } = require('../config/auth');
const { User, Teacher, Student, Admin } = require('../models');

const protect = async (req, res, next) => {
    let token;

    // Vérifier si le token est dans les headers
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Extraire le token
            token = req.headers.authorization.split(' ')[1];

            // Vérifier le token
            const decoded = verifyToken(token);

            if (!decoded) {
                return res.status(401).json({
                    success: false,
                    message: 'Token invalide ou expiré'
                });
            }

            // Récupérer l'utilisateur avec le profil
            const user = await User.findByPk(decoded.userId, {
                attributes: { exclude: ['password'] },
                include: [
                    {
                        model: decoded.role === 'admin' ? Admin : 
                               decoded.role === 'teacher' ? Teacher : Student,
                        as: decoded.role === 'admin' ? 'adminProfile' :
                            decoded.role === 'teacher' ? 'teacherProfile' : 'studentProfile'
                    }
                ]
            });

            if (!user || !user.isActive) {
                return res.status(401).json({
                    success: false,
                    message: 'Utilisateur non autorisé ou désactivé'
                });
            }

            // Ajouter l'utilisateur à la requête
            req.user = user;
            
            // Ajouter l'ID du profil pour faciliter les requêtes
            if (user.role === 'teacher' && user.teacherProfile) {
                req.user.teacher = { id: user.teacherProfile.id };
            } else if (user.role === 'student' && user.studentProfile) {
                req.user.student = { id: user.studentProfile.id };
            } else if (user.role === 'admin' && user.adminProfile) {
                req.user.admin = { id: user.adminProfile.id };
            }
            
            next();
        } catch (error) {
            console.error('Erreur d\'authentification:', error);
            return res.status(401).json({
                success: false,
                message: 'Non autorisé'
            });
        }
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Non autorisé, aucun token fourni'
        });
    }
};

// Middleware pour vérifier les rôles
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Non autorisé'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Rôle ${req.user.role} non autorisé à accéder à cette ressource`
            });
        }

        next();
    };
};

module.exports = {
    protect,
    authorize
};