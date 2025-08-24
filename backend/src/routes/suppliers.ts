import express from 'express';
import { body, query } from 'express-validator';
import { Supplier } from '../models/Supplier';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticate, adminOnly } from '../middleware/auth';
import { validateData, CreateSupplierSchema, UpdateSupplierSchema } from '../../../shared/src';

const router = express.Router();

// Toutes les routes nécessitent une authentification admin
router.use(authenticate);
router.use(adminOnly);

// @route   GET /api/v1/suppliers
// @desc    Obtenir la liste des fournisseurs
// @access  Private (Admin)
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim(),
  query('isActive').optional().isBoolean(),
  query('category').optional().trim(),
  query('city').optional().trim()
], asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  // Construire le filtre de recherche
  const filter: any = {};
  
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { phone: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } }
    ];
  }
  
  if (req.query.isActive !== undefined) {
    filter.isActive = req.query.isActive === 'true';
  }
  
  if (req.query.category) {
    filter.categories = { $in: [req.query.category] };
  }
  
  if (req.query.city) {
    filter.city = { $regex: req.query.city, $options: 'i' };
  }

  // Exécuter la requête avec pagination
  const [suppliers, total] = await Promise.all([
    Supplier.find(filter)
      .sort({ rating: -1, name: 1 })
      .skip(skip)
      .limit(limit),
    Supplier.countDocuments(filter)
  ]);

  res.json({
    success: true,
    data: {
      suppliers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// @route   GET /api/v1/suppliers/:id
// @desc    Obtenir un fournisseur par ID
// @access  Private (Admin)
router.get('/:id', asyncHandler(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);
  
  if (!supplier) {
    return res.status(404).json({
      success: false,
      error: { message: 'Fournisseur non trouvé' }
    });
  }

  res.json({
    success: true,
    data: { supplier }
  });
}));

// @route   POST /api/v1/suppliers
// @desc    Créer un nouveau fournisseur
// @access  Private (Admin)
router.post('/', [
  body('name').trim().isLength({ min: 1 }),
  body('phone').matches(/^(\+224|224)?[6-7][0-9]{7}$/),
  body('address').trim().isLength({ min: 1 }),
  body('email').optional().isEmail()
], asyncHandler(async (req, res) => {
  const supplierData = validateData(CreateSupplierSchema, req.body);

  // Vérifier si un fournisseur avec ce téléphone existe déjà
  const existingSupplier = await Supplier.findOne({ phone: supplierData.phone });
  if (existingSupplier) {
    return res.status(400).json({
      success: false,
      error: { message: 'Un fournisseur avec ce numéro de téléphone existe déjà' }
    });
  }

  const supplier = new Supplier(supplierData);
  await supplier.save();

  res.status(201).json({
    success: true,
    data: { supplier },
    message: 'Fournisseur créé avec succès'
  });
}));

// @route   PUT /api/v1/suppliers/:id
// @desc    Mettre à jour un fournisseur
// @access  Private (Admin)
router.put('/:id', [
  body('name').optional().trim().isLength({ min: 1 }),
  body('phone').optional().matches(/^(\+224|224)?[6-7][0-9]{7}$/),
  body('address').optional().trim().isLength({ min: 1 }),
  body('email').optional().isEmail()
], asyncHandler(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);
  
  if (!supplier) {
    return res.status(404).json({
      success: false,
      error: { message: 'Fournisseur non trouvé' }
    });
  }

  const updateData = validateData(UpdateSupplierSchema, req.body);

  // Vérifier l'unicité du téléphone si modifié
  if (updateData.phone && updateData.phone !== supplier.phone) {
    const existingSupplier = await Supplier.findOne({ phone: updateData.phone });
    if (existingSupplier) {
      return res.status(400).json({
        success: false,
        error: { message: 'Un fournisseur avec ce numéro de téléphone existe déjà' }
      });
    }
  }

  Object.assign(supplier, updateData);
  await supplier.save();

  res.json({
    success: true,
    data: { supplier },
    message: 'Fournisseur mis à jour avec succès'
  });
}));

// @route   DELETE /api/v1/suppliers/:id
// @desc    Supprimer un fournisseur
// @access  Private (Admin)
router.delete('/:id', asyncHandler(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);
  
  if (!supplier) {
    return res.status(404).json({
      success: false,
      error: { message: 'Fournisseur non trouvé' }
    });
  }

  // Désactiver plutôt que supprimer pour préserver l'historique
  supplier.isActive = false;
  await supplier.save();

  res.json({
    success: true,
    message: 'Fournisseur désactivé avec succès'
  });
}));

// @route   PUT /api/v1/suppliers/:id/activate
// @desc    Activer/désactiver un fournisseur
// @access  Private (Admin)
router.put('/:id/activate', [
  body('isActive').isBoolean()
], asyncHandler(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);
  
  if (!supplier) {
    return res.status(404).json({
      success: false,
      error: { message: 'Fournisseur non trouvé' }
    });
  }

  supplier.isActive = req.body.isActive;
  await supplier.save();

  res.json({
    success: true,
    data: { supplier },
    message: `Fournisseur ${supplier.isActive ? 'activé' : 'désactivé'} avec succès`
  });
}));

// @route   GET /api/v1/suppliers/:id/stats
// @desc    Obtenir les statistiques d'un fournisseur
// @access  Private (Admin)
router.get('/:id/stats', asyncHandler(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);
  
  if (!supplier) {
    return res.status(404).json({
      success: false,
      error: { message: 'Fournisseur non trouvé' }
    });
  }

  // Calculer les statistiques additionnelles
  const successRate = supplier.totalOrders > 0 
    ? Math.round((supplier.successfulOrders / supplier.totalOrders) * 100)
    : 0;

  const stats = {
    totalOrders: supplier.totalOrders,
    successfulOrders: supplier.successfulOrders,
    successRate,
    rating: supplier.rating,
    averageResponseTime: supplier.averageResponseTime,
    // Ajouter d'autres métriques si nécessaire
  };

  res.json({
    success: true,
    data: { stats }
  });
}));

export default router;
