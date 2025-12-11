const express = require('express');
const cors = require('cors');
// const helmet = require('helmet');
// const morgan = require('morgan');

const { sequelize } = require('./models');

// Import des routes
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');
const teacherRoutes = require('./routes/teacher');
const adminRoutes = require('./routes/admin');
const newsRoutes = require('./routes/news');
const systemRoutes = require('./routes/system');
// const classRoutes = require('./routes/class');

// Configuration du serveur
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// app.use(helmet());
// app.use(morgan('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging personnalisé
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

app.use('/api/system', systemRoutes);

console.log('🔄 Routes /system ajoutées');

// Routes publiques
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date(),
    service: 'School Management API',
    version: '1.0.0'
  });
});



// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/news', newsRoutes);


app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: `Route API non trouvée: ${req.method} ${req.originalUrl}`
    });
  }
  next();
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error('🔥 Erreur serveur:', err.message);
  console.error('Stack:', err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Erreur interne du serveur';
  
  res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Synchronisation de la base de données et démarrage du serveur
const startServer = async () => {
  try {
    console.log('🔗 Connexion à la base de données...');
    
    // Test de connexion à la base de données
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données établie avec succès.');
    
    // Synchronisation des modèles (DEV uniquement)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Synchronisation des modèles...');
      await sequelize.sync({ alter: true });
      console.log('✅ Modèles synchronisés.');
    }
    
    // Démarrage du serveur
    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur le port ${PORT}`);
      console.log(`📊 Environnement: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔐 Auth: http://localhost:${PORT}/api/auth`);
      console.log(`👨‍🎓 Student: http://localhost:${PORT}/api/student/dashboard`);
      console.log(`👨‍🏫 Teacher: http://localhost:${PORT}/api/teacher/dashboard`);
      console.log(`👨‍💼 Admin: http://localhost:${PORT}/api/admin/dashboard`);
      console.log(`📰 News: http://localhost:${PORT}/api/news`);
    });
    
  } catch (error) {
    console.error('❌ Erreur lors du démarrage du serveur:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

// Gestion des signaux d'arrêt
process.on('SIGINT', async () => {
  console.log('\n🛑 Arrêt du serveur...');
  try {
    await sequelize.close();
    console.log('✅ Connexion à la base de données fermée.');
  } catch (error) {
    console.error('❌ Erreur lors de la fermeture de la base:', error.message);
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Arrêt du serveur (SIGTERM)...');
  try {
    await sequelize.close();
    console.log('✅ Connexion à la base de données fermée.');
  } catch (error) {
    console.error('❌ Erreur lors de la fermeture de la base:', error.message);
  }
  process.exit(0);
});

// Démarrage
startServer();

module.exports = app;