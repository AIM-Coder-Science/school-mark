const { 
    Teacher, Student, Class, Subject, Grade, 
    Publication, Average, TeacherClassSubject, sequelize 
} = require('../models');
const { Op } = require('sequelize');

// @desc    Obtenir les classes assignées à l'enseignant
// @route   GET /api/teacher/classes
// @access  Privé (Teacher)
const getMyClasses = async (req, res) => {
    try {
        // Récupérer l'enseignant
        const teacher = await Teacher.findOne({
            where: { userId: req.user.id },
            include: [{
                model: Class,
                as: 'classes',
                through: { attributes: [] },
                include: [
                    {
                        model: Subject,
                        as: 'subjects',
                        through: { attributes: [] },
                        include: [{
                            model: Teacher,
                            as: 'teachers',
                            where: { id: { [Op.col]: 'Teacher.id' } },
                            through: { attributes: [] },
                            required: true
                        }]
                    },
                    {
                        model: Student,
                        as: 'students',
                        attributes: ['id', 'firstName', 'lastName', 'matricule']
                    }
                ]
            }]
        });

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: 'Enseignant non trouvé'
            });
        }

        // Formater la réponse
        const classesWithSubjects = teacher.classes.map(classItem => {
            // Filtrer uniquement les matières enseignées par cet enseignant dans cette classe
            const mySubjects = classItem.subjects.filter(subject => 
                subject.teachers.some(t => t.id === teacher.id)
            );

            return {
                id: classItem.id,
                name: classItem.name,
                level: classItem.level,
                subjects: mySubjects,
                studentsCount: classItem.students.length
            };
        });

        res.json({
            success: true,
            data: classesWithSubjects
        });
    } catch (error) {
        console.error('Erreur récupération classes:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

// @desc    Obtenir les étudiants d'une classe spécifique
// @route   GET /api/teacher/classes/:classId/students
// @access  Privé (Teacher)
const getClassStudents = async (req, res) => {
    try {
        const { classId } = req.params;
        const { subjectId } = req.query;

        // Vérifier si l'enseignant est assigné à cette classe
        const isAssigned = await TeacherClassSubject.findOne({
            where: {
                teacherId: req.user.teacherProfile.id,
                classId: classId,
                ...(subjectId && { subjectId: subjectId })
            }
        });

        if (!isAssigned) {
            return res.status(403).json({
                success: false,
                message: 'Non autorisé à accéder à cette classe'
            });
        }

        // Récupérer les étudiants de la classe
        const students = await Student.findAll({
            where: { classId: classId },
            include: [
                {
                    model: Class,
                    as: 'class',
                    attributes: ['name', 'level']
                },
                ...(subjectId ? [{
                    model: Grade,
                    as: 'grades',
                    where: { 
                        subjectId: subjectId,
                        teacherId: req.user.teacherProfile.id
                    },
                    required: false
                }] : [])
            ],
            order: [['lastName', 'ASC']]
        });

        res.json({
            success: true,
            count: students.length,
            data: students
        });
    } catch (error) {
        console.error('Erreur récupération étudiants:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

// @desc    Ajouter/modifier une note pour un étudiant
// @route   POST /api/teacher/grades
// @access  Privé (Teacher)
const addGrade = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const { 
            studentId, 
            classId, 
            subjectId, 
            examType, 
            score, 
            maxScore,
            coefficient,
            semester,
            academicYear 
        } = req.body;

        // Validation
        if (!studentId || !classId || !subjectId || !examType || !score || !academicYear) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Veuillez fournir tous les champs obligatoires'
            });
        }

        // Vérifier si l'enseignant est autorisé
        const isAuthorized = await TeacherClassSubject.findOne({
            where: {
                teacherId: req.user.teacherProfile.id,
                classId: classId,
                subjectId: subjectId
            },
            transaction
        });

        if (!isAuthorized) {
            await transaction.rollback();
            return res.status(403).json({
                success: false,
                message: 'Non autorisé à ajouter des notes pour cette matière/classe'
            });
        }

        // Vérifier si l'étudiant est dans la classe
        const student = await Student.findOne({
            where: {
                id: studentId,
                classId: classId
            },
            transaction
        });

        if (!student) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Étudiant non trouvé dans cette classe'
            });
        }

        // Vérifier si une note existe déjà pour cet examen
        const existingGrade = await Grade.findOne({
            where: {
                studentId,
                teacherId: req.user.teacherProfile.id,
                classId,
                subjectId,
                examType,
                semester: semester || 1,
                academicYear
            },
            transaction
        });

        let grade;
        if (existingGrade) {
            // Mettre à jour la note existante
            existingGrade.score = score;
            existingGrade.maxScore = maxScore || 20.00;
            existingGrade.coefficient = coefficient || 1.00;
            await existingGrade.save({ transaction });
            grade = existingGrade;
        } else {
            // Créer une nouvelle note
            grade = await Grade.create({
                studentId,
                teacherId: req.user.teacherProfile.id,
                classId,
                subjectId,
                examType,
                score,
                maxScore: maxScore || 20.00,
                coefficient: coefficient || 1.00,
                semester: semester || 1,
                academicYear
            }, { transaction });
        }

        // Mettre à jour le score de l'enseignant
        await updateTeacherScore(req.user.teacherProfile.id, classId, subjectId, transaction);

        await transaction.commit();

        res.status(201).json({
            success: true,
            message: existingGrade ? 'Note mise à jour' : 'Note ajoutée',
            data: grade
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Erreur ajout note:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

// Fonction pour mettre à jour le score de l'enseignant
const updateTeacherScore = async (teacherId, classId, subjectId, transaction) => {
    try {
        // Calculer le nombre d'étudiants ayant la moyenne dans cette matière/classe
        const result = await Grade.findAll({
            where: {
                teacherId: teacherId,
                classId: classId,
                subjectId: subjectId,
                academicYear: new Date().getFullYear()
            },
            attributes: [
                'studentId',
                [sequelize.fn('AVG', sequelize.col('score')), 'average']
            ],
            group: ['studentId'],
            having: sequelize.literal('AVG(score) >= 10'),
            transaction
        });

        const passingStudentsCount = result.length;

        // Mettre à jour le score de l'enseignant
        const teacher = await Teacher.findByPk(teacherId, { transaction });
        if (teacher) {
            teacher.score = passingStudentsCount;
            await teacher.save({ transaction });
        }
    } catch (error) {
        console.error('Erreur mise à jour score enseignant:', error);
    }
};

// @desc    Calculer la moyenne d'un étudiant pour une matière
// @route   GET /api/teacher/students/:studentId/subjects/:subjectId/average
// @access  Privé (Teacher)
const calculateStudentAverage = async (req, res) => {
    try {
        const { studentId, subjectId } = req.params;
        const { semester, academicYear } = req.query;

        // Vérifier les autorisations
        const grade = await Grade.findOne({
            where: {
                studentId,
                subjectId,
                teacherId: req.user.teacherProfile.id
            }
        });

        if (!grade) {
            return res.status(403).json({
                success: false,
                message: 'Non autorisé à accéder à ces notes'
            });
        }

        // Calculer la moyenne
        const grades = await Grade.findAll({
            where: {
                studentId,
                subjectId,
                teacherId: req.user.teacherProfile.id,
                semester: semester || { [Op.in]: [1, 2] },
                academicYear: academicYear || new Date().getFullYear()
            }
        });

        if (grades.length === 0) {
            return res.json({
                success: true,
                data: {
                    average: 0,
                    grades: [],
                    count: 0
                }
            });
        }

        // Calculer la moyenne pondérée
        let totalWeightedScore = 0;
        let totalCoefficient = 0;

        grades.forEach(grade => {
            const weightedScore = grade.score * grade.coefficient;
            totalWeightedScore += weightedScore;
            totalCoefficient += grade.coefficient;
        });

        const average = totalCoefficient > 0 ? totalWeightedScore / totalCoefficient : 0;

        // Vérifier ou créer l'enregistrement dans la table Average
        const averageRecord = await Average.findOne({
            where: {
                studentId,
                subjectId,
                semester: semester || 1,
                academicYear: academicYear || new Date().getFullYear()
            }
        });

        if (averageRecord) {
            averageRecord.average = parseFloat(average.toFixed(2));
            await averageRecord.save();
        } else {
            await Average.create({
                studentId,
                subjectId,
                classId: grade.classId,
                semester: semester || 1,
                academicYear: academicYear || new Date().getFullYear(),
                average: parseFloat(average.toFixed(2))
            });
        }

        res.json({
            success: true,
            data: {
                average: parseFloat(average.toFixed(2)),
                grades: grades,
                count: grades.length,
                coefficient: totalCoefficient
            }
        });
    } catch (error) {
        console.error('Erreur calcul moyenne:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

// @desc    Obtenir les notes d'une classe pour une matière
// @route   GET /api/teacher/classes/:classId/subjects/:subjectId/grades
// @access  Privé (Teacher)
const getClassGrades = async (req, res) => {
    try {
        const { classId, subjectId } = req.params;
        const { semester, academicYear } = req.query;

        // Vérifier l'autorisation
        const isAuthorized = await TeacherClassSubject.findOne({
            where: {
                teacherId: req.user.teacherProfile.id,
                classId: classId,
                subjectId: subjectId
            }
        });

        if (!isAuthorized) {
            return res.status(403).json({
                success: false,
                message: 'Non autorisé'
            });
        }

        // Récupérer tous les étudiants avec leurs notes
        const students = await Student.findAll({
            where: { classId: classId },
            include: [{
                model: Grade,
                as: 'grades',
                where: {
                    subjectId: subjectId,
                    teacherId: req.user.teacherProfile.id,
                    ...(semester && { semester: semester }),
                    academicYear: academicYear || new Date().getFullYear()
                },
                required: false
            }],
            order: [['lastName', 'ASC']]
        });

        // Calculer les moyennes pour chaque étudiant
        const studentsWithAverages = await Promise.all(students.map(async (student) => {
            const grades = student.grades || [];
            
            let average = 0;
            if (grades.length > 0) {
                const totalWeightedScore = grades.reduce((sum, grade) => 
                    sum + (grade.score * grade.coefficient), 0
                );
                const totalCoefficient = grades.reduce((sum, grade) => 
                    sum + grade.coefficient, 0
                );
                average = totalCoefficient > 0 ? totalWeightedScore / totalCoefficient : 0;
            }

            return {
                id: student.id,
                firstName: student.firstName,
                lastName: student.lastName,
                matricule: student.matricule,
                grades: grades,
                average: parseFloat(average.toFixed(2)),
                hasAverage: average >= 10
            };
        }));

        // Statistiques
        const passingStudents = studentsWithAverages.filter(s => s.hasAverage).length;
        const totalStudents = studentsWithAverages.length;
        const successRate = totalStudents > 0 ? (passingStudents / totalStudents * 100).toFixed(2) : 0;

        res.json({
            success: true,
            data: {
                students: studentsWithAverages,
                statistics: {
                    totalStudents,
                    passingStudents,
                    successRate: parseFloat(successRate),
                    failingStudents: totalStudents - passingStudents
                }
            }
        });
    } catch (error) {
        console.error('Erreur récupération notes classe:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

// @desc    Obtenir les classes où l'enseignant est principal
// @route   GET /api/teacher/principal-classes
// @access  Privé (Teacher)
const getPrincipalClasses = async (req, res) => {
    try {
        const classes = await Class.findAll({
            where: {
                teacherPrincipalId: req.user.teacherProfile.id
            },
            include: [
                {
                    model: Student,
                    as: 'students',
                    attributes: ['id', 'firstName', 'lastName', 'matricule']
                },
                {
                    model: Subject,
                    as: 'subjects',
                    through: { attributes: [] }
                }
            ]
        });

        res.json({
            success: true,
            data: classes
        });
    } catch (error) {
        console.error('Erreur récupération classes principales:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

// @desc    Calculer la moyenne générale d'un étudiant (pour prof principal)
// @route   GET /api/teacher/principal/students/:studentId/general-average
// @access  Privé (Teacher - Principal)
const calculateGeneralAverage = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const { studentId } = req.params;
        const { semester, academicYear } = req.query;

        // Vérifier si l'enseignant est principal de la classe de l'étudiant
        const student = await Student.findByPk(studentId, {
            include: [{
                model: Class,
                as: 'class',
                attributes: ['id', 'name', 'level', 'teacherPrincipalId']
            }],
            transaction
        });

        if (!student) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Étudiant non trouvé'
            });
        }

        // Vérifier si l'enseignant est principal de cette classe
        if (student.class.teacherPrincipalId !== req.user.teacherProfile.id) {
            await transaction.rollback();
            return res.status(403).json({
                success: false,
                message: 'Non autorisé. Vous n\'êtes pas le professeur principal de cette classe'
            });
        }

        // Récupérer toutes les matières de la classe
        const subjects = await Subject.findAll({
            include: [{
                model: Class,
                as: 'classes',
                where: { id: student.classId },
                through: { attributes: [] }
            }],
            transaction
        });

        // Récupérer les moyennes par matière
        const subjectAverages = [];
        let totalWeightedAverage = 0;
        let totalCoefficient = 0;

        for (const subject of subjects) {
            const averageRecord = await Average.findOne({
                where: {
                    studentId,
                    subjectId: subject.id,
                    semester: semester || 1,
                    academicYear: academicYear || new Date().getFullYear()
                },
                transaction
            });

            const average = averageRecord ? averageRecord.average : 0;
            const weightedAverage = average * subject.coefficient;

            subjectAverages.push({
                subjectId: subject.id,
                subjectName: subject.name,
                coefficient: subject.coefficient,
                average: parseFloat(average.toFixed(2)),
                weightedAverage: parseFloat(weightedAverage.toFixed(2))
            });

            totalWeightedAverage += weightedAverage;
            totalCoefficient += subject.coefficient;
        }

        // Calculer la moyenne générale
        const generalAverage = totalCoefficient > 0 ? 
            totalWeightedAverage / totalCoefficient : 0;

        // Calculer le rang dans la classe
        const allStudentsAverages = await Average.findAll({
            where: {
                classId: student.classId,
                semester: semester || 1,
                academicYear: academicYear || new Date().getFullYear(),
                subjectId: null // Moyennes générales seulement
            },
            order: [['general_average', 'DESC']],
            transaction
        });

        let rank = null;
        // Si l'étudiant a déjà une moyenne générale enregistrée
        const existingGeneralAverage = allStudentsAverages.find(avg => 
            avg.studentId === parseInt(studentId)
        );

        if (existingGeneralAverage) {
            rank = allStudentsAverages.findIndex(avg => 
                avg.studentId === parseInt(studentId)
            ) + 1;
        }

        // Mettre à jour ou créer l'enregistrement de moyenne générale
        if (existingGeneralAverage) {
            existingGeneralAverage.generalAverage = parseFloat(generalAverage.toFixed(2));
            existingGeneralAverage.rankInClass = rank;
            await existingGeneralAverage.save({ transaction });
        } else {
            await Average.create({
                studentId,
                classId: student.classId,
                semester: semester || 1,
                academicYear: academicYear || new Date().getFullYear(),
                generalAverage: parseFloat(generalAverage.toFixed(2)),
                rankInClass: rank
            }, { transaction });
        }

        // Mettre à jour le score du professeur principal
        await updatePrincipalTeacherScore(req.user.teacherProfile.id, student.classId, transaction);

        await transaction.commit();

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
                subjectAverages,
                generalAverage: parseFloat(generalAverage.toFixed(2)),
                totalCoefficient,
                rank,
                appreciation: getAppreciation(generalAverage)
            }
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Erreur calcul moyenne générale:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

// Fonction pour mettre à jour le score du professeur principal
const updatePrincipalTeacherScore = async (teacherId, classId, transaction) => {
    try {
        // Compter les étudiants ayant une moyenne générale >= 10
        const passingStudents = await Average.count({
            where: {
                classId: classId,
                generalAverage: { [Op.gte]: 10 },
                academicYear: new Date().getFullYear()
            },
            transaction
        });

        // Mettre à jour le score de l'enseignant
        const teacher = await Teacher.findByPk(teacherId, { transaction });
        if (teacher) {
            // Ajouter au score existant
            teacher.score = (teacher.score || 0) + passingStudents;
            await teacher.save({ transaction });
        }
    } catch (error) {
        console.error('Erreur mise à jour score prof principal:', error);
    }
};

// Fonction pour générer une appréciation basée sur la moyenne
const getAppreciation = (average) => {
    if (average >= 16) return 'Excellent';
    if (average >= 14) return 'Très Bien';
    if (average >= 12) return 'Bien';
    if (average >= 10) return 'Assez Bien';
    if (average >= 8) return 'Passable';
    if (average >= 6) return 'Insuffisant';
    return 'Très Insuffisant';
};

// @desc    Ajouter une appréciation à un bulletin
// @route   POST /api/teacher/principal/students/:studentId/appreciation
// @access  Privé (Teacher - Principal)
const addAppreciation = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { appreciation, semester, academicYear } = req.body;

        if (!appreciation) {
            return res.status(400).json({
                success: false,
                message: 'Veuillez fournir une appréciation'
            });
        }

        // Vérifier si l'enseignant est principal de la classe de l'étudiant
        const student = await Student.findByPk(studentId, {
            include: [{
                model: Class,
                as: 'class',
                attributes: ['id', 'teacherPrincipalId']
            }]
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Étudiant non trouvé'
            });
        }

        if (student.class.teacherPrincipalId !== req.user.teacherProfile.id) {
            return res.status(403).json({
                success: false,
                message: 'Non autorisé. Vous n\'êtes pas le professeur principal de cette classe'
            });
        }

        // Mettre à jour l'appréciation
        const averageRecord = await Average.findOne({
            where: {
                studentId,
                classId: student.classId,
                semester: semester || 1,
                academicYear: academicYear || new Date().getFullYear(),
                subjectId: null // Moyenne générale
            }
        });

        if (!averageRecord) {
            return res.status(404).json({
                success: false,
                message: 'Aucune moyenne générale trouvée pour cet étudiant'
            });
        }

        averageRecord.appreciation = appreciation;
        await averageRecord.save();

        res.json({
            success: true,
            message: 'Appréciation ajoutée avec succès',
            data: averageRecord
        });
    } catch (error) {
        console.error('Erreur ajout appréciation:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

// @desc    Obtenir les statistiques de l'enseignant
// @route   GET /api/teacher/stats
// @access  Privé (Teacher)
const getTeacherStats = async (req, res) => {
    try {
        const teacher = await Teacher.findOne({
            where: { userId: req.user.id },
            include: [
                {
                    model: Class,
                    as: 'classes',
                    through: { attributes: [] },
                    attributes: ['id', 'name', 'level']
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

        // Compter le nombre total d'étudiants
        let totalStudents = 0;
        for (const classItem of teacher.classes) {
            const studentCount = await Student.count({
                where: { classId: classItem.id }
            });
            totalStudents += studentCount;
        }

        // Nombre de classes où il est principal
        const principalClassesCount = teacher.principalOfClasses.length;

        // Dernières notes ajoutées
        const recentGrades = await Grade.findAll({
            where: { teacherId: teacher.id },
            limit: 10,
            order: [['created_at', 'DESC']],
            include: [
                {
                    model: Student,
                    as: "studentProfile",
                    attributes: ['firstName', 'lastName', 'matricule']
                },
                {
                    model: Subject,
                    as: 'subject',
                    attributes: ['name']
                }
            ]
        });

        res.json({
            success: true,
            data: {
                teacher: {
                    id: teacher.id,
                    firstName: teacher.firstName,
                    lastName: teacher.lastName,
                    matricule: teacher.matricule,
                    score: teacher.score
                },
                stats: {
                    totalClasses: teacher.classes.length,
                    totalStudents,
                    principalClassesCount,
                    recentGradesCount: recentGrades.length
                },
                recentGrades
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
    getMyClasses,
    getClassStudents,
    addGrade,
    calculateStudentAverage,
    getClassGrades,
    getPrincipalClasses,
    calculateGeneralAverage,
    addAppreciation,
    getTeacherStats
};