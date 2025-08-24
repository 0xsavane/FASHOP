import express from 'express';
import { body, query } from 'express-validator';
import { Product } from '../models/Product';
import { Supplier } from '../models/Supplier';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticate, adminOnly, optionalAuth } from '../middleware/auth';
import { validateData, CreateProductSchema, UpdateProductSchema, ProductFilterSchema } from '../../../shared/src';

const router = express.Router();

// @route   GET /api/v1/products
// @desc    Obtenir la liste des produits avec filtres
// @access  Public
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const filters = validateData(ProductFilterSchema, req.query);
  
  // Construire le filtre MongoDB
  const mongoFilter: any = {};
  
  // Filtres publics (pour les clients)
  if (!req.user || req.user.role !== 'admin') {
    mongoFilter.status = 'active';
    mongoFilter.isAvailable = true;
  }
  
  if (filters.category) mongoFilter.category = filters.category;
  if (filters.subcategory) mongoFilter.subcategory = filters.subcategory;
  if (filters.brand) mongoFilter.brand = filters.brand;
  if (filters.minPrice || filters.maxPrice) {
    mongoFilter.publicPrice = {};
    if (filters.minPrice) mongoFilter.publicPrice.$gte = filters.minPrice;
    if (filters.maxPrice) mongoFilter.publicPrice.$lte = filters.maxPrice;
  }
  if (filters.colors && filters.colors.length > 0) {
    mongoFilter.colors = { $in: filters.colors };
  }
  if (filters.sizes && filters.sizes.length > 0) {
    mongoFilter.sizes = { $in: filters.sizes };
  }
  if (filters.inStock) mongoFilter.stock = { $gt: 0 };
  if (filters.featured) mongoFilter.featured = true;
  if (filters.supplierId) mongoFilter.supplierId = filters.supplierId;
  
  // Recherche textuelle
  if (filters.search) {
    mongoFilter.$text = { $search: filters.search };
  }
  
  // Pagination
  const skip = (filters.page - 1) * filters.limit;
  
  // Tri
  const sortOptions: any = {};
  if (filters.sortBy) {
    sortOptions[filters.sortBy] = filters.sortOrder === 'desc' ? -1 : 1;
  } else {
    sortOptions.createdAt = -1; // Par défaut, tri par date de création
  }
  
  // Exécuter la requête
  const [products, total] = await Promise.all([
    Product.find(mongoFilter)
      .populate('supplierId', 'name phone')
      .sort(sortOptions)
      .skip(skip)
      .limit(filters.limit),
    Product.countDocuments(mongoFilter)
  ]);

  res.json({
    success: true,
    data: {
      products,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        pages: Math.ceil(total / filters.limit)
      },
      filters: req.query
    }
  });
}));

// @route   GET /api/v1/products/:id
// @desc    Obtenir un produit par ID
// @access  Public
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('supplierId', 'name phone rating');
  
  if (!product) {
    return res.status(404).json({
      success: false,
      error: { message: 'Produit non trouvé' }
    });
  }

  // Vérifier la visibilité pour les non-admins
  if (!req.user || req.user.role !== 'admin') {
    if (product.status !== 'active' || !product.isAvailable) {
      return res.status(404).json({
        success: false,
        error: { message: 'Produit non disponible' }
      });
    }
  }

  // Incrémenter les vues
  await (product as any).incrementViews();

  res.json({
    success: true,
    data: { product }
  });
}));

// @route   POST /api/v1/products
// @desc    Créer un nouveau produit
// @access  Private (Admin)
router.post('/', authenticate, adminOnly, [
  body('name').trim().isLength({ min: 1 }),
  body('description').trim().isLength({ min: 1 }),
  body('category').trim().isLength({ min: 1 }),
  body('sku').trim().isLength({ min: 3 }),
  body('supplierPrice').isFloat({ min: 0 }),
  body('publicPrice').isFloat({ min: 0 }),
  body('supplierId').isMongoId()
], asyncHandler(async (req, res) => {
  const productData = validateData(CreateProductSchema, req.body);

  // Vérifier que le fournisseur existe
  const supplier = await Supplier.findById(productData.supplierId);
  if (!supplier) {
    return res.status(400).json({
      success: false,
      error: { message: 'Fournisseur non trouvé' }
    });
  }

  // Vérifier l'unicité du SKU
  const existingProduct = await Product.findOne({ sku: productData.sku });
  if (existingProduct) {
    return res.status(400).json({
      success: false,
      error: { message: 'Un produit avec ce SKU existe déjà' }
    });
  }

  // Ajouter le nom du fournisseur
  productData.supplierName = supplier.name;

  const product = new Product(productData);
  await product.save();

  res.status(201).json({
    success: true,
    data: { product },
    message: 'Produit créé avec succès'
  });
}));

// @route   PUT /api/v1/products/:id
// @desc    Mettre à jour un produit
// @access  Private (Admin)
router.put('/:id', authenticate, adminOnly, asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    return res.status(404).json({
      success: false,
      error: { message: 'Produit non trouvé' }
    });
  }

  const updateData = validateData(UpdateProductSchema, req.body);

  // Vérifier l'unicité du SKU si modifié
  if (updateData.sku && updateData.sku !== product.sku) {
    const existingProduct = await Product.findOne({ sku: updateData.sku });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        error: { message: 'Un produit avec ce SKU existe déjà' }
      });
    }
  }

  // Vérifier le fournisseur si modifié
  if (updateData.supplierId) {
    const supplier = await Supplier.findById(updateData.supplierId);
    if (!supplier) {
      return res.status(400).json({
        success: false,
        error: { message: 'Fournisseur non trouvé' }
      });
    }
    updateData.supplierName = supplier.name;
  }

  Object.assign(product, updateData);
  await product.save();

  res.json({
    success: true,
    data: { product },
    message: 'Produit mis à jour avec succès'
  });
}));

// @route   DELETE /api/v1/products/:id
// @desc    Supprimer un produit
// @access  Private (Admin)
router.delete('/:id', authenticate, adminOnly, asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    return res.status(404).json({
      success: false,
      error: { message: 'Produit non trouvé' }
    });
  }

  // Désactiver plutôt que supprimer pour préserver l'historique
  product.status = 'inactive';
  product.isAvailable = false;
  await product.save();

  res.json({
    success: true,
    message: 'Produit désactivé avec succès'
  });
}));

// @route   PUT /api/v1/products/:id/stock
// @desc    Mettre à jour le stock d'un produit
// @access  Private (Admin)
router.put('/:id/stock', authenticate, adminOnly, [
  body('quantity').isInt(),
  body('operation').isIn(['set', 'add', 'subtract'])
], asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    return res.status(404).json({
      success: false,
      error: { message: 'Produit non trouvé' }
    });
  }

  const { quantity, operation } = req.body;

  switch (operation) {
    case 'set':
      product.stock = Math.max(0, quantity);
      break;
    case 'add':
      product.stock += quantity;
      break;
    case 'subtract':
      product.stock = Math.max(0, product.stock - quantity);
      break;
  }

  await product.save();

  res.json({
    success: true,
    data: { product },
    message: 'Stock mis à jour avec succès'
  });
}));

// @route   GET /api/v1/products/categories
// @desc    Obtenir la liste des catégories
// @access  Public
router.get('/meta/categories', asyncHandler(async (req, res) => {
  const categories = await Product.distinct('category', { status: 'active' });
  
  res.json({
    success: true,
    data: { categories }
  });
}));

// @route   GET /api/v1/products/brands
// @desc    Obtenir la liste des marques
// @access  Public
router.get('/meta/brands', asyncHandler(async (req, res) => {
  const brands = await Product.distinct('brand', { 
    status: 'active',
    brand: { $ne: null, $exists: true, $not: { $eq: '' } }
  });
  
  res.json({
    success: true,
    data: { brands }
  });
}));

export default router;
