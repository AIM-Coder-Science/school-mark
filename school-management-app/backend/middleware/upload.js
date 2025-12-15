const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Créer les dossiers s'ils n'existent pas
const createUploadFolders = () => {
    const folders = ['profiles', 'bulletins', 'publications'];
    folders.forEach(folder => {
        const folderPath = path.join(__dirname, '..', 'uploads', folder);
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }
    });
};

createUploadFolders();

// Configuration du stockage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let folder = 'profiles';
        
        if (file.fieldname === 'bulletin') {
            folder = 'bulletins';
        } else if (file.fieldname === 'publication') {
            folder = 'publications';
        }
        
        cb(null, path.join(__dirname, '..', 'uploads', folder));
    },
    filename: function (req, file, cb) {
        // Générer un nom de fichier unique
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

// Filtrage des fichiers
const fileFilter = (req, file, cb) => {
    // Autoriser seulement certaines extensions
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Type de fichier non supporté. Seuls les images et documents PDF/DOC sont autorisés'));
    }
};

// Configuration de multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB par défaut
    },
    fileFilter: fileFilter
});

// Middleware pour gérer les erreurs d'upload
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'Fichier trop volumineux. Taille maximale: 5MB'
            });
        }
        return res.status(400).json({
            success: false,
            message: `Erreur d'upload: ${err.message}`
        });
    } else if (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
    next();
};

module.exports = {
    upload,
    handleUploadError
};