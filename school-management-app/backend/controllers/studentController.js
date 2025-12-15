const { 
    Student, Class, Grade, Subject, Publication, 
    Average, History, sequelize 
} = require('../models');
const { Op } = require('sequelize');

// @desc    Obtenir le profil de l'étudiant
// @route   GET /api/student/profile
// @access  Privé (Student)
const getProfile = async (req, res) => {
    try {
        const student = await Student.findOne({
            where: { userId: req.user.id },
            include: [
                {
                    model: Class,
                    as: 'class',
                    include: [{
                        model: Student,
                        as: 'students',
                        attributes: ['id', 'firstName', 'lastName']
                    }]
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
        console.error('Erreur récupération profil:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

// @desc    Obtenir les notes de l'étudiant
// @route   GET /api/student/grades
// @access  Privé (Student)
const getMyGrades = async (req, res) => {
    try {
        const { semester, academicYear, subjectId } = req.query;
        
        // Récupérer l'étudiant
        const student = await Student.findOne({
            where: { userId: req.user.id }
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Étudiant non trouvé'
            });
        }

        // Conditions de recherche
        const whereCondition = {
            studentId: student.id,
            ...(semester && { semester: semester }),
            academicYear: academicYear || new Date().getFullYear(),
            ...(subjectId && { subjectId: subjectId })
        };

        // Récupérer les notes
        const grades = await Grade.findAll({
            where: whereCondition,
            include: [
                {
                    model: Subject,
                    as: 'subject',
                    attributes: ['id', 'name', 'coefficient']
                },
                {
                    model: Class,
                    as: 'class',
                    attributes: ['name', 'level']
                }
            ],
            order: [
                ['subjectId', 'ASC'],
                ['examType', 'ASC'],
                ['created_at', 'DESC']
            ]
        });

        // Grouper les notes par matière
        const gradesBySubject = {};
        grades.forEach(grade => {
            const subjectId = grade.subjectId;
            if (!gradesBySubject[subjectId]) {
                gradesBySubject[subjectId] = {
                    subject: grade.subject,
                    grades: [],
                    average: 0
                };
            }
            gradesBySubject[subjectId].grades.push(grade);
        });

        // Calculer la moyenne par matière
        Object.keys(gradesBySubject).forEach(subjectId => {
            const subjectData = gradesBySubject[subjectId];
            const gradesList = subjectData.grades;
            
            if (gradesList.length > 0) {
                const totalWeightedScore = gradesList.reduce((sum, grade) => 
                    sum + (grade.score * grade.coefficient), 0
                );
                const totalCoefficient = gradesList.reduce((sum, grade) => 
                    sum + grade.coefficient, 0
                );
                subjectData.average = totalCoefficient > 0 ? 
                    parseFloat((totalWeightedScore / totalCoefficient).toFixed(2)) : 0;
            }
        });

        // Récupérer les moyennes enregistrées
        const averages = await Average.findAll({
            where: {
                studentId: student.id,
                ...(semester && { semester: semester }),
                academicYear: academicYear || new Date().getFullYear()
            },
            include: [{
                model: Subject,
                as: 'subject',
                attributes: ['name', 'coefficient']
            }]
        });

        // Ajouter les moyennes générales par matière
        averages.forEach(avg => {
            if (avg.subjectId && gradesBySubject[avg.subjectId]) {
                gradesBySubject[avg.subjectId].recordedAverage = avg.average;
            }
        });

        // Récupérer la moyenne générale
        const generalAverage = await Average.findOne({
            where: {
                studentId: student.id,
                subjectId: null, // Moyenne générale
                ...(semester && { semester: semester }),
                academicYear: academicYear || new Date().getFullYear()
            }
        });

        res.json({
            success: true,
            data: {
                student: {
                    id: student.id,
                    firstName: student.firstName,
                    lastName: student.lastName,
                    matricule: student.matricule,
                    class: student.classId
                },
                gradesBySubject: Object.values(gradesBySubject),
                generalAverage: generalAverage ? {
                    average: generalAverage.generalAverage,
                    rank: generalAverage.rankInClass,
                    appreciation: generalAverage.appreciation
                } : null,
                statistics: {
                    totalSubjects: Object.keys(gradesBySubject).length,
                    totalGrades: grades.length,
                    passingSubjects: Object.values(gradesBySubject).filter(
                        subject => subject.average >= 10
                    ).length
                }
            }
        });
    } catch (error) {
        console.error('Erreur récupération notes:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

// @desc    Obtenir les bulletins de l'étudiant
// @route   GET /api/student/bulletins
// @access  Privé (Student)
const getMyBulletins = async (req, res) => {
    try {
        const student = await Student.findOne({
            where: { userId: req.user.id }
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Étudiant non trouvé'
            });
        }

        // Récupérer les bulletins (documents historiques)
        const bulletins = await History.findAll({
            where: {
                studentId: student.id,
                documentType: 'bulletin'
            },
            order: [['generated_at', 'DESC']]
        });

        // Récupérer les moyennes par semestre
        const averages = await Average.findAll({
            where: {
                studentId: student.id,
                subjectId: null // Moyennes générales seulement
            },
            order: [
                ['academic_year', 'DESC'],
                ['semester', 'DESC']
            ]
        });

        res.json({
            success: true,
            data: {
                bulletins,
                averages
            }
        });
    } catch (error) {
        console.error('Erreur récupération bulletins:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

// @desc    Obtenir les publications pour les étudiants
// @route   GET /api/student/publications
// @access  Privé (Student)
const getPublications = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const publications = await Publication.findAndCountAll({
            where: {
                isPublished: true,
                targetRoles: {
                    [Op.contains]: ['student']
                }
            },
            include: [{
                model: sequelize.models.User,
                as: 'author',
                attributes: ['id', 'email', 'role'],
                include: [
                    {
                        model: sequelize.models.Teacher,
                        as: "teacherProfile",
                        attributes: ['firstName', 'lastName'],
                        required: false
                    },
                    {
                        model: sequelize.models.Admin,
                        as: "adminProfile",
                        attributes: ['firstName', 'lastName'],
                        required: false
                    }
                ]
            }],
            order: [['created_at', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            data: {
                publications: publications.rows,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(publications.count / limit),
                    totalItems: publications.count,
                    itemsPerPage: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Erreur récupération publications:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

// @desc    Obtenir les matières de la classe de l'étudiant
// @route   GET /api/student/subjects
// @access  Privé (Student)
const getMySubjects = async (req, res) => {
    try {
        const student = await Student.findOne({
            where: { userId: req.user.id },
            include: [{
                model: Class,
                as: 'class',
                include: [{
                    model: Subject,
                    as: 'subjects',
                    through: { attributes: [] },
                    include: [{
                        model: sequelize.models.Teacher,
                        as: 'teachers',
                        through: { attributes: [] },
                        attributes: ['id', 'firstName', 'lastName', 'matricule']
                    }]
                }]
            }]
        });

        if (!student || !student.class) {
            return res.status(404).json({
                success: false,
                message: 'Étudiant ou classe non trouvé'
            });
        }

        res.json({
            success: true,
            data: {
                class: {
                    id: student.class.id,
                    name: student.class.name,
                    level: student.class.level
                },
                subjects: student.class.subjects
            }
        });
    } catch (error) {
        console.error('Erreur récupération matières:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

// @desc    Obtenir le classement de l'étudiant dans sa classe
// @route   GET /api/student/ranking
// @access  Privé (Student)
const getMyRanking = async (req, res) => {
    try {
        const { semester, academicYear } = req.query;
        
        const student = await Student.findOne({
            where: { userId: req.user.id }
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Étudiant non trouvé'
            });
        }

        // Récupérer toutes les moyennes générales de la classe
        const classAverages = await Average.findAll({
            where: {
                classId: student.classId,
                subjectId: null, // Moyennes générales
                semester: semester || 1,
                academicYear: academicYear || new Date().getFullYear()
            },
            include: [{
                model: Student,
                as: "studentProfile",
                attributes: ['id', 'firstName', 'lastName', 'matricule']
            }],
            order: [['general_average', 'DESC']]
        });

        // Trouver le rang de l'étudiant
        let myRank = null;
        let myAverage = null;
        let totalStudents = classAverages.length;

        classAverages.forEach((avg, index) => {
            if (avg.studentId === student.id) {
                myRank = index + 1;
                myAverage = avg.generalAverage;
            }
        });

        // Calculer les statistiques
        const topStudents = classAverages.slice(0, 5);
        const averageScore = classAverages.length > 0 ?
            classAverages.reduce((sum, avg) => sum + avg.generalAverage, 0) / classAverages.length : 0;

        res.json({
            success: true,
            data: {
                myRank,
                myAverage,
                totalStudents,
                classAverage: parseFloat(averageScore.toFixed(2)),
                topStudents,
                ranking: classAverages.map((avg, index) => ({
                    rank: index + 1,
                    student: avg.studentProfile,
                    average: avg.generalAverage,
                    isMe: avg.studentId === student.id
                }))
            }
        });
    } catch (error) {
        console.error('Erreur récupération classement:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

// @desc    Obtenir les statistiques de l'étudiant
// @route   GET /api/student/stats
// @access  Privé (Student)
const getStudentStats = async (req, res) => {
    try {
        const student = await Student.findOne({
            where: { userId: req.user.id },
            include: [{
                model: Class,
                as: 'class',
                attributes: ['id', 'name', 'level']
            }]
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Étudiant non trouvé'
            });
        }

        // Compter le nombre de notes
        const gradesCount = await Grade.count({
            where: { studentId: student.id }
        });

        // Compter le nombre de matières
        const subjectsCount = await Subject.count({
            include: [{
                model: Class,
                as: 'classes',
                where: { id: student.classId },
                through: { attributes: [] }
            }]
        });

        // Récupérer la dernière moyenne générale
        const latestAverage = await Average.findOne({
            where: {
                studentId: student.id,
                subjectId: null // Moyenne générale
            },
            order: [['calculated_at', 'DESC']]
        });

        // Dernières notes
        const recentGrades = await Grade.findAll({
            where: { studentId: student.id },
            limit: 5,
            order: [['created_at', 'DESC']],
            include: [{
                model: Subject,
                as: 'subject',
                attributes: ['name']
            }]
        });

        // Dernières publications
        const recentPublications = await Publication.findAll({
            where: {
                isPublished: true,
                targetRoles: {
                    [Op.contains]: ['student']
                }
            },
            limit: 3,
            order: [['created_at', 'DESC']],
            include: [{
                model: sequelize.models.User,
                as: 'author',
                attributes: ['id', 'role'],
                include: [
                    {
                        model: sequelize.models.Teacher,
                        as: "teacherProfile",
                        attributes: ['firstName', 'lastName'],
                        required: false
                    },
                    {
                        model: sequelize.models.Admin,
                        as: "adminProfile",
                        attributes: ['firstName', 'lastName'],
                        required: false
                    }
                ]
            }]
        });

        res.json({
            success: true,
            data: {
                student: {
                    id: student.id,
                    firstName: student.firstName,
                    lastName: student.lastName,
                    matricule: student.matricule,
                    class: student.class
                },
                stats: {
                    gradesCount,
                    subjectsCount,
                    latestAverage: latestAverage ? latestAverage.generalAverage : null,
                    latestRank: latestAverage ? latestAverage.rankInClass : null
                },
                recentActivities: {
                    grades: recentGrades,
                    publications: recentPublications
                }
            }
        });
    } catch (error) {
        console.error('Erreur récupération statistiques:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

module.exports = {
    getProfile,
    getMyGrades,
    getMyBulletins,
    getPublications,
    getMySubjects,
    getMyRanking,
    getStudentStats
};