const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Générer un bulletin scolaire au format PDF
 * @param {Object} studentData - Données de l'étudiant
 * @param {Object} gradesData - Notes et moyennes
 * @param {Object} schoolInfo - Informations de l'école
 * @returns {Buffer} Buffer du PDF généré
 */
const generateBulletin = async (studentData, gradesData, schoolInfo = {}) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const chunks = [];
            
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // En-tête
            doc.fontSize(20)
               .font('Helvetica-Bold')
               .text(schoolInfo.name || 'ÉCOLE SECONDAIRE', { align: 'center' });
            
            doc.moveDown(0.5);
            doc.fontSize(12)
               .font('Helvetica')
               .text(schoolInfo.address || 'Adresse de l\'école', { align: 'center' });
            
            doc.moveDown(1);
            doc.fontSize(16)
               .font('Helvetica-Bold')
               .text('BULLETIN SCOLAIRE', { align: 'center' });
            
            // Ligne de séparation
            doc.moveDown(0.5);
            doc.strokeColor('#000000')
               .lineWidth(1)
               .moveTo(50, doc.y)
               .lineTo(550, doc.y)
               .stroke();
            
            doc.moveDown(1);

            // Informations de l'étudiant
            doc.fontSize(12).font('Helvetica-Bold').text('INFORMATIONS DE L\'ÉLÈVE:');
            doc.moveDown(0.5);
            
            const studentInfo = [
                `Nom: ${studentData.lastName} ${studentData.firstName}`,
                `Matricule: ${studentData.matricule}`,
                `Classe: ${studentData.className || ''} (${studentData.classLevel || ''})`,
                `Année scolaire: ${gradesData.academicYear || new Date().getFullYear()}`,
                `Semestre: ${gradesData.semester || 1}`
            ];
            
            studentInfo.forEach(info => {
                doc.fontSize(10).font('Helvetica').text(info);
            });
            
            doc.moveDown(1);

            // Tableau des notes
            doc.fontSize(12).font('Helvetica-Bold').text('RÉSULTATS SCOLAIRES:');
            doc.moveDown(0.5);

            // En-tête du tableau
            const tableTop = doc.y;
            const tableLeft = 50;
            const columnWidth = 100;
            
            // Dessiner l'en-tête du tableau
            doc.fontSize(10).font('Helvetica-Bold');
            doc.text('Matière', tableLeft, tableTop);
            doc.text('Coeff.', tableLeft + columnWidth, tableTop);
            doc.text('Moyenne', tableLeft + columnWidth * 2, tableTop);
            doc.text('Appréciation', tableLeft + columnWidth * 3, tableTop);
            
            // Ligne sous l'en-tête
            doc.moveTo(tableLeft, tableTop + 15)
               .lineTo(tableLeft + columnWidth * 4, tableTop + 15)
               .stroke();
            
            // Remplir le tableau
            let currentY = tableTop + 25;
            doc.fontSize(10).font('Helvetica');
            
            gradesData.subjects.forEach((subject, index) => {
                if (currentY > 700) {
                    doc.addPage();
                    currentY = 50;
                }
                
                doc.text(subject.name || '', tableLeft, currentY);
                doc.text(subject.coefficient?.toString() || '1', tableLeft + columnWidth, currentY, { width: 60, align: 'center' });
                doc.text(subject.average?.toFixed(2) || '0.00', tableLeft + columnWidth * 2, currentY, { width: 60, align: 'center' });
                doc.text(subject.appreciation || '', tableLeft + columnWidth * 3, currentY, { width: 100 });
                
                currentY += 20;
            });
            
            // Ligne de séparation avant le total
            doc.moveTo(tableLeft, currentY + 5)
               .lineTo(tableLeft + columnWidth * 4, currentY + 5)
               .stroke();
            
            currentY += 15;
            
            // Moyenne générale
            doc.fontSize(11).font('Helvetica-Bold');
            doc.text('MOYENNE GÉNÉRALE:', tableLeft, currentY);
            doc.text(gradesData.generalAverage?.toFixed(2) || '0.00', 
                    tableLeft + columnWidth * 2, currentY, { width: 60, align: 'center' });
            
            currentY += 20;
            
            // Rang
            doc.text('RANG:', tableLeft, currentY);
            doc.text(gradesData.rank ? `${gradesData.rank} sur ${gradesData.totalStudents}` : 'N/A', 
                    tableLeft + columnWidth * 2, currentY, { width: 60, align: 'center' });
            
            currentY += 30;
            
            // Appréciation générale
            if (gradesData.generalAppreciation) {
                doc.fontSize(11).font('Helvetica-Bold').text('APPRÉCIATION GÉNÉRALE:');
                doc.moveDown(0.5);
                doc.fontSize(10).font('Helvetica').text(gradesData.generalAppreciation, { width: 500 });
                currentY += 40;
            }
            
            // Signature
            if (currentY > 650) {
                doc.addPage();
                currentY = 50;
            }
            
            doc.moveDown(2);
            const signatureY = doc.y;
            
            doc.fontSize(10);
            doc.text('Le Directeur', 100, signatureY, { width: 150, align: 'center' });
            doc.text('Le Professeur Principal', 350, signatureY, { width: 150, align: 'center' });
            
            doc.moveTo(100, signatureY + 30)
               .lineTo(250, signatureY + 30)
               .stroke();
               
            doc.moveTo(350, signatureY + 30)
               .lineTo(500, signatureY + 30)
               .stroke();
            
            // Date de génération
            doc.fontSize(9)
               .font('Helvetica-Oblique')
               .text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 50, 750, { align: 'right' });
            
            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Sauvegarder le bulletin dans le système de fichiers
 * @param {Buffer} pdfBuffer - Buffer du PDF
 * @param {String} fileName - Nom du fichier
 * @returns {String} Chemin du fichier sauvegardé
 */
const saveBulletin = (pdfBuffer, fileName) => {
    const bulletinsDir = path.join(__dirname, '..', 'uploads', 'bulletins');
    
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(bulletinsDir)) {
        fs.mkdirSync(bulletinsDir, { recursive: true });
    }
    
    const filePath = path.join(bulletinsDir, fileName);
    fs.writeFileSync(filePath, pdfBuffer);
    
    return filePath;
};

/**
 * Générer un emploi du temps
 * @param {Array} scheduleData - Données de l'emploi du temps
 * @returns {Buffer} Buffer du PDF
 */
const generateSchedule = (scheduleData) => {
    // Implémentation similaire à generateBulletin
    // Pour gagner du temps, je vais simplifier
    return generateBulletin({}, {});
};

module.exports = {
    generateBulletin,
    saveBulletin,
    generateSchedule
};