const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Configuration CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'file://'],
  credentials: true
}));

app.use(express.json());

// Données de test
const suppliers = [
  { id: '1', name: 'Mamadou Diallo', phone: '+224610067380', address: 'Kaloum, Conakry', rating: 4.5, totalOrders: 25 },
  { id: '2', name: 'Aissatou Barry', phone: '+224622334455', address: 'Matam, Conakry', rating: 4.8, totalOrders: 18 },
  { id: '3', name: 'Alpha Condé Shop', phone: '+224655443322', address: 'Ratoma, Conakry', rating: 4.2, totalOrders: 32 }
];

const products = [
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
];

const orders = [
  { id: '1', orderNumber: 'ORD-001', customerEmail: 'client@example.com', total: 120000, status: 'pending' },
  { id: '2', orderNumber: 'ORD-002', customerEmail: 'autre@example.com', total: 220000, status: 'confirmed' }
];

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'FASHOP Backend API',
    status: 'OK',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// POST endpoints pour ajouter des données
app.post('/api/v1/suppliers', (req, res) => {
  const newSupplier = {
    id: String(suppliers.length + 1),
    ...req.body,
    rating: 0,
    totalOrders: 0
  };
  suppliers.push(newSupplier);
  res.json({
    success: true,
    data: { supplier: newSupplier },
    message: 'Fournisseur ajouté avec succès'
  });
});

app.post('/api/v1/products', (req, res) => {
  const newProduct = {
    id: String(products.length + 1),
    ...req.body,
    margin: req.body.publicPrice - req.body.supplierPrice,
    marginPercentage: ((req.body.publicPrice - req.body.supplierPrice) / req.body.supplierPrice * 100),
    status: 'active'
  };
  products.push(newProduct);
  res.json({
    success: true,
    data: { product: newProduct },
    message: 'Produit ajouté avec succès'
  });
});

app.post('/api/v1/orders', (req, res) => {
  const newOrder = {
    id: String(orders.length + 1),
    orderNumber: `ORD-${String(orders.length + 1).padStart(3, '0')}`,
    ...req.body,
    status: 'pending'
  };
  orders.push(newOrder);
  res.json({
    success: true,
    data: { order: newOrder },
    message: 'Commande ajoutée avec succès'
  });
});

app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'FASHOP Backend',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api/v1/test/suppliers', (req, res) => {
  res.json({
    success: true,
    data: { suppliers },
    message: 'Fournisseurs récupérés avec succès'
  });
});

app.get('/api/v1/test/products', (req, res) => {
  res.json({
    success: true,
    data: { products },
    message: 'Produits récupérés avec succès'
  });
});

app.get('/api/v1/test/products/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({
      success: false,
      error: { message: 'Produit non trouvé' }
    });
  }
  res.json({
    success: true,
    data: { product },
    message: 'Produit récupéré avec succès'
  });
});

app.get('/api/v1/test/orders', (req, res) => {
  res.json({
    success: true,
    data: { orders },
    message: 'Commandes récupérées avec succès'
  });
});

app.post('/api/v1/test/orders', async (req, res) => {
  const newOrder = {
    id: String(orders.length + 1),
    orderNumber: `FA-${Math.floor(100000 + Math.random() * 900000)}`,
    ...req.body,
    status: 'created',
    workflow: [
      'Commande reçue',
      'Notification fournisseur envoyée',
      'En attente confirmation fournisseur',
      'Livraison programmée'
    ]
  };
  orders.push(newOrder);

  // Déclencher notification SMS fournisseur
  try {
    const { SMSService } = require('./sms-service');
    const smsService = new SMSService();
    
    // Simuler envoi SMS au fournisseur
    const supplierPhone = '+224610067380'; // Numéro test
    await smsService.notifySupplierNewOrder(newOrder, supplierPhone);
    console.log(`📱 SMS envoyé au fournisseur pour commande ${newOrder.orderNumber}`);
  } catch (smsError) {
    console.error(`❌ Erreur SMS pour commande ${newOrder.orderNumber}:`, smsError.message);
  }

  res.json({
    success: true,
    data: { order: newOrder },
    message: 'Commande créée avec succès'
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

// Route 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: { message: `Route non trouvée: ${req.originalUrl}` }
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`✅ FASHOP Backend démarré sur http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/v1/health`);
  console.log(`📊 Endpoints disponibles:`);
  console.log(`   - GET /api/v1/test/suppliers`);
  console.log(`   - GET /api/v1/test/products`);
  console.log(`   - GET /api/v1/test/orders`);
});

// Gestion propre de l'arrêt
process.on('SIGTERM', () => {
  console.log('🛑 Arrêt du serveur...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Arrêt du serveur...');
  process.exit(0);
});
