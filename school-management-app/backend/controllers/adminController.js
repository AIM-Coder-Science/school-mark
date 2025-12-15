const { 
    User, Teacher, Student, Admin, Class, Subject, 
    TeacherClassSubject, Publication, History, sequelize 
} = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// @desc    Créer un enseignant
// @route   POST /api/admin/teachers
// @access  Privé (Admin)
const createTeacher = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const { 
            firstName, 
            lastName, 
            email, 
            matricule, 
            phone, 
            specialties,
            classes, // Array d'objets: [{ classId, subjectId }]
            temporaryPassword 
        } = req.body;

        // Validation
        if (!firstName || !lastName || !matricule) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Veuillez fournir le nom, prénom et matricule'
            });
        }

        // Vérifier si le matricule existe déjà
        const existingTeacher = await Teacher.findOne({
            where: { matricule },
            transaction
        });

        if (existingTeacher) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Un enseignant avec ce matricule existe déjà'
            });
        }

        // Vérifier si l'email existe déjà (si fourni)
        if (email) {
            const existingUser = await User.findOne({
                where: { email },
                transaction
            });

            if (existingUser) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Un utilisateur avec cet email existe déjà'
                });
            }
        }

        // Créer l'utilisateur
        const user = await User.create({
            email: email || null,
            password: temporaryPassword || 'Teacher123!', // Mot de passe par défaut
            role: 'teacher',
            isActive: true
        }, { transaction });

        // Créer le profil enseignant
        const teacher = await Teacher.create({
            userId: user.id,
            firstName,
            lastName,
            matricule,
            phone: phone || null,
            specialties: specialties || [],
            createdBy: req.user.id
        }, { transaction });

        // Assigner les classes et matières si fournies
        if (classes && Array.isArray(classes)) {
            for (const assignment of classes) {
                await TeacherClassSubject.create({
                    teacherId: teacher.id,
                    classId: assignment.classId,
                    subjectId: assignment.subjectId
                }, { transaction });
            }
        }

        await transaction.commit();

        // Préparer la réponse
        const teacherWithDetails = await Teacher.findByPk(teacher.id, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['email', 'isActive']
                },
                {
                    model: Class,
                    as: 'classes',
                    through: { attributes: [] },
                    include: [{
                        model: Subject,
                        as: 'subjects',
                        through: { attributes: [] }
                    }]
                }
            ]
        });

        res.status(201).json({
            success: true,
            message: 'Enseignant créé avec succès',
            data: teacherWithDetails,
            credentials: {
                email: user.email || `Matricule: ${matricule}`,
                password: temporaryPassword || 'Teacher123!',
                message: 'Ces identifiants doivent être communiqués à l\'enseignant'
            }
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Erreur création enseignant:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la création de l\'enseignant'
        });
    }
};

// @desc    Créer un apprenant
// @route   POST /api/admin/students
// @access  Privé (Admin)
const createStudent = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const { 
            firstName, 
            lastName, 
            email, 
            matricule, 
            birthDate,
            parentName,
            parentPhone,
            classId,
            temporaryPassword 
        } = req.body;

        // Validation
        if (!firstName || !lastName || !matricule || !classId) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Veuillez fournir le nom, prénom, matricule et classe'
            });
        }

        // Vérifier si la classe existe
        const classExists = await Class.findByPk(classId, { transaction });
        if (!classExists) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Classe non trouvée'
            });
        }

        // Vérifier si le matricule existe déjà
        const existingStudent = await Student.findOne({
            where: { matricule },
            transaction
        });

        if (existingStudent) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Un apprenant avec ce matricule existe déjà'
            });
        }

        // Vérifier si l'email existe déjà (si fourni)
        if (email) {
            const existingUser = await User.findOne({
                where: { email },
                transaction
            });

            if (existingUser) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Un utilisateur avec cet email existe déjà'
                });
            }
        }

        // Créer l'utilisateur
        const user = await User.create({
            email: email || null,
            password: temporaryPassword || 'Student123!', // Mot de passe par défaut
            role: 'student',
            isActive: true
        }, { transaction });

        // Créer le profil apprenant
        const student = await Student.create({
            userId: user.id,
            firstName,
            lastName,
            matricule,
            birthDate: birthDate || null,
            parentName: parentName || null,
            parentPhone: parentPhone || null,
            classId,
            createdBy: req.user.id
        }, { transaction });

        await transaction.commit();

        // Récupérer l'apprenant avec les détails
        const studentWithDetails = await Student.findByPk(student.id, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['email', 'isActive']
                },
                {
                    model: Class,
                    as: 'class',
                    attributes: ['id', 'name', 'level']
                }
            ]
        });

        res.status(201).json({
            success: true,
            message: 'Apprenant créé avec succès',
            data: studentWithDetails,
            credentials: {
                email: user.email || `Matricule: ${matricule}`,
                password: temporaryPassword || 'Student123!',
                message: 'Ces identifiants doivent être communiqués à l\'apprenant'
            }
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Erreur création apprenant:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la création de l\'apprenant'
        });
    }
};

