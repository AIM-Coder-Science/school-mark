const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const { sequelize } = require('./models');

// Charger les variables d'environnement
dotenv.config();

// Importer les routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const studentRoutes = require('./routes/studentRoutes');

// Initialiser l'application Express
const app = express();

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);

// Route de test
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Route racine
app.get('/', (req, res) => {
    res.json({
        message: 'Bienvenue sur l\'API de gestion scolaire',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            admin: '/api/admin',
            teacher: '/api/teacher',
            student: '/api/student'
        }
    });
});

// Gestion des erreurs 404
app.use(/*'*',*/ (req, res) => {
    res.status(404).json({ 
        success: false,
        error: 'Route not found' 
    });
});

// Middleware de gestion d'erreurs
app.use((err, req, res, next) => {
    console.error(err.stack);
    
    const statusCode = err.status || 500;
    const message = err.message || 'Internal server error';
    
    res.status(statusCode).json({
        success: false,
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Port
const PORT = process.env.PORT || 5000;

// Synchroniser la base de données et démarrer le serveur
const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected successfully');
        
        // Synchroniser les modèles (en développement seulement)
        if (process.env.NODE_ENV === 'development') {
            await sequelize.sync({ alter: true });
            console.log('✅ Database synchronized');
        }
        
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
            console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
        });
    } catch (error) {
        console.error('❌ Unable to connect to database:', error);
        process.exit(1);
    }
};

// Gérer la fermeture proprement
process.on('SIGINT', async () => {
    console.log('👋 Shutting down server...');
    await sequelize.close();
    console.log('✅ Database connection closed');
    process.exit(0);
});

startServer();