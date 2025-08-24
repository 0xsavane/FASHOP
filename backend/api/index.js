const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://Fashop-admin:FashoP2003@fashop-db.cdgk8is.mongodb.net/fashop?retryWrites=true&w=majority&appName=FASHOP-DB')
  .then(() => console.log('MongoDB connecté'))
  .catch(err => console.error('Erreur MongoDB:', err));

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes de test
app.get('/', (req, res) => {
  res.json({
    message: 'FASHOP API Server - Fonctionnel!',
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
    environment: process.env.NODE_ENV || 'production',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Routes admin pour la gestion CRUD
try {
  const adminRoutes = require('../src/routes/admin');
  app.use('/api/v1/admin', adminRoutes);
} catch (error) {
  console.log('Routes admin non disponibles, utilisation des routes de test');
}

// Routes de test (compatibilité)
app.get('/api/v1/test/suppliers', (req, res) => {
  res.json({
    success: true,
    data: {
      suppliers: [
        {
          id: '1',
          name: 'Fournisseur Test',
          phone: '+224612345678',
          email: 'test@supplier.com',
          products: ['Chaussures', 'Sacs']
        }
      ]
    },
    message: 'Fournisseurs test'
  });
});

app.get('/api/v1/test/products', (req, res) => {
  res.json({
    success: true,
    data: {
      products: [
        {
          id: '1',
          name: 'Chaussures Nike Test',
          buyPrice: 80000,
          sellPrice: 120000,
          margin: 40000,
          supplier: 'Fournisseur Test',
          image: 'https://via.placeholder.com/300x300'
        }
      ]
    },
    message: 'Produits test'
  });
});

app.get('/api/v1/test/orders', (req, res) => {
  res.json({
    success: true,
    data: {
      orders: [
        {
          id: '1',
          orderNumber: 'FASH-001',
          customerEmail: 'client@example.com',
          customerPhone: '+224612345678',
          status: 'pending',
          paymentStatus: 'pending',
          total: 120000,
          totalMargin: 40000,
          createdAt: new Date().toISOString()
        }
      ]
    },
    message: 'Commandes test'
  });
});

// Simulation workflow FASHOP
app.post('/api/v1/test/order', (req, res) => {
  const orderNumber = `FASH-${Date.now().toString().slice(-6)}`;
  
  res.json({
    success: true,
    data: {
      order: {
        orderNumber,
        status: 'pending',
        message: 'Commande créée. Notification envoyée au fournisseur.',
        workflow: [
          '1. ✅ Commande reçue',
          '2. 📱 SMS simulé pour fournisseur',
          '3. ⏳ En attente de confirmation',
          '4. 🚚 Livraison (après confirmation)',
          '5. 💰 Marge FASHOP: 50%'
        ]
      }
    },
    message: 'Workflow FASHOP simulé'
  });
});

// Gestion d'erreurs
app.use((err, req, res, next) => {
  console.error('Erreur:', err.message);
  res.status(500).json({
    success: false,
    error: { message: 'Erreur interne du serveur' }
  });
});

// 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: { message: `Route non trouvée: ${req.originalUrl}` }
  });
});

module.exports = app;
