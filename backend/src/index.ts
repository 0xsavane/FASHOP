import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

import { connectDatabase } from './config/database';
import { errorHandler, notFound } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import supplierRoutes from './routes/suppliers';
import productRoutes from './routes/products';
import orderRoutes from './routes/orders';
import paymentRoutes from './routes/payments';
import notificationRoutes from './routes/notifications';
import uploadRoutes from './routes/uploads';
import statsRoutes from './routes/stats';

// Charger les variables d'environnement
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const API_VERSION = process.env.API_VERSION || 'v1';

// Configuration de sécurité
app.use(helmet());
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:3000',
    process.env.ADMIN_URL || 'http://localhost:3001'
  ],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Trop de requêtes depuis cette IP, réessayez plus tard.',
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Middleware de base
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir les fichiers statiques
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes API
const apiRouter = express.Router();

// Health check
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Routes principales
apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/suppliers', supplierRoutes);
apiRouter.use('/products', productRoutes);
apiRouter.use('/orders', orderRoutes);
apiRouter.use('/payments', paymentRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/uploads', uploadRoutes);
apiRouter.use('/stats', statsRoutes);

// Monter les routes API
app.use(`/api/${API_VERSION}`, apiRouter);

// Route racine
app.get('/', (req, res) => {
  res.json({
    message: 'FASHOP API Server',
    version: '1.0.0',
    documentation: `/api/${API_VERSION}/health`
  });
});

// Middleware de gestion d'erreurs
app.use(notFound);
app.use(errorHandler);

// Fonction de démarrage du serveur
async function startServer() {
  try {
    // Connexion à la base de données
    await connectDatabase();
    console.log('✅ Base de données connectée');

    // Créer le dossier uploads s'il n'existe pas
    const fs = require('fs');
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('📁 Dossier uploads créé');
    }

    // Démarrer le serveur
    app.listen(PORT, () => {
      console.log(`🚀 Serveur FASHOP démarré sur le port ${PORT}`);
      console.log(`📍 API disponible sur: http://localhost:${PORT}/api/${API_VERSION}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/${API_VERSION}/health`);
      console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
    });

  } catch (error) {
    console.error('❌ Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
}

// Gestion des signaux de fermeture
process.on('SIGTERM', () => {
  console.log('🛑 Signal SIGTERM reçu, fermeture du serveur...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Signal SIGINT reçu, fermeture du serveur...');
  process.exit(0);
});

// Démarrer le serveur
startServer();

export default app;
