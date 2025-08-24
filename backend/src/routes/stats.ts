import express from 'express';
import { query } from 'express-validator';
import { Order } from '../models/Order';
import { Product } from '../models/Product';
import { Supplier } from '../models/Supplier';
import { User } from '../models/User';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticate, adminOnly } from '../middleware/auth';

const router = express.Router();

// Toutes les routes nécessitent une authentification admin
router.use(authenticate);
router.use(adminOnly);

// @route   GET /api/v1/stats/dashboard
// @desc    Obtenir les statistiques du dashboard
// @access  Private (Admin)
router.get('/dashboard', asyncHandler(async (req, res) => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));

  // Statistiques générales
  const [
    totalOrders,
    totalProducts,
    totalSuppliers,
    totalCustomers,
    monthlyOrders,
    weeklyOrders,
    pendingOrders,
    totalRevenue,
    monthlyRevenue
  ] = await Promise.all([
    Order.countDocuments(),
    Product.countDocuments({ status: 'active' }),
    Supplier.countDocuments({ isActive: true }),
    User.countDocuments({ role: 'customer' }),
    Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
    Order.countDocuments({ createdAt: { $gte: startOfWeek } }),
    Order.countDocuments({ status: 'pending' }),
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalMargin' } } }
    ]),
    Order.aggregate([
      { 
        $match: { 
          paymentStatus: 'paid',
          createdAt: { $gte: startOfMonth }
        }
      },
      { $group: { _id: null, total: { $sum: '$totalMargin' } } }
    ])
  ]);

  // Produits les plus vendus
  const topProducts = await Order.aggregate([
    { $unwind: '$items' },
    { 
      $group: {
        _id: '$items.productId',
        productName: { $first: '$items.productName' },
        totalSold: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.totalPrice' }
      }
    },
    { $sort: { totalSold: -1 } },
    { $limit: 5 }
  ]);

  // Fournisseurs les plus performants
  const topSuppliers = await Supplier.find({ isActive: true })
    .sort({ rating: -1, totalOrders: -1 })
    .limit(5)
    .select('name rating totalOrders successfulOrders');

  // Évolution des commandes (7 derniers jours)
  const ordersTrend = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
        revenue: { $sum: '$totalMargin' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  res.json({
    success: true,
    data: {
      overview: {
        totalOrders,
        totalProducts,
        totalSuppliers,
        totalCustomers,
        monthlyOrders,
        weeklyOrders,
        pendingOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        monthlyRevenue: monthlyRevenue[0]?.total || 0
      },
      topProducts,
      topSuppliers,
      ordersTrend
    }
  });
}));

// @route   GET /api/v1/stats/sales
// @desc    Obtenir les statistiques de ventes
// @access  Private (Admin)
router.get('/sales', [
  query('period').optional().isIn(['week', 'month', 'quarter', 'year']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], asyncHandler(async (req, res) => {
  const period = req.query.period as string || 'month';
  let startDate: Date;
  let endDate = new Date();

  // Définir la période
  switch (period) {
    case 'week':
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'quarter':
      startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 3, 1);
      break;
    case 'year':
      startDate = new Date(endDate.getFullYear(), 0, 1);
      break;
    default: // month
      startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  }

  // Utiliser les dates personnalisées si fournies
  if (req.query.startDate) startDate = new Date(req.query.startDate as string);
  if (req.query.endDate) endDate = new Date(req.query.endDate as string);

  // Statistiques de ventes
  const salesStats = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        paymentStatus: 'paid'
      }
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$total' },
        totalMargin: { $sum: '$totalMargin' },
        averageOrderValue: { $avg: '$total' }
      }
    }
  ]);

  // Ventes par catégorie
  const salesByCategory = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        paymentStatus: 'paid'
      }
    },
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'products',
        localField: 'items.productId',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' },
    {
      $group: {
        _id: '$product.category',
        totalSales: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.totalPrice' }
      }
    },
    { $sort: { revenue: -1 } }
  ]);

  res.json({
    success: true,
    data: {
      period: { startDate, endDate, period },
      overview: salesStats[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        totalMargin: 0,
        averageOrderValue: 0
      },
      salesByCategory
    }
  });
}));

// @route   GET /api/v1/stats/products
// @desc    Obtenir les statistiques des produits
// @access  Private (Admin)
router.get('/products', asyncHandler(async (req, res) => {
  // Produits par statut
  const productsByStatus = await Product.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Produits en rupture de stock
  const lowStockProducts = await Product.find({
    $expr: { $lte: ['$stock', '$minStock'] },
    status: 'active'
  })
  .select('name sku stock minStock category')
  .limit(10);

  // Produits les plus vus
  const mostViewedProducts = await Product.find({ status: 'active' })
    .sort({ views: -1 })
    .limit(10)
    .select('name views orders rating');

  // Distribution des marges
  const marginDistribution = await Product.aggregate([
    { $match: { status: 'active' } },
    {
      $bucket: {
        groupBy: '$marginPercentage',
        boundaries: [0, 20, 40, 60, 80, 100, 200],
        default: 'Other',
        output: {
          count: { $sum: 1 },
          products: { $push: '$name' }
        }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      productsByStatus,
      lowStockProducts,
      mostViewedProducts,
      marginDistribution
    }
  });
}));

// @route   GET /api/v1/stats/suppliers
// @desc    Obtenir les statistiques des fournisseurs
// @access  Private (Admin)
router.get('/suppliers', asyncHandler(async (req, res) => {
  // Performance des fournisseurs
  const supplierPerformance = await Supplier.find({ isActive: true })
    .sort({ rating: -1 })
    .select('name rating totalOrders successfulOrders averageResponseTime');

  // Fournisseurs par zone de livraison
  const suppliersByZone = await Supplier.aggregate([
    { $match: { isActive: true } },
    { $unwind: '$deliveryZones' },
    {
      $group: {
        _id: '$deliveryZones',
        count: { $sum: 1 },
        suppliers: { $push: '$name' }
      }
    }
  ]);

  // Distribution des temps de réponse
  const responseTimeDistribution = await Supplier.aggregate([
    { 
      $match: { 
        isActive: true,
        averageResponseTime: { $exists: true, $ne: null }
      }
    },
    {
      $bucket: {
        groupBy: '$averageResponseTime',
        boundaries: [0, 30, 60, 120, 300, 1440], // en minutes
        default: 'Plus de 24h',
        output: {
          count: { $sum: 1 },
          averageTime: { $avg: '$averageResponseTime' }
        }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      supplierPerformance,
      suppliersByZone,
      responseTimeDistribution
    }
  });
}));

export default router;
