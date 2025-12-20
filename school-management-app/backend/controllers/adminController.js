const { 
    User, Teacher, Student, Admin, Class, Subject, 
    TeacherClassSubject, Publication, History, sequelize 
} = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

//=======================================================
// TEACHERS ENDPOINTS
//=======================================================

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
                    as: 'assignedClasses',
                    through: { attributes: [] }
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
/*
const getTeacher = async (req, res) => {
    try {
        const { teacherId } = req.params;

        // Requête SQL directe pour obtenir les classes et matières enseignées par ce prof
        const [results] = await sequelize.query(`
            SELECT 
                t.id as teacherId,
                t.firstName,
                t.lastName,
                t.matricule,
                t.email,
                t.phone,
                t.specialties,
                c.id as classId,
                c.name as className,
                c.level as classLevel,
                s.id as subjectId,
                s.name as subjectName,
                s.code as subjectCode,
                pt.id as principalTeacherId,
                pt.firstName as principalFirstName,
                pt.lastName as principalLastName,
                (
                    SELECT COUNT(*)
                    FROM students st
                    WHERE st.classId = c.id
                ) as studentCount
            FROM teachers t
            LEFT JOIN teacher_class_subject tcs ON t.id = tcs.teacherId
            LEFT JOIN classes c ON tcs.classId = c.id
            LEFT JOIN subjects s ON tcs.subjectId = s.id
            LEFT JOIN teachers pt ON c.teacherPrincipalId = pt.id
            WHERE t.id = ?
            ORDER BY c.level, c.name, s.name
        `, {
            replacements: [teacherId]
        });

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Enseignant non trouvé'
            });
        }

        // Structure les données
        const teacherInfo = results[0];
        const classesMap = new Map();

        results.forEach(row => {
            if (!row.classId) return; // Si pas de classe assignée
            
            if (!classesMap.has(row.classId)) {
                classesMap.set(row.classId, {
                    id: row.classId,
                    name: row.className,
                    level: row.classLevel,
                    studentCount: row.studentCount,
                    principalTeacher: row.principalTeacherId ? {
                        id: row.principalTeacherId,
                        firstName: row.principalFirstName,
                        lastName: row.principalLastName
                    } : null,
                    subjectsTaught: []
                });
            }

            // Ajouter la matière si elle existe
            if (row.subjectId) {
                const classData = classesMap.get(row.classId);
                classData.subjectsTaught.push({
                    id: row.subjectId,
                    name: row.subjectName,
                    code: row.subjectCode
                });
            }
        });

        // Récupérer aussi les classes où l'enseignant est professeur principal
        const principalClasses = await Class.findAll({
            where: { teacherPrincipalId: teacherId },
            attributes: ['id', 'name', 'level']
        });

        // Récupérer les infos de l'utilisateur
        const user = await User.findByPk(teacherInfo.userId, {
            attributes: ['id', 'email', 'isActive', 'created_at']
        });

        // Construire la réponse
        const response = {
            id: teacherInfo.teacherId,
            firstName: teacherInfo.firstName,
            lastName: teacherInfo.lastName,
            matricule: teacherInfo.matricule,
            email: teacherInfo.email,
            phone: teacherInfo.phone,
            specialties: teacherInfo.specialties,
            user: user,
            assignedClasses: Array.from(classesMap.values()),
            principalOfClasses: principalClasses,
            teacherSubjects: Array.from(new Set(
                results
                    .filter(row => row.subjectId)
                    .map(row => ({
                        id: row.subjectId,
                        name: row.subjectName,
                        code: row.subjectCode
                    }))
            ))
        };

        res.json({
            success: true,
            data: response
        });
    } catch (error) {
        console.error('Erreur récupération enseignant:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};
*/

// @desc    Obtenir un enseignant par ID (version améliorée)
// @route   GET /api/admin/teachers/:teacherId
// @access  Privé (Admin)
const getTeacher = async (req, res) => {
    try {
        const { teacherId } = req.params;

        // Récupérer l'enseignant avec toutes les informations nécessaires
        const teacher = await Teacher.findByPk(teacherId, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'email', 'isActive', 'created_at']
                },
                {
                    model: Class,
                    as: 'assignedClasses',
                    through: { attributes: [] },
                    include: [
                        {
                            model: Student,
                            as: 'students',
                            attributes: ['id']
                        },
                        {
                            model: Teacher,
                            as: 'principalTeacher',
                            attributes: ['id', 'first_name', 'last_name', 'matricule']
                        }
                    ]
                },
                {
                    model: Class,
                    as: 'principalOfClasses',
                    attributes: ['id', 'name', 'level']
                }
            ]
        });

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: 'Enseignant non trouvé'
            });
        }

        // Récupérer les matières enseignées par ce prof
        const assignments = await TeacherClassSubject.findAll({
            where: { teacherId },
            include: [{
                model: Subject,
                attributes: ['id', 'name', 'code']
            }]
        });

        // Organiser les matières par classe
        const subjectsByClass = {};
        assignments.forEach(assign => {
            if (!subjectsByClass[assign.classId]) {
                subjectsByClass[assign.classId] = [];
            }
            if (assign.Subject) {
                subjectsByClass[assign.classId].push({
                    id: assign.Subject.id,
                    name: assign.Subject.name,
                    code: assign.Subject.code
                });
            }
        });

        // Récupérer toutes les matières du système (pour référence)
        const allSubjects = await Subject.findAll({
            attributes: ['id', 'name', 'code']
        });

        // Récupérer les matières de chaque classe
        const classIds = teacher.assignedClasses?.map(c => c.id) || [];
        const classSubjects = await Class.findAll({
            where: { id: classIds },
            include: [{
                model: Subject,
                as: 'classSubjects',
                through: { attributes: [] },
                attributes: ['id', 'name', 'code']
            }],
            attributes: ['id']
        });

        // Créer un mapping des matières par classe
        const allSubjectsByClass = {};
        classSubjects.forEach(cls => {
            allSubjectsByClass[cls.id] = cls.classSubjects || [];
        });

        // Normaliser les spécialités
        let specialties = [];
        if (teacher.specialties) {
            if (Array.isArray(teacher.specialties)) {
                specialties = teacher.specialties;
            } else if (typeof teacher.specialties === 'string') {
                try {
                    // Essayer de parser comme JSON
                    specialties = JSON.parse(teacher.specialties);
                } catch (e) {
                    // Sinon, traiter comme une chaîne séparée par des virgules
                    specialties = teacher.specialties.split(',').map(s => s.trim());
                }
            }
        }

        // Préparer la réponse formatée
        const formattedTeacher = {
            id: teacher.id,
            userId: teacher.userId,
            firstName: teacher.first_name,
            lastName: teacher.last_name,
            matricule: teacher.matricule,
            email: teacher.email || teacher.user?.email,
            phone: teacher.phone,
            specialties: specialties,
            createdBy: teacher.createdBy,
            createdAt: teacher.created_at,
            updatedAt: teacher.updated_at,
            user: {
                id: teacher.user?.id,
                email: teacher.user?.email,
                isActive: teacher.user?.is_active,
                createdAt: teacher.user?.created_at
            },
            assignedClasses: teacher.assignedClasses?.map(classItem => {
                const classSubjects = subjectsByClass[classItem.id] || [];
                const allClassSubjects = allSubjectsByClass[classItem.id] || [];
                
                return {
                    id: classItem.id,
                    name: classItem.name,
                    level: classItem.level,
                    subjectsTaught: classSubjects,
                    allSubjects: allClassSubjects,
                    studentCount: classItem.students?.length || 0,
                    principalTeacher: classItem.principalTeacher ? {
                        id: classItem.principalTeacher.id,
                        firstName: classItem.principalTeacher.first_name,
                        lastName: classItem.principalTeacher.last_name,
                        matricule: classItem.principalTeacher.matricule
                    } : null
                };
            }) || [],
            principalOfClasses: teacher.principalOfClasses?.map(cls => ({
                id: cls.id,
                name: cls.name,
                level: cls.level
            })) || [],
            teacherSubjects: Array.from(new Set(
                assignments
                    .filter(a => a.Subject)
                    .map(a => ({
                        id: a.Subject.id,
                        name: a.Subject.name,
                        code: a.Subject.code
                    }))
            ))
        };

        res.json({
            success: true,
            data: formattedTeacher
        });
    } catch (error) {
        console.error('Erreur récupération enseignant:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

// @desc    Obtenir tous les enseignants (version améliorée)
// @route   GET /api/admin/teachers
// @access  Privé (Admin)
const getAllTeachers = async (req, res) => {
    try {
        const teachers = await Teacher.findAll({
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'email', 'is_active']
                },
                {
                    model: Class,
                    as: 'assignedClasses',
                    through: { attributes: [] },
                    attributes: ['id']
                },
                {
                    model: Class,
                    as: 'principalOfClasses',
                    attributes: ['id']
                }
            ],
            order: [['last_name', 'ASC']]
        });

        // Normaliser les données pour le frontend
        const normalizedTeachers = teachers.map(teacher => {
            // Normaliser les spécialités
            let specialties = [];
            if (teacher.specialties) {
                if (Array.isArray(teacher.specialties)) {
                    specialties = teacher.specialties;
                } else if (typeof teacher.specialties === 'string') {
                    try {
                        specialties = JSON.parse(teacher.specialties);
                    } catch (e) {
                        specialties = teacher.specialties.split(',').map(s => s.trim());
                    }
                }
            }

            return {
                id: teacher.id,
                userId: teacher.userId,
                firstName: teacher.first_name,
                lastName: teacher.last_name,
                matricule: teacher.matricule,
                email: teacher.email || teacher.user?.email,
                phone: teacher.phone,
                specialties: specialties,
                user: {
                    id: teacher.user?.id,
                    email: teacher.user?.email,
                    isActive: teacher.user?.is_active
                },
                assignedClasses: teacher.assignedClasses || [],
                principalOfClasses: teacher.principalOfClasses || []
            };
        });

        res.json({
            success: true,
            count: teachers.length,
            data: normalizedTeachers
        });
    } catch (error) {
        console.error('Erreur récupération enseignants:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

// @desc    Mettre à jour un enseignant (version améliorée)
// @route   PUT /api/admin/teachers/:teacherId
// @access  Privé (Admin)
const updateTeacher = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const { teacherId } = req.params;
        const { 
            firstName, 
            lastName, 
            matricule, 
            email, 
            phone, 
            specialties,
            assignments // Format: [{ classId, subjectId }]
        } = req.body;

        const teacher = await Teacher.findByPk(teacherId, { transaction });
        
        if (!teacher) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Enseignant non trouvé'
            });
        }

        // Mettre à jour les champs de base
        if (firstName) teacher.first_name = firstName;
        if (lastName) teacher.last_name = lastName;
        if (matricule) teacher.matricule = matricule;
        if (email !== undefined) teacher.email = email;
        if (phone !== undefined) teacher.phone = phone;
        if (specialties !== undefined) {
            // S'assurer que les spécialités sont stockées comme un tableau
            teacher.specialties = Array.isArray(specialties) 
                ? specialties 
                : JSON.stringify(specialties);
        }

        await teacher.save({ transaction });

        // Mettre à jour l'email de l'utilisateur si nécessaire
        if (email && teacher.userId) {
            const user = await User.findByPk(teacher.userId, { transaction });
            if (user && user.email !== email) {
                user.email = email;
                await user.save({ transaction });
            }
        }

        // Gérer les affectations (classes et matières)
        if (assignments !== undefined) {
            // Supprimer les anciennes affectations
            await TeacherClassSubject.destroy({
                where: { teacherId },
                transaction
            });

            // Créer les nouvelles affectations
            if (Array.isArray(assignments) && assignments.length > 0) {
                for (const assignment of assignments) {
                    if (assignment.classId && assignment.subjectId) {
                        // Vérifier que la classe et la matière existent
                        const classExists = await Class.findByPk(assignment.classId, { transaction });
                        const subjectExists = await Subject.findByPk(assignment.subjectId, { transaction });
                        
                        if (classExists && subjectExists) {
                            await TeacherClassSubject.create({
                                teacherId: teacher.id,
                                classId: assignment.classId,
                                subjectId: assignment.subjectId
                            }, { transaction });
                        }
                    }
                }
            }

            // Vérifier si le professeur est principal d'une classe où il n'est plus affecté
            const principalClasses = await Class.findAll({
                where: { teacherPrincipalId: teacherId },
                transaction
            });

            for (const cls of principalClasses) {
                const stillAssigned = assignments.some(a => a.classId === cls.id);
                if (!stillAssigned) {
                    cls.teacherPrincipalId = null;
                    await cls.save({ transaction });
                }
            }
        }

        await transaction.commit();

        // Récupérer l'enseignant mis à jour avec les détails
        const updatedTeacher = await Teacher.findByPk(teacherId, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['email', 'is_active']
                },
                {
                    model: Class,
                    as: 'assignedClasses',
                    through: { attributes: [] }
                },
                {
                    model: Class,
                    as: 'principalOfClasses',
                    attributes: ['id', 'name', 'level']
                }
            ]
        });

        // Normaliser les spécialités pour la réponse
        let normalizedSpecialties = [];
        if (updatedTeacher.specialties) {
            if (Array.isArray(updatedTeacher.specialties)) {
                normalizedSpecialties = updatedTeacher.specialties;
            } else if (typeof updatedTeacher.specialties === 'string') {
                try {
                    normalizedSpecialties = JSON.parse(updatedTeacher.specialties);
                } catch (e) {
                    normalizedSpecialties = updatedTeacher.specialties.split(',').map(s => s.trim());
                }
            }
        }

        const responseData = {
            ...updatedTeacher.toJSON(),
            specialties: normalizedSpecialties,
            user: {
                ...updatedTeacher.user?.toJSON(),
                isActive: updatedTeacher.user?.is_active
            }
        };

        res.json({
            success: true,
            message: 'Enseignant mis à jour avec succès',
            data: responseData
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Erreur mise à jour enseignant:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

/*
const deleteTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier si l'enseignant existe
    const teacher = await Teacher.findByPk(id);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Enseignant non trouvé'
      });
    }

    // Si l'enseignant est associé à un utilisateur, vous voudrez peut-être
    // aussi gérer la suppression de l'utilisateur
    await teacher.destroy();

    res.json({
      success: true,
      message: 'Enseignant supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur deleteTeacher:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur',
      error: error.message 
    });
  }
};
*/

//========================================================
// STUDENTS ENDPOINTS
//========================================================

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

const getStudent = async (req, res) => {
    try {
        const { studentId } = req.params;

        const student = await Student.findByPk(studentId, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'email', 'isActive', 'created_at']
                },
                {
                    model: Class,
                    as: 'class',
                    attributes: ['id', 'name', 'level'],
                    include: [
                        {
                            model: Teacher,
                            as: 'principalTeacher',
                            attributes: ['id', 'firstName', 'lastName', 'matricule']
                        },
                        {
                            model: Subject,
                            as: 'classSubjects',
                            through: { attributes: ['coefficient'] }
                        }
                    ]
                }
            ]
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Étudiant non trouvé'
            });
        }

        res.json({
            success: true,
            data: student
        });
    } catch (error) {
        console.error('Erreur récupération étudiant:', error);
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
        if (classId && classId !== 'all' && classId !== 'undefined') {
            whereCondition.classId = classId;
        }

        const students = await Student.findAll({
            where: whereCondition,
            include: [
                {
                    model: User,
                    as: 'user',
                    // On utilise le format [colonne_db, alias_js] pour rester cohérent avec ton front
                    attributes: [
                        'id', 
                        'email', 
                        ['is_active', 'isActive'], 
                        ['created_at', 'createdAt']
                    ]
                },
                {
                    model: Class,
                    as: 'class',
                    attributes: ['id', 'name', 'level']
                }
            ],
            // ATTENTION : Si dans ta table "students", la colonne est "last_name", 
            // alors utilise 'last_name'. Si Sequelize la mappe en 'lastName', utilise 'lastName'.
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

const updateStudent = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const { studentId } = req.params;
        const { firstName, lastName, matricule, email, birthDate, classId, parentName, parentPhone } = req.body;

        const student = await Student.findByPk(studentId, { transaction });
        
        if (!student) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Étudiant non trouvé'
            });
        }

        // Vérifier si la nouvelle classe existe
        if (classId && classId !== student.classId) {
            const classExists = await Class.findByPk(classId, { transaction });
            if (!classExists) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Classe non trouvée'
                });
            }
        }

        // Mettre à jour les champs
        if (firstName) student.firstName = firstName;
        if (lastName) student.lastName = lastName;
        if (matricule) student.matricule = matricule;
        if (email !== undefined) student.email = email;
        if (birthDate !== undefined) student.birthDate = birthDate;
        if (classId) student.classId = classId;
        if (parentName !== undefined) student.parentName = parentName;
        if (parentPhone !== undefined) student.parentPhone = parentPhone;

        await student.save({ transaction });
        await transaction.commit();

        // Récupérer l'étudiant mis à jour avec les détails
        const updatedStudent = await Student.findByPk(studentId, {
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

        res.json({
            success: true,
            message: 'Étudiant mis à jour avec succès',
            data: updatedStudent
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Erreur mise à jour étudiant:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

//=======================================================
// CLASSES ENDPOINTS
//=======================================================

// @desc    Créer une classe
// @route   POST /api/admin/classes
// @access  Privé (Admin)
const createClass = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const { name, level, teacherPrincipalId, subjects, coefficients } = req.body;

        if (!name || !level) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Veuillez fournir le nom et le niveau de la classe'
            });
        }

        // Vérifier si le professeur principal existe (si fourni)
        if (teacherPrincipalId) {
            const teacher = await Teacher.findByPk(teacherPrincipalId, { transaction });
            if (!teacher) {
                await transaction.rollback();
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
        }, { transaction });

        // Assigner les matières avec leurs coefficients
        if (subjects && Array.isArray(subjects) && subjects.length > 0) {
            for (const subjectId of subjects) {
                const subject = await Subject.findByPk(subjectId, { transaction });
                if (subject) {
                    // Créer une entrée avec le coefficient
                    await TeacherClassSubject.create({
                        teacherId: null, // Pas d'enseignant assigné pour l'instant
                        classId: newClass.id,
                        subjectId: subjectId,
                        coefficient: coefficients?.[subjectId] || 1 // Utiliser le coefficient fourni ou 1 par défaut
                    }, { transaction });
                }
            }
        }

        await transaction.commit();

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
                    as: 'classSubjects',
                    through: { 
                        attributes: ['coefficient'] // Inclure le coefficient
                    }
                }
            ]
        });

        res.status(201).json({
            success: true,
            message: 'Classe créée avec succès',
            data: classWithDetails
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Erreur création classe:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la création de la classe'
        });
    }
};

