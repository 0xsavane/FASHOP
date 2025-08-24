import express from 'express';
import { body, query } from 'express-validator';
import { Order } from '../models/Order';
import { Product } from '../models/Product';
import { Supplier } from '../models/Supplier';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticate, adminOnly, optionalAuth } from '../middleware/auth';
import { validateData, generateOrderNumber, CreateOrderSchema, OrderFilterSchema } from '../../../shared/src';

const router = express.Router();

// @route   GET /api/v1/orders
// @desc    Obtenir la liste des commandes
// @access  Private
router.get('/', authenticate, asyncHandler(async (req: any, res) => {
  const filters = validateData(OrderFilterSchema, req.query);
  
  // Construire le filtre MongoDB
  const mongoFilter: any = {};
  
  // Les clients ne voient que leurs commandes
  if (req.user.role === 'customer') {
    mongoFilter.customerId = req.user.id;
  }
  
  if (filters.status && filters.status.length > 0) {
    mongoFilter.status = { $in: filters.status };
  }
  if (filters.paymentStatus && filters.paymentStatus.length > 0) {
    mongoFilter.paymentStatus = { $in: filters.paymentStatus };
  }
  if (filters.paymentMethod && filters.paymentMethod.length > 0) {
    mongoFilter.paymentMethod = { $in: filters.paymentMethod };
  }
  if (filters.supplierId) {
    mongoFilter['suppliers.supplierId'] = filters.supplierId;
  }
  if (filters.customerId && req.user.role === 'admin') {
    mongoFilter.customerId = filters.customerId;
  }
  if (filters.dateFrom || filters.dateTo) {
    mongoFilter.createdAt = {};
    if (filters.dateFrom) mongoFilter.createdAt.$gte = filters.dateFrom;
    if (filters.dateTo) mongoFilter.createdAt.$lte = filters.dateTo;
  }
  
  // Recherche textuelle
  if (filters.search) {
    mongoFilter.$or = [
      { orderNumber: { $regex: filters.search, $options: 'i' } },
      { customerEmail: { $regex: filters.search, $options: 'i' } },
      { customerPhone: { $regex: filters.search, $options: 'i' } }
    ];
  }
  
  // Pagination
  const skip = (filters.page - 1) * filters.limit;
  
  // Tri
  const sortOptions: any = {};
  if (filters.sortBy) {
    sortOptions[filters.sortBy] = filters.sortOrder === 'desc' ? -1 : 1;
  } else {
    sortOptions.createdAt = -1;
  }
  
  // Exécuter la requête
  const [orders, total] = await Promise.all([
    Order.find(mongoFilter)
      .populate('customerId', 'firstName lastName email')
      .populate('items.productId', 'name mainImage')
      .sort(sortOptions)
      .skip(skip)
      .limit(filters.limit),
    Order.countDocuments(mongoFilter)
  ]);

  res.json({
    success: true,
    data: {
      orders,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        pages: Math.ceil(total / filters.limit)
      }
    }
  });
}));

// @route   GET /api/v1/orders/:id
// @desc    Obtenir une commande par ID
// @access  Private
router.get('/:id', authenticate, asyncHandler(async (req: any, res) => {
  const order = await Order.findById(req.params.id)
    .populate('customerId', 'firstName lastName email phone')
    .populate('items.productId', 'name mainImage sku')
    .populate('suppliers.supplierId', 'name phone rating');
  
  if (!order) {
    return res.status(404).json({
      success: false,
      error: { message: 'Commande non trouvée' }
    });
  }

  // Vérifier l'accès
  if (req.user.role === 'customer' && order.customerId?.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      error: { message: 'Accès refusé' }
    });
  }

  res.json({
    success: true,
    data: { order }
  });
}));

// @route   POST /api/v1/orders
// @desc    Créer une nouvelle commande
// @access  Public/Private
router.post('/', optionalAuth, [
  body('items').isArray({ min: 1 }),
  body('customerEmail').isEmail(),
  body('customerPhone').matches(/^(\+224|224)?[6-7][0-9]{7}$/),
  body('deliveryAddress').isObject(),
  body('paymentMethod').isIn(['orange_money', 'card', 'cash'])
], asyncHandler(async (req: any, res) => {
  const orderData = validateData(CreateOrderSchema, req.body);

  // Générer le numéro de commande
  orderData.orderNumber = generateOrderNumber();

  // Ajouter l'ID client si connecté
  if (req.user) {
    orderData.customerId = req.user.id;
  }

  // Valider et enrichir les articles
  const enrichedItems = [];
  const supplierMap = new Map();

  for (const item of orderData.items) {
    const product = await Product.findById(item.productId);
    if (!product) {
      return res.status(400).json({
        success: false,
        error: { message: `Produit ${item.productId} non trouvé` }
      });
    }

    if (!product.isAvailable || product.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: { message: `Produit ${product.name} non disponible` }
      });
    }

    if (product.stock < item.quantity) {
      return res.status(400).json({
        success: false,
        error: { message: `Stock insuffisant pour ${product.name}` }
      });
    }

    // Enrichir l'article avec les données du produit
    const enrichedItem = {
      ...item,
      productName: product.name,
      productImage: product.mainImage,
      sku: product.sku,
      supplierPrice: product.supplierPrice,
      publicPrice: product.publicPrice,
      totalPrice: product.publicPrice * item.quantity,
      supplierId: product.supplierId,
      supplierName: product.supplierName
    };

    enrichedItems.push(enrichedItem);

    // Grouper par fournisseur
    const supplierId = product.supplierId.toString();
    if (!supplierMap.has(supplierId)) {
      const supplier = await Supplier.findById(supplierId);
      supplierMap.set(supplierId, {
        supplierId: supplierId,
        supplierName: supplier!.name,
        supplierPhone: supplier!.phone,
        items: [],
        notificationSent: false,
        response: 'pending'
      });
    }
    supplierMap.get(supplierId).items.push(item.productId);
  }

  // Calculer les totaux
  const subtotal = enrichedItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const deliveryFee = 15000; // À calculer selon la zone
  const total = subtotal + deliveryFee;

  // Créer la commande
  const order = new Order({
    ...orderData,
    items: enrichedItems,
    subtotal,
    deliveryFee,
    total,
    suppliers: Array.from(supplierMap.values())
  });

  await order.save();

  // Décrémenter le stock des produits
  for (const item of enrichedItems) {
    await Product.findByIdAndUpdate(
      item.productId,
      { $inc: { stock: -item.quantity } }
    );
  }

  res.status(201).json({
    success: true,
    data: { order },
    message: 'Commande créée avec succès'
  });
}));

// @route   PUT /api/v1/orders/:id/status
// @desc    Mettre à jour le statut d'une commande
// @access  Private (Admin)
router.put('/:id/status', authenticate, adminOnly, [
  body('status').isIn(['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled', 'refunded']),
  body('adminNotes').optional().trim()
], asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    return res.status(404).json({
      success: false,
      error: { message: 'Commande non trouvée' }
    });
  }

  await order.updateStatus(req.body.status, req.body.adminNotes);

  res.json({
    success: true,
    data: { order },
    message: 'Statut mis à jour avec succès'
  });
}));

// @route   PUT /api/v1/orders/:id/payment
// @desc    Confirmer le paiement d'une commande
// @access  Private (Admin)
router.put('/:id/payment', authenticate, adminOnly, [
  body('paymentReference').optional().trim()
], asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    return res.status(404).json({
      success: false,
      error: { message: 'Commande non trouvée' }
    });
  }

  await order.confirmPayment(req.body.paymentReference);

  res.json({
    success: true,
    data: { order },
    message: 'Paiement confirmé avec succès'
  });
}));

// @route   PUT /api/v1/orders/:id/supplier-response
// @desc    Traiter la réponse d'un fournisseur
// @access  Private (Admin)
router.put('/:id/supplier-response', authenticate, adminOnly, [
  body('supplierId').isMongoId(),
  body('response').isIn(['confirmed', 'rejected'])
], asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    return res.status(404).json({
      success: false,
      error: { message: 'Commande non trouvée' }
    });
  }

  await order.processSupplierResponse(req.body.supplierId, req.body.response);

  res.json({
    success: true,
    data: { order },
    message: 'Réponse fournisseur traitée avec succès'
  });
}));

export default router;