// @desc    Créer une classe
// @route   POST /api/admin/classes
// @access  Privé (Admin)
const createClass = async (req, res) => {
    try {
        const { name, level, teacherPrincipalId, subjects } = req.body;

        if (!name || !level) {
            return res.status(400).json({
                success: false,
                message: 'Veuillez fournir le nom et le niveau de la classe'
            });
        }

        // Vérifier si le professeur principal existe (si fourni)
        if (teacherPrincipalId) {
            const teacher = await Teacher.findByPk(teacherPrincipalId);
            if (!teacher) {
                return res.status(404).json({
                    success: false,
                    message: 'Enseignant principal non trouvé'
                });
            }
        }

        // Créer la classe
        const newClass = await Class.create({
            name,
            level,
            teacherPrincipalId: teacherPrincipalId || null,
            createdBy: req.user.id
        });

        // Assigner les matières à la classe si fournies
        if (subjects && Array.isArray(subjects)) {
            for (const subjectId of subjects) {
                const subject = await Subject.findByPk(subjectId);
                if (subject) {
                    await newClass.addSubject(subject);
                }
            }
        }

        // Récupérer la classe avec les détails
        const classWithDetails = await Class.findByPk(newClass.id, {
            include: [
                {
                    model: Teacher,
                    as: 'principalTeacher',
                    attributes: ['id', 'firstName', 'lastName', 'matricule']
                },
                {
                    model: Subject,
                    as: 'subjects',
                    through: { attributes: [] }
                }
            ]
        });

        res.status(201).json({
            success: true,
            message: 'Classe créée avec succès',
            data: classWithDetails
        });
    } catch (error) {
        console.error('Erreur création classe:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la création de la classe'
        });
    }
};

// @desc    Créer une matière
// @route   POST /api/admin/subjects
// @access  Privé (Admin)
const createSubject = async (req, res) => {
    try {
        const { name, code, coefficient } = req.body;

        if (!name || !code) {
            return res.status(400).json({
                success: false,
                message: 'Veuillez fournir le nom et le code de la matière'
            });
        }

        // Vérifier si le code existe déjà
        const existingSubject = await Subject.findOne({
            where: { code }
        });

        if (existingSubject) {
            return res.status(400).json({
                success: false,
                message: 'Une matière avec ce code existe déjà'
            });
        }

        // Créer la matière
        const subject = await Subject.create({
            name,
            code,
            coefficient: coefficient || 1,
            createdBy: req.user.id
        });

        res.status(201).json({
            success: true,
            message: 'Matière créée avec succès',
            data: subject
        });
    } catch (error) {
        console.error('Erreur création matière:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la création de la matière'
        });
    }
};

