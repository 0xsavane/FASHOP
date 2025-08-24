import express from 'express';
import { body } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticate, adminOnly } from '../middleware/auth';

const router = express.Router();

// @route   POST /api/v1/payments/orange-money/initiate
// @desc    Initier un paiement Orange Money
// @access  Public
router.post('/orange-money/initiate', [
  body('orderId').isMongoId(),
  body('phoneNumber').matches(/^(\+224|224)?[6-7][0-9]{7}$/),
  body('amount').isFloat({ min: 1 })
], asyncHandler(async (req, res) => {
  const { orderId, phoneNumber, amount } = req.body;

  // TODO: Intégrer l'API Orange Money
  // Pour l'instant, simulation de la réponse
  const transactionId = `OM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  res.json({
    success: true,
    data: {
      transactionId,
      status: 'pending',
      message: 'Paiement Orange Money initié. Composez *144# pour confirmer.'
    }
  });
}));

// @route   POST /api/v1/payments/orange-money/verify
// @desc    Vérifier le statut d'un paiement Orange Money
// @access  Public
router.post('/orange-money/verify', [
  body('transactionId').trim().isLength({ min: 1 })
], asyncHandler(async (req, res) => {
  const { transactionId } = req.body;

  // TODO: Vérifier le statut via l'API Orange Money
  // Pour l'instant, simulation
  const isSuccess = Math.random() > 0.3; // 70% de succès

  res.json({
    success: true,
    data: {
      transactionId,
      status: isSuccess ? 'completed' : 'failed',
      message: isSuccess ? 'Paiement réussi' : 'Paiement échoué'
    }
  });
}));

// @route   POST /api/v1/payments/stripe/create-intent
// @desc    Créer un PaymentIntent Stripe
// @access  Public
router.post('/stripe/create-intent', [
  body('orderId').isMongoId(),
  body('amount').isFloat({ min: 1 })
], asyncHandler(async (req, res) => {
  const { orderId, amount } = req.body;

  try {
    // TODO: Intégrer Stripe
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: Math.round(amount * 100), // Stripe utilise les centimes
    //   currency: 'gnf',
    //   metadata: { orderId }
    // });

    // Simulation pour l'instant
    const clientSecret = `pi_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`;

    res.json({
      success: true,
      data: {
        clientSecret,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: { message: 'Erreur lors de la création du paiement' }
    });
  }
}));

// @route   POST /api/v1/payments/webhook/stripe
// @desc    Webhook Stripe pour les événements de paiement
// @access  Public (avec vérification signature)
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  try {
    // TODO: Vérifier la signature Stripe
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    
    // Traiter l'événement
    // switch (event.type) {
    //   case 'payment_intent.succeeded':
    //     // Mettre à jour la commande
    //     break;
    //   case 'payment_intent.payment_failed':
    //     // Gérer l'échec
    //     break;
    // }

    res.json({ received: true });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: { message: 'Webhook invalide' }
    });
  }
}));

// @route   GET /api/v1/payments/transactions
// @desc    Obtenir l'historique des transactions
// @access  Private (Admin)
router.get('/transactions', authenticate, adminOnly, asyncHandler(async (req, res) => {
  // TODO: Implémenter la récupération des transactions
  res.json({
    success: true,
    data: {
      transactions: [],
      message: 'Fonctionnalité en cours de développement'
    }
  });
}));

export default router;