// @desc    Obtenir une classe par ID
// @route   GET /api/admin/classes/:classId
// @access  Privé (Admin)
const getClass = async (req, res) => {
    try {
        const { classId } = req.params;

        const classItem = await Class.findByPk(classId, {
            include: [
                {
                    model: Teacher,
                    as: 'principalTeacher',
                    attributes: ['id', 'firstName', 'lastName', 'matricule']
                },
                {
                    model: Subject,
                    as: 'classSubjects',
                    through: { attributes: [] }
                },
                {
                    model: Student,
                    as: 'students',
                    attributes: ['id', 'firstName', 'lastName', 'matricule']
                },
                {
                    model: Teacher,
                    as: 'classTeachers',
                    through: { attributes: [] },
                    attributes: ['id', 'firstName', 'lastName', 'matricule']
                }
            ]
        });

        if (!classItem) {
            return res.status(404).json({
                success: false,
                message: 'Classe non trouvée'
            });
        }

        res.json({
            success: true,
            data: classItem
        });
    } catch (error) {
        console.error('Erreur récupération classe:', error);
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
                    as: 'classSubjects',
                    through: { 
                        attributes: ['coefficient'] // Inclure le coefficient
                    }
                },
                {
                    model: Student,
                    as: 'students',
                    attributes: ['id', 'firstName', 'lastName', 'matricule']
                },
                {
                    model: Teacher,
                    as: 'classTeachers',
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

// @desc    Mettre à jour une classe
// @route   PUT /api/admin/classes/:classId
// @access  Privé (Admin)
const updateClass = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const { classId } = req.params;
        const { name, level, teacherPrincipalId, subjects, coefficients } = req.body;

        const classItem = await Class.findByPk(classId, { transaction });
        
        if (!classItem) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Classe non trouvée'
            });
        }

        // Vérifier le professeur principal si fourni
        if (teacherPrincipalId) {
            const teacher = await Teacher.findByPk(teacherPrincipalId, { transaction });
            if (!teacher) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Enseignant principal non trouvé'
                });
            }
        }

        // Mettre à jour les champs
        if (name) classItem.name = name;
        if (level) classItem.level = level;
        if (teacherPrincipalId !== undefined) {
            classItem.teacherPrincipalId = teacherPrincipalId || null;
        }

        await classItem.save({ transaction });

        // Mettre à jour les matières avec leurs coefficients
        if (subjects && Array.isArray(subjects)) {
            // Supprimer les anciennes associations (sans teacherId)
            await TeacherClassSubject.destroy({
                where: {
                    classId: classId,
                    teacherId: null
                },
                transaction
            });

            // Ajouter les nouvelles associations avec coefficients
            for (const subjectId of subjects) {
                const subject = await Subject.findByPk(subjectId, { transaction });
                if (subject) {
                    await TeacherClassSubject.create({
                        teacherId: null,
                        classId: classId,
                        subjectId: subjectId,
                        coefficient: coefficients?.[subjectId] || 1
                    }, { transaction });
                }
            }
        }

        await transaction.commit();

        // Récupérer la classe mise à jour avec les détails
        const updatedClass = await Class.findByPk(classId, {
            include: [
                {
                    model: Teacher,
                    as: 'principalTeacher',
                    attributes: ['id', 'firstName', 'lastName', 'matricule']
                },
                {
                    model: Subject,
                    as: 'classSubjects',
                    through: { 
                        attributes: ['coefficient']
                    }
                },
                {
                    model: Student,
                    as: 'students',
                    attributes: ['id', 'firstName', 'lastName', 'matricule']
                }
            ]
        });

        res.json({
            success: true,
            message: 'Classe mise à jour avec succès',
            data: updatedClass
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Erreur mise à jour classe:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

// @desc    Supprimer une classe
// @route   DELETE /api/admin/classes/:classId
// @access  Privé (Admin)
const deleteClass = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const { classId } = req.params;

        const classItem = await Class.findByPk(classId, { transaction });
        
        if (!classItem) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Classe non trouvée'
            });
        }

        // Vérifier s'il y a des étudiants dans cette classe
        const studentsCount = await Student.count({
            where: { classId },
            transaction
        });

        if (studentsCount > 0) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: `Impossible de supprimer cette classe. Elle contient ${studentsCount} étudiant(s). Veuillez d'abord réassigner ou supprimer les étudiants.`
            });
        }

        // Supprimer les associations dans TeacherClassSubject
        await TeacherClassSubject.destroy({
            where: { classId },
            transaction
        });

        // Supprimer la classe
        await classItem.destroy({ transaction });

        await transaction.commit();

        res.json({
            success: true,
            message: 'Classe supprimée avec succès'
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Erreur suppression classe:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la suppression'
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

//========================================================
// SUBJECTS ENDPOINTS
//========================================================
// @desc    Créer une matière
// @route   POST /api/admin/subjects
// @access  Privé (Admin)
const createSubject = async (req, res) => {
    try {
        const { name, code, coefficient, description } = req.body;

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
            description: description || null,
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

// @desc    Obtenir toutes les matières
// @route   GET /api/admin/subjects
// @access  Privé (Admin)
const getAllSubjects = async (req, res) => {
    try {
        const subjects = await Subject.findAll({
            include: [
                {
                    model: Class,
                    as: 'subjectClasses',
                    through: { attributes: [] },
                    attributes: ['id', 'name', 'level']
                },
                {
                    model: Teacher,
                    as: 'subjectTeachers',
                    through: { attributes: [] },
                    attributes: ['id', 'firstName', 'lastName', 'matricule']
                }
            ],
            order: [['name', 'ASC']]
        });

        res.json({
            success: true,
            count: subjects.length,
            data: subjects
        });
    } catch (error) {
        console.error('Erreur récupération matières:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

// @desc    Obtenir une matière par ID
// @route   GET /api/admin/subjects/:subjectId
// @access  Privé (Admin)
const getSubject = async (req, res) => {
    try {
        const { subjectId } = req.params;

        const subject = await Subject.findByPk(subjectId, {
            include: [
                {
                    model: Class,
                    as: 'subjectClasses',
                    through: { attributes: [] },
                    attributes: ['id', 'name', 'level']
                },
                {
                    model: Teacher,
                    as: 'subjectTeachers',
                    through: { attributes: [] },
                    attributes: ['id', 'firstName', 'lastName', 'matricule']
                }
            ]
        });

        if (!subject) {
            return res.status(404).json({
                success: false,
                message: 'Matière non trouvée'
            });
        }

        res.json({
            success: true,
            data: subject
        });
    } catch (error) {
        console.error('Erreur récupération matière:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

// @desc    Mettre à jour une matière
// @route   PUT /api/admin/subjects/:subjectId
// @access  Privé (Admin)
const updateSubject = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const { subjectId } = req.params;
        const { name, code, coefficient, description } = req.body;

        const subject = await Subject.findByPk(subjectId, { transaction });
        
        if (!subject) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Matière non trouvée'
            });
        }

        // Vérifier si le code existe déjà (pour un autre sujet)
        if (code && code !== subject.code) {
            const existingSubject = await Subject.findOne({
                where: { 
                    code,
                    id: { [Op.ne]: subjectId }
                },
                transaction
            });

            if (existingSubject) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Une autre matière avec ce code existe déjà'
                });
            }
        }

        // Mettre à jour les champs
        if (name) subject.name = name;
        if (code) subject.code = code;
        if (coefficient !== undefined) subject.coefficient = coefficient;
        if (description !== undefined) subject.description = description;

        await subject.save({ transaction });
        await transaction.commit();

        // Récupérer la matière mise à jour avec les détails
        const updatedSubject = await Subject.findByPk(subjectId, {
            include: [
                {
                    model: Class,
                    as: 'subjectClasses',
                    through: { attributes: [] },
                    attributes: ['id', 'name', 'level']
                },
                {
                    model: Teacher,
                    as: 'subjectTeachers',
                    through: { attributes: [] },
                    attributes: ['id', 'firstName', 'lastName', 'matricule']
                }
            ]
        });

        res.json({
            success: true,
            message: 'Matière mise à jour avec succès',
            data: updatedSubject
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Erreur mise à jour matière:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

// @desc    Supprimer une matière
// @route   DELETE /api/admin/subjects/:subjectId
// @access  Privé (Admin)
const deleteSubject = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const { subjectId } = req.params;

        const subject = await Subject.findByPk(subjectId, { transaction });
        
        if (!subject) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Matière non trouvée'
            });
        }

        // Vérifier s'il y a des notes associées à cette matière
        const Grade = require('../models').Grade;
        const gradesCount = await Grade.count({
            where: { subjectId },
            transaction
        });

        if (gradesCount > 0) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: `Impossible de supprimer cette matière. Elle contient ${gradesCount} note(s). Veuillez d'abord supprimer les notes associées.`
            });
        }

        // Supprimer les associations dans TeacherClassSubject
        await TeacherClassSubject.destroy({
            where: { subjectId },
            transaction
        });

        // Supprimer la matière
        await subject.destroy({ transaction });

        await transaction.commit();

        res.json({
            success: true,
            message: 'Matière supprimée avec succès'
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Erreur suppression matière:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la suppression'
        });
    }
};

