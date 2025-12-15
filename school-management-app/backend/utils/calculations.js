/**
 * Calculer la moyenne pondérée d'un tableau de notes
 * @param {Array} grades - Tableau d'objets grade avec score et coefficient
 * @returns {Number} Moyenne calculée
 */
const calculateWeightedAverage = (grades) => {
    if (!grades || grades.length === 0) return 0;

    let totalWeightedScore = 0;
    let totalCoefficient = 0;

    grades.forEach(grade => {
        const weightedScore = grade.score * grade.coefficient;
        totalWeightedScore += weightedScore;
        totalCoefficient += grade.coefficient;
    });

    return totalCoefficient > 0 ? totalWeightedScore / totalCoefficient : 0;
};

/**
 * Calculer la moyenne générale d'un étudiant
 * @param {Array} subjectAverages - Tableau d'objets avec moyenne et coefficient par matière
 * @returns {Number} Moyenne générale
 */
const calculateGeneralAverage = (subjectAverages) => {
    if (!subjectAverages || subjectAverages.length === 0) return 0;

    let totalWeightedAverage = 0;
    let totalCoefficient = 0;

    subjectAverages.forEach(subject => {
        totalWeightedAverage += subject.average * subject.coefficient;
        totalCoefficient += subject.coefficient;
    });

    return totalCoefficient > 0 ? totalWeightedAverage / totalCoefficient : 0;
};

/**
 * Déterminer le rang dans un tableau de moyennes
 * @param {Number} studentAverage - Moyenne de l'étudiant
 * @param {Array} allAverages - Tableau de toutes les moyennes de la classe
 * @returns {Number} Rang (1 pour le premier)
 */
const calculateRank = (studentAverage, allAverages) => {
    if (!allAverages || allAverages.length === 0) return 1;

    // Trier les moyennes par ordre décroissant
    const sortedAverages = [...allAverages].sort((a, b) => b - a);
    
    // Trouver l'index de la moyenne de l'étudiant
    const rank = sortedAverages.findIndex(avg => avg <= studentAverage);
    
    return rank !== -1 ? rank + 1 : sortedAverages.length + 1;
};

/**
 * Générer une appréciation basée sur la moyenne
 * @param {Number} average - Moyenne de l'étudiant
 * @returns {String} Appréciation
 */
const getAppreciation = (average) => {
    if (average >= 16) return 'Excellent';
    if (average >= 14) return 'Très Bien';
    if (average >= 12) return 'Bien';
    if (average >= 10) return 'Assez Bien';
    if (average >= 8) return 'Passable';
    if (average >= 6) return 'Insuffisant';
    return 'Très Insuffisant';
};

/**
 * Calculer le taux de réussite
 * @param {Number} passingCount - Nombre d'étudiants ayant réussi
 * @param {Number} totalCount - Nombre total d'étudiants
 * @returns {Number} Taux de réussite en pourcentage
 */
const calculateSuccessRate = (passingCount, totalCount) => {
    if (totalCount === 0) return 0;
    return (passingCount / totalCount) * 100;
};

/**
 * Formater une date pour l'affichage
 * @param {Date} date - Date à formater
 * @param {String} format - Format de sortie
 * @returns {String} Date formatée
 */
const formatDate = (date, format = 'fr-FR') => {
    const d = new Date(date);
    return d.toLocaleDateString(format, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

/**
 * Valider une note (doit être entre 0 et maxScore)
 * @param {Number} score - Note à valider
 * @param {Number} maxScore - Note maximale (défaut: 20)
 * @returns {Boolean} True si valide
 */
const validateGrade = (score, maxScore = 20) => {
    return score >= 0 && score <= maxScore;
};

/**
 * Calculer l'âge à partir de la date de naissance
 * @param {Date} birthDate - Date de naissance
 * @returns {Number} Âge en années
 */
const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
};

module.exports = {
    calculateWeightedAverage,
    calculateGeneralAverage,
    calculateRank,
    getAppreciation,
    calculateSuccessRate,
    formatDate,
    validateGrade,
    calculateAge
};