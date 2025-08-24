import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Charger les variables d'environnement
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configuration de sécurité
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json());

// Connexion MongoDB simple
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fashop');
    console.log('✅ MongoDB connecté');
  } catch (error) {
    console.log('⚠️ MongoDB non disponible, continuons sans DB pour les tests');
  }
}

// Routes de test
app.get('/', (req, res) => {
  res.json({
    message: 'FASHOP API Server - Version Simple',
    version: '1.0.0',
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'FASHOP Backend',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Routes basiques pour tester
app.get('/api/v1/test/suppliers', (req, res) => {
  res.json({
    success: true,
    data: {
      suppliers: [
        { id: '1', name: 'Mamadou Diallo', phone: '+224610067380', address: 'Kaloum, Conakry', rating: 4.5, totalOrders: 25, isActive: true },
        { id: '2', name: 'Aissatou Barry', phone: '+224622334455', address: 'Matam, Conakry', rating: 4.8, totalOrders: 18, isActive: true },
        { id: '3', name: 'Alpha Condé Shop', phone: '+224655443322', address: 'Ratoma, Conakry', rating: 4.2, totalOrders: 32, isActive: true }
      ]
    },
    message: 'Test endpoint fournisseurs'
  });
});

app.get('/api/v1/test/products', (req, res) => {
  res.json({
    success: true,
    data: {
      products: [
        { 
          id: '1', 
          name: 'Robe Africaine Élégante', 
          category: 'Vêtements',
          supplierName: 'Mamadou Diallo',
          supplierPrice: 80000, 
          publicPrice: 120000,
          margin: 40000,
          marginPercentage: 50,
          stock: 15,
          minStock: 5,
          status: 'active'
        },
        { 
          id: '2', 
          name: 'Chaussures Cuir Premium', 
          category: 'Chaussures',
          supplierName: 'Aissatou Barry',
          supplierPrice: 150000, 
          publicPrice: 220000,
          margin: 70000,
          marginPercentage: 46.7,
          stock: 8,
          minStock: 10,
          status: 'active'
        },
        { 
          id: '3', 
          name: 'Sac à Main Designer', 
          category: 'Accessoires',
          supplierName: 'Alpha Condé Shop',
          supplierPrice: 60000, 
          publicPrice: 95000,
          margin: 35000,
          marginPercentage: 58.3,
          stock: 22,
          minStock: 5,
          status: 'active'
        }
      ]
    },
    message: 'Test endpoint produits'
  });
});

app.get('/api/v1/test/orders', (req, res) => {
  res.json({
    success: true,
    data: {
      orders: [
        { id: '1', orderNumber: 'ORD-001', customerEmail: 'client@example.com', total: 120000, status: 'pending' },
        { id: '2', orderNumber: 'ORD-002', customerEmail: 'autre@example.com', total: 220000, status: 'confirmed' }
      ]
    },
    message: 'Test endpoint commandes'
  });
});

// Middleware de gestion d'erreurs simple
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Erreur:', err.message);
  res.status(500).json({
    success: false,
    error: { message: 'Erreur interne du serveur' }
  });
});

// Route 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: { message: `Route non trouvée: ${req.originalUrl}` }
  });
});

// Démarrage du serveur
async function startServer() {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`🚀 Serveur FASHOP (Simple) démarré sur le port ${PORT}`);
      console.log(`📍 API disponible sur: http://localhost:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/v1/health`);
      console.log(`🧪 Test fournisseurs: http://localhost:${PORT}/api/v1/test/suppliers`);
      console.log(`🧪 Test produits: http://localhost:${PORT}/api/v1/test/products`);
    });
  } catch (error) {
    console.error('❌ Erreur lors du démarrage:', error);
    process.exit(1);
  }
}

startServer();