//=======================================================
//              MISCEALLENEOUS
//=======================================================
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
                as: 'assignedClasses',
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


// @desc    Mettre à jour le statut d'un utilisateur
// @route   PATCH /api/admin/users/:userId/status
// @access  Privé (Admin)
const toggleUserStatus = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const { userId } = req.params;
        const { isActive } = req.body;

        console.log('Toggle status - userId:', userId, 'isActive:', isActive);

        // Chercher directement l'utilisateur par son ID
        const user = await User.findByPk(userId, { transaction });

        if (!user) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        // Mettre à jour le statut
        user.isActive = isActive;
        await user.save({ transaction });

        // Si c'est un enseignant, on peut aussi mettre à jour le profil teacher si nécessaire
        if (user.role === 'teacher') {
            const teacher = await Teacher.findOne({ 
                where: { userId: user.id },
                transaction 
            });
            
            if (teacher) {
                // Vous pouvez ajouter des mises à jour spécifiques à l'enseignant ici
                console.log(`Statut mis à jour pour l'enseignant: ${teacher.id}`);
            }
        }

        await transaction.commit();

        console.log('Statut mis à jour avec succès');

        res.json({
            success: true,
            message: `Utilisateur ${isActive ? 'activé' : 'désactivé'} avec succès`,
            data: { 
                isActive: user.isActive,
                userId: user.id
            }
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Erreur toggle status:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};



module.exports = {
    createTeacher,
    getTeacher,
    getAllTeachers,
    updateTeacher,
    createStudent,
    getStudent,
    getAllStudents,
    updateStudent,
    createClass,
    getClass,
    getAllClasses,
    updateClass,
    deleteClass,
    assignClassPrincipal,
    createSubject,
    getAllSubjects,
    getSubject,
    updateSubject,
    deleteSubject,
    createPublication,
    getStats,
    updateUser,
    deleteUser,
    toggleUserStatus,
};