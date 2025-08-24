const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configuration CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'file://'],
  credentials: true
}));

app.use(express.json());

// Connexion MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fashop', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB connecté: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Erreur MongoDB:', error.message);
    process.exit(1);
  }
};

// Modèles MongoDB
const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  rating: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  supplierName: { type: String, required: true },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  supplierPrice: { type: Number, required: true },
  publicPrice: { type: Number, required: true },
  margin: { type: Number },
  marginPercentage: { type: Number },
  stock: { type: Number, required: true },
  minStock: { type: Number, default: 5 },
  status: { type: String, enum: ['active', 'inactive', 'out_of_stock'], default: 'active' },
  description: String,
  images: [String],
  views: { type: Number, default: 0 },
  orders: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  customerEmail: { type: String, required: true },
  customerPhone: { type: String, required: true },
  deliveryAddress: {
    fullName: String,
    phone: String,
    address: String,
    city: String,
    commune: String,
    landmark: String
  },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: String,
    quantity: Number,
    price: Number,
    supplierName: String
  }],
  paymentMethod: { type: String, enum: ['orange_money', 'card'] },
  total: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'supplier_notified', 'in_delivery', 'delivered', 'cancelled'],
    default: 'pending'
  },
  workflow: [String],
  supplierNotified: { type: Boolean, default: false },
  supplierConfirmed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Middleware pour calculer marge automatiquement
productSchema.pre('save', function(next) {
  if (this.supplierPrice && this.publicPrice) {
    this.margin = this.publicPrice - this.supplierPrice;
    this.marginPercentage = ((this.margin / this.supplierPrice) * 100).toFixed(1);
  }
  next();
});

// Modèles
const Supplier = mongoose.model('Supplier', supplierSchema);
const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);

// Routes de base
app.get('/', (req, res) => {
  res.json({
    message: 'FASHOP Backend API avec MongoDB',
    status: 'OK',
    version: '2.0.0',
    database: 'MongoDB',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'FASHOP Backend MongoDB',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Routes Fournisseurs
app.get('/api/v1/suppliers', async (req, res) => {
  try {
    const suppliers = await Supplier.find({ isActive: true });
    res.json({
      success: true,
      data: { suppliers },
      message: 'Fournisseurs récupérés avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

app.post('/api/v1/suppliers', async (req, res) => {
  try {
    const supplier = new Supplier(req.body);
    await supplier.save();
    res.status(201).json({
      success: true,
      data: { supplier },
      message: 'Fournisseur créé avec succès'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: { message: error.message }
    });
  }
});

// Routes Produits
app.get('/api/v1/products', async (req, res) => {
  try {
    const { category, minPrice, maxPrice, inStock } = req.query;
    let filter = { status: 'active' };
    
    if (category) filter.category = category;
    if (minPrice) filter.publicPrice = { $gte: Number(minPrice) };
    if (maxPrice) filter.publicPrice = { ...filter.publicPrice, $lte: Number(maxPrice) };
    if (inStock === 'true') filter.stock = { $gt: 0 };

    const products = await Product.find(filter).populate('supplierId');
    res.json({
      success: true,
      data: { products },
      message: 'Produits récupérés avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

app.get('/api/v1/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('supplierId');
    if (!product) {
      return res.status(404).json({
        success: false,
        error: { message: 'Produit non trouvé' }
      });
    }
    
    // Incrémenter les vues
    product.views += 1;
    await product.save();
    
    res.json({
      success: true,
      data: { product },
      message: 'Produit récupéré avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

app.post('/api/v1/products', async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json({
      success: true,
      data: { product },
      message: 'Produit créé avec succès'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: { message: error.message }
    });
  }
});

// Routes Commandes
app.get('/api/v1/orders', async (req, res) => {
  try {
    const orders = await Order.find().populate('items.productId');
    res.json({
      success: true,
      data: { orders },
      message: 'Commandes récupérées avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

app.post('/api/v1/orders', async (req, res) => {
  try {
    const orderNumber = `FA-${Math.floor(100000 + Math.random() * 900000)}`;
    const orderData = {
      ...req.body,
      orderNumber,
      workflow: [
        'Commande reçue',
        'Notification fournisseur envoyée',
        'En attente confirmation fournisseur',
        'Livraison à programmer'
      ]
    };
    
    const order = new Order(orderData);
    await order.save();
    
    // Déclencher notification SMS fournisseur
    try {
      const { handleNewOrder } = require('./sms-service');
      const smsResults = await handleNewOrder(orderData);
      order.supplierNotified = true;
      await order.save();
      console.log(`📱 SMS envoyés pour commande ${orderNumber}:`, smsResults);
    } catch (smsError) {
      console.error(`❌ Erreur SMS pour commande ${orderNumber}:`, smsError.message);
    }
    
    res.status(201).json({
      success: true,
      data: { order },
      message: 'Commande créée avec succès'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: { message: error.message }
    });
  }
});

// Routes de compatibilité avec l'ancien système
app.get('/api/v1/test/suppliers', async (req, res) => {
  try {
    const suppliers = await Supplier.find({ isActive: true });
    res.json({
      success: true,
      data: { suppliers },
      message: 'Fournisseurs récupérés avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

app.get('/api/v1/test/products', async (req, res) => {
  try {
    const products = await Product.find({ status: 'active' });
    res.json({
      success: true,
      data: { products },
      message: 'Produits récupérés avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

app.get('/api/v1/test/orders', async (req, res) => {
  try {
    const orders = await Order.find();
    res.json({
      success: true,
      data: { orders },
      message: 'Commandes récupérées avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

// Fonction d'initialisation des données de test
const initializeTestData = async () => {
  try {
    const supplierCount = await Supplier.countDocuments();
    if (supplierCount === 0) {
      console.log('🌱 Initialisation des données de test...');
      
      const testSuppliers = [
        { name: 'Mamadou Diallo', phone: '+224610067380', address: 'Kaloum, Conakry', rating: 4.5, totalOrders: 25 },
        { name: 'Aissatou Barry', phone: '+224622334455', address: 'Matam, Conakry', rating: 4.8, totalOrders: 18 },
        { name: 'Alpha Condé Shop', phone: '+224655443322', address: 'Ratoma, Conakry', rating: 4.2, totalOrders: 32 }
      ];
      
      const suppliers = await Supplier.insertMany(testSuppliers);
      
      const testProducts = [
        { 
          name: 'Robe Africaine Élégante', 
          category: 'Vêtements',
          supplierName: 'Mamadou Diallo',
          supplierId: suppliers[0]._id,
          supplierPrice: 80000, 
          publicPrice: 120000,
          stock: 15,
          minStock: 5
        },
        { 
          name: 'Chaussures Cuir Premium', 
          category: 'Chaussures',
          supplierName: 'Aissatou Barry',
          supplierId: suppliers[1]._id,
          supplierPrice: 150000, 
          publicPrice: 220000,
          stock: 8,
          minStock: 10
        },
        { 
          name: 'Sac à Main Designer', 
          category: 'Accessoires',
          supplierName: 'Alpha Condé Shop',
          supplierId: suppliers[2]._id,
          supplierPrice: 60000, 
          publicPrice: 95000,
          stock: 22,
          minStock: 5
        }
      ];
      
      await Product.insertMany(testProducts);
      console.log('✅ Données de test initialisées');
    }
  } catch (error) {
    console.error('❌ Erreur initialisation:', error.message);
  }
};

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
const startServer = async () => {
  await connectDB();
  await initializeTestData();
  
  app.listen(PORT, () => {
    console.log(`✅ FASHOP Backend MongoDB démarré sur http://localhost:${PORT}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/api/v1/health`);
    console.log(`📊 Endpoints disponibles:`);
    console.log(`   - GET/POST /api/v1/suppliers`);
    console.log(`   - GET/POST /api/v1/products`);
    console.log(`   - GET/POST /api/v1/orders`);
    console.log(`   - Compatibilité: /api/v1/test/*`);
  });
};

// Gestion propre de l'arrêt
process.on('SIGTERM', async () => {
  console.log('🛑 Arrêt du serveur...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Arrêt du serveur...');
  await mongoose.connection.close();
  process.exit(0);
});

startServer().catch(console.error);
