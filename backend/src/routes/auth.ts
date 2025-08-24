import express from 'express';
import { body } from 'express-validator';
import { User } from '../models/User';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';
import { validateData, LoginSchema, CreateUserSchema } from '../../../shared/src';

const router = express.Router();

// Validation middleware
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').trim().isLength({ min: 1 }),
  body('lastName').trim().isLength({ min: 1 }),
  body('phone').optional().matches(/^(\+224|224)?[6-7][0-9]{7}$/)
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 1 })
];

// @route   POST /api/v1/auth/register
// @desc    Créer un nouveau compte utilisateur
// @access  Public
router.post('/register', registerValidation, asyncHandler(async (req, res) => {
  const userData = validateData(CreateUserSchema, req.body);

  // Vérifier si l'utilisateur existe déjà
  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      error: { message: 'Un compte avec cet email existe déjà' }
    });
  }

  // Créer l'utilisateur
  const user = new User(userData);
  await user.save();

  // Générer le token
  const token = user.generateAuthToken();

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive
      },
      token
    },
    message: 'Compte créé avec succès'
  });
}));

// @route   POST /api/v1/auth/login
// @desc    Connexion utilisateur
// @access  Public
router.post('/login', loginValidation, asyncHandler(async (req, res) => {
  const { email, password } = validateData(LoginSchema, req.body);

  // Trouver l'utilisateur avec le mot de passe
  const user = await User.findOne({ email }).select('+password');
  
  if (!user) {
    return res.status(401).json({
      success: false,
      error: { message: 'Email ou mot de passe incorrect' }
    });
  }

  // Vérifier le mot de passe
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      error: { message: 'Email ou mot de passe incorrect' }
    });
  }

  // Vérifier si le compte est actif
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      error: { message: 'Compte désactivé. Contactez l\'administrateur.' }
    });
  }

  // Générer le token
  const token = user.generateAuthToken();

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive
      },
      token
    },
    message: 'Connexion réussie'
  });
}));

// @route   GET /api/v1/auth/me
// @desc    Obtenir les informations de l'utilisateur connecté
// @access  Private
router.get('/me', authenticate, asyncHandler(async (req: any, res) => {
  res.json({
    success: true,
    data: {
      user: req.user
    }
  });
}));

// @route   PUT /api/v1/auth/profile
// @desc    Mettre à jour le profil utilisateur
// @access  Private
router.put('/profile', authenticate, [
  body('firstName').optional().trim().isLength({ min: 1 }),
  body('lastName').optional().trim().isLength({ min: 1 }),
  body('phone').optional().matches(/^(\+224|224)?[6-7][0-9]{7}$/)
], asyncHandler(async (req: any, res) => {
  const { firstName, lastName, phone } = req.body;
  
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      error: { message: 'Utilisateur non trouvé' }
    });
  }

  // Mettre à jour les champs modifiés
  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (phone) user.phone = phone;

  await user.save();

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive
      }
    },
    message: 'Profil mis à jour avec succès'
  });
}));

// @route   PUT /api/v1/auth/password
// @desc    Changer le mot de passe
// @access  Private
router.put('/password', authenticate, [
  body('currentPassword').isLength({ min: 1 }),
  body('newPassword').isLength({ min: 6 })
], asyncHandler(async (req: any, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select('+password');
  if (!user) {
    return res.status(404).json({
      success: false,
      error: { message: 'Utilisateur non trouvé' }
    });
  }

  // Vérifier le mot de passe actuel
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    return res.status(400).json({
      success: false,
      error: { message: 'Mot de passe actuel incorrect' }
    });
  }

  // Mettre à jour le mot de passe
  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Mot de passe mis à jour avec succès'
  });
}));

export default router;