// @desc    Assigner un professeur principal à une classe
// @route   PUT /api/admin/classes/:classId/principal
// @access  Privé (Admin)
const assignClassPrincipal = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const { classId } = req.params;
        const { teacherId } = req.body;

        if (!teacherId) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Veuillez fournir l\'ID de l\'enseignant'
            });
        }

        // Vérifier si la classe existe
        const classToUpdate = await Class.findByPk(classId, { transaction });
        if (!classToUpdate) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Classe non trouvée'
            });
        }

        // Vérifier si l'enseignant existe
        const teacher = await Teacher.findByPk(teacherId, { transaction });
        if (!teacher) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Enseignant non trouvé'
            });
        }

        // Vérifier si l'enseignant est assigné à cette classe
        const isAssigned = await TeacherClassSubject.findOne({
            where: {
                teacherId,
                classId
            },
            transaction
        });

        if (!isAssigned) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Cet enseignant n\'est pas assigné à cette classe'
            });
        }

        // Mettre à jour le professeur principal
        classToUpdate.teacherPrincipalId = teacherId;
        await classToUpdate.save({ transaction });

        await transaction.commit();

        // Récupérer la classe mise à jour avec les détails
        const updatedClass = await Class.findByPk(classId, {
            include: [
                {
                    model: Teacher,
                    as: 'principalTeacher',
                    attributes: ['id', 'firstName', 'lastName', 'matricule']
                }
            ]
        });

        res.json({
            success: true,
            message: 'Professeur principal assigné avec succès',
            data: updatedClass
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Erreur assignation professeur principal:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

// @desc    Créer une publication
// @route   POST /api/admin/publications
// @access  Privé (Admin)
const createPublication = async (req, res) => {
    try {
        const { title, content, targetRoles } = req.body;

        if (!title || !content || !targetRoles) {
            return res.status(400).json({
                success: false,
                message: 'Veuillez fournir le titre, le contenu et les destinataires'
            });
        }

        // Validation des rôles cibles
        const validRoles = ['teacher', 'student'];
        const rolesArray = Array.isArray(targetRoles) ? targetRoles : [targetRoles];
        
        const invalidRoles = rolesArray.filter(role => !validRoles.includes(role));
        if (invalidRoles.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Rôles invalides: ${invalidRoles.join(', ')}. Rôles valides: ${validRoles.join(', ')}`
            });
        }

        // Créer la publication
        const publication = await Publication.create({
            title,
            content,
            authorId: req.user.id,
            authorRole: 'admin',
            targetRoles: rolesArray,
            isPublished: true
        });

        res.status(201).json({
            success: true,
            message: 'Publication créée avec succès',
            data: publication
        });
    } catch (error) {
        console.error('Erreur création publication:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la création de la publication'
        });
    }
};

// @desc    Obtenir les statistiques
// @route   GET /api/admin/stats
// @access  Privé (Admin)
const getStats = async (req, res) => {
    try {
        // Compter les utilisateurs par rôle
        const userCounts = await User.findAll({
            attributes: [
                'role',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['role']
        });

        // Compter les classes
        const classCount = await Class.count();

        // Compter les matières
        const subjectCount = await Subject.count();

        // Dernières activités (publications récentes)
        const recentPublications = await Publication.findAll({
            limit: 5,
            order: [['created_at', 'DESC']],
            include: [{
                model: User,
                as: 'author',
                attributes: ['id', 'email', 'role'],
                include: [{
                    model: Admin,
                    as: "adminProfile",
                    attributes: ['firstName', 'lastName']
                }]
            }]
        });

        // Derniers apprenants ajoutés
        const recentStudents = await Student.findAll({
            limit: 5,
            order: [['id', 'DESC']],
            include: [{
                model: Class,
                as: 'class',
                attributes: ['name', 'level']
            }]
        });

        // Derniers enseignants ajoutés
        const recentTeachers = await Teacher.findAll({
            limit: 5,
            order: [['id', 'DESC']],
            include: [{
                model: Class,
                as: 'classes',
                through: { attributes: [] },
                attributes: ['name', 'level']
            }]
        });

        // Préparer les statistiques
        const stats = {
            users: {},
            totals: {
                classes: classCount,
                subjects: subjectCount,
                publications: await Publication.count()
            },
            recentActivities: {
                publications: recentPublications,
                students: recentStudents,
                teachers: recentTeachers
            }
        };

        // Organiser les comptes d'utilisateurs
        userCounts.forEach(item => {
            stats.users[item.role] = parseInt(item.get('count'));
        });

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Erreur récupération statistiques:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

// @desc    Obtenir tous les enseignants
// @route   GET /api/admin/teachers
// @access  Privé (Admin)
const getAllTeachers = async (req, res) => {
    try {
        const teachers = await Teacher.findAll({
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['email', 'isActive', 'created_at']
                },
                {
                    model: Class,
                    as: 'classes',
                    through: { attributes: [] },
                    include: [{
                        model: Subject,
                        as: 'subjects',
                        through: { attributes: [] }
                    }]
                },
                {
                    model: Class,
                    as: 'principalOfClasses',
                    attributes: ['id', 'name', 'level']
                }
            ],
            order: [['lastName', 'ASC']]
        });

        res.json({
            success: true,
            count: teachers.length,
            data: teachers
        });
    } catch (error) {
        console.error('Erreur récupération enseignants:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

// @desc    Obtenir tous les apprenants
// @route   GET /api/admin/students
// @access  Privé (Admin)
const getAllStudents = async (req, res) => {
    try {
        const { classId } = req.query;
        
        const whereCondition = {};
        if (classId) {
            whereCondition.classId = classId;
        }

        const students = await Student.findAll({
            where: whereCondition,
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['email', 'isActive', 'created_at']
                },
                {
                    model: Class,
                    as: 'class',
                    attributes: ['id', 'name', 'level']
                }
            ],
            order: [['lastName', 'ASC']]
        });

        res.json({
            success: true,
            count: students.length,
            data: students
        });
    } catch (error) {
        console.error('Erreur récupération apprenants:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

// @desc    Obtenir toutes les classes
// @route   GET /api/admin/classes
// @access  Privé (Admin)
const getAllClasses = async (req, res) => {
    try {
        const classes = await Class.findAll({
            include: [
                {
                    model: Teacher,
                    as: 'principalTeacher',
                    attributes: ['id', 'firstName', 'lastName', 'matricule']
                },
                {
                    model: Subject,
                    as: 'subjects',
                    through: { attributes: [] }
                },
                {
                    model: Student,
                    as: 'students',
                    attributes: ['id', 'firstName', 'lastName', 'matricule']
                },
                {
                    model: Teacher,
                    as: 'teachers',
                    through: { attributes: [] },
                    attributes: ['id', 'firstName', 'lastName', 'matricule']
                }
            ],
            order: [['level', 'ASC'], ['name', 'ASC']]
        });

        res.json({
            success: true,
            count: classes.length,
            data: classes
        });
    } catch (error) {
        console.error('Erreur récupération classes:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

// @desc    Mettre à jour un utilisateur
// @route   PUT /api/admin/users/:userId
// @access  Privé (Admin)
const updateUser = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const { userId } = req.params;
        const { isActive, email, password } = req.body;

        const user = await User.findByPk(userId, { transaction });
        if (!user) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        // Mettre à jour les champs
        if (isActive !== undefined) user.isActive = isActive;
        if (email) user.email = email;
        if (password) user.password = password;

        await user.save({ transaction });
        await transaction.commit();

        res.json({
            success: true,
            message: 'Utilisateur mis à jour avec succès',
            data: user
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Erreur mise à jour utilisateur:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

// @desc    Supprimer un utilisateur
// @route   DELETE /api/admin/users/:userId
// @access  Privé (Admin)
const deleteUser = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const { userId } = req.params;

        const user = await User.findByPk(userId, { transaction });
        if (!user) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        // Ne pas permettre la suppression de l'admin principal
        if (user.role === 'admin' && user.email === 'admin@school.com') {
            await transaction.rollback();
            return res.status(403).json({
                success: false,
                message: 'Impossible de supprimer l\'administrateur principal'
            });
        }

        await user.destroy({ transaction });
        await transaction.commit();

        res.json({
            success: true,
            message: 'Utilisateur supprimé avec succès'
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Erreur suppression utilisateur:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

module.exports = {
    createTeacher,
    createStudent,
    createClass,
    createSubject,
    assignClassPrincipal,
    createPublication,
    getStats,
    getAllTeachers,
    getAllStudents,
    getAllClasses,
    updateUser,
    deleteUser
};