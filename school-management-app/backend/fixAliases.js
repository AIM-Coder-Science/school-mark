const fs = require('fs');
const path = require('path');

const fixFile = (filePath) => {
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Remplacements pour les alias
        const replacements = [
            // authController.js replacements
            { pattern: /as: ['"]teacher['"]/g, replacement: 'as: "teacherProfile"' },
            { pattern: /as: ['"]student['"]/g, replacement: 'as: "studentProfile"' },
            { pattern: /as: ['"]admin['"]/g, replacement: 'as: "adminProfile"' },
            { pattern: /\.teacher\b(?!Profile)/g, replacement: '.teacherProfile' },
            { pattern: /\.student\b(?!Profile)/g, replacement: '.studentProfile' },
            { pattern: /\.admin\b(?!Profile)/g, replacement: '.adminProfile' },
            // Include patterns
            { pattern: /include: \[[^]]*model: Teacher[^]]*as: ['"][^'"]+['"][^]]*\]/g, 
              replacement: 'include: [{ model: Teacher, as: "teacherProfile", required: false }]' },
            { pattern: /include: \[[^]]*model: Student[^]]*as: ['"][^'"]+['"][^]]*\]/g, 
              replacement: 'include: [{ model: Student, as: "studentProfile", required: false }]' },
            { pattern: /include: \[[^]]*model: Admin[^]]*as: ['"][^'"]+['"][^]]*\]/g, 
              replacement: 'include: [{ model: Admin, as: "adminProfile", required: false }]' }
        ];
        
        let changes = 0;
        replacements.forEach(({ pattern, replacement }) => {
            const newContent = content.replace(pattern, replacement);
            if (newContent !== content) {
                changes++;
                content = newContent;
            }
        });
        
        if (changes > 0) {
            fs.writeFileSync(filePath, content);
            console.log(`✅ ${path.basename(filePath)}: ${changes} corrections`);
        }
    }
};

// Fix all controller files
const controllersDir = path.join(__dirname, 'controllers');
const files = ['authController.js', 'adminController.js', 'teacherController.js', 'studentController.js'];

files.forEach(file => {
    fixFile(path.join(controllersDir, file));
});

console.log('✨ Alias fixes completed!');