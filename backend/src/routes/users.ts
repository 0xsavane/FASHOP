import express from 'express';
import { query } from 'express-validator';
import { User } from '../models/User';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticate, adminOnly } from '../middleware/auth';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// @route   GET /api/v1/users
// @desc    Obtenir la liste des utilisateurs (Admin seulement)
// @access  Private (Admin)
router.get('/', adminOnly, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim(),
  query('role').optional().isIn(['admin', 'customer']),
  query('isActive').optional().isBoolean()
], asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  // Construire le filtre de recherche
  const filter: any = {};
  
  if (req.query.search) {
    filter.$or = [
      { firstName: { $regex: req.query.search, $options: 'i' } },
      { lastName: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
      { phone: { $regex: req.query.search, $options: 'i' } }
    ];
  }
  
  if (req.query.role) {
    filter.role = req.query.role;
  }
  
  if (req.query.isActive !== undefined) {
    filter.isActive = req.query.isActive === 'true';
  }

  // Exécuter la requête avec pagination
  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter)
  ]);

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// @route   GET /api/v1/users/:id
// @desc    Obtenir un utilisateur par ID
// @access  Private (Admin ou utilisateur lui-même)
router.get('/:id', asyncHandler(async (req: any, res) => {
  // Vérifier si l'utilisateur peut accéder à ces informations
  if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
    return res.status(403).json({
      success: false,
      error: { message: 'Accès refusé' }
    });
  }

  const user = await User.findById(req.params.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: { message: 'Utilisateur non trouvé' }
    });
  }

  res.json({
    success: true,
    data: { user }
  });
}));

// @route   PUT /api/v1/users/:id/activate
// @desc    Activer/désactiver un utilisateur
// @access  Private (Admin)
router.put('/:id/activate', adminOnly, asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: { message: 'Utilisateur non trouvé' }
    });
  }

  user.isActive = req.body.isActive;
  await user.save();

  res.json({
    success: true,
    data: { user },
    message: `Utilisateur ${user.isActive ? 'activé' : 'désactivé'} avec succès`
  });
}));

export default router;
