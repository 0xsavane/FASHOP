const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();

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
    environment: process.env.NODE_ENV || 'production'
  });
});

// Routes admin pour la gestion CRUD
const adminRoutes = require('../../src/routes/admin');
app.use('/api/v1/admin', adminRoutes);

// Routes de test (compatibilité)
app.get('/api/v1/test/suppliers', (req, res) => {
  res.redirect('/api/v1/admin/suppliers');
});

app.get('/api/v1/test/products', (req, res) => {
  res.redirect('/api/v1/admin/products');
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
          '2. 📱 SMS envoyé au fournisseur',
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

module.exports.handler = serverless(app);
