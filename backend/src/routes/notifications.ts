import express from 'express';
import { body, query } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticate, adminOnly } from '../middleware/auth';

const router = express.Router();

// Toutes les routes nécessitent une authentification admin
router.use(authenticate);
router.use(adminOnly);

// @route   POST /api/v1/notifications/sms/send
// @desc    Envoyer un SMS
// @access  Private (Admin)
router.post('/sms/send', [
  body('recipient').matches(/^(\+224|224)?[6-7][0-9]{7}$/),
  body('message').trim().isLength({ min: 1, max: 160 }),
  body('type').optional().isIn(['order_confirmation', 'order_status_update', 'payment_confirmation', 'delivery_update', 'supplier_response', 'admin_alert'])
], asyncHandler(async (req, res) => {
  const { recipient, message, type, orderId, supplierId } = req.body;

  try {
    // TODO: Intégrer l'API SMS (Twilio ou autre)
    // const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    // const result = await twilio.messages.create({
    //   body: message,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: recipient
    // });

    // Simulation pour l'instant
    const smsId = `SMS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // TODO: Sauvegarder en base de données
    const notification = {
      id: smsId,
      recipient,
      message,
      type: type || 'admin_alert',
      orderId,
      supplierId,
      status: 'sent',
      sentAt: new Date(),
      provider: 'twilio'
    };

    res.json({
      success: true,
      data: { notification },
      message: 'SMS envoyé avec succès'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: { message: 'Erreur lors de l\'envoi du SMS' }
    });
  }
}));

// @route   POST /api/v1/notifications/whatsapp/send
// @desc    Envoyer un message WhatsApp
// @access  Private (Admin)
router.post('/whatsapp/send', [
  body('recipient').matches(/^(\+224|224)?[6-7][0-9]{7}$/),
  body('message').trim().isLength({ min: 1 }),
  body('type').optional().isIn(['order_confirmation', 'order_status_update', 'payment_confirmation', 'delivery_update', 'supplier_response', 'admin_alert'])
], asyncHandler(async (req, res) => {
  const { recipient, message, type, orderId, supplierId } = req.body;

  try {
    // TODO: Intégrer l'API WhatsApp (Twilio WhatsApp ou WhatsApp Business API)
    // const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    // const result = await twilio.messages.create({
    //   body: message,
    //   from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
    //   to: `whatsapp:${recipient}`
    // });

    // Simulation pour l'instant
    const whatsappId = `WA_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const notification = {
      id: whatsappId,
      recipient,
      message,
      type: type || 'admin_alert',
      orderId,
      supplierId,
      status: 'sent',
      sentAt: new Date(),
      provider: 'twilio_whatsapp'
    };

    res.json({
      success: true,
      data: { notification },
      message: 'Message WhatsApp envoyé avec succès'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: { message: 'Erreur lors de l\'envoi du message WhatsApp' }
    });
  }
}));

// @route   POST /api/v1/notifications/order-confirmation
// @desc    Envoyer notification de confirmation de commande aux fournisseurs
// @access  Private (Admin)
router.post('/order-confirmation', [
  body('orderId').isMongoId()
], asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  try {
    // TODO: Récupérer la commande et envoyer les notifications aux fournisseurs
    // const order = await Order.findById(orderId).populate('suppliers.supplierId');
    
    // Simulation
    const notifications = [
      {
        id: `NOTIF_${Date.now()}_1`,
        type: 'order_confirmation',
        status: 'sent',
        message: 'Notifications envoyées aux fournisseurs'
      }
    ];

    res.json({
      success: true,
      data: { notifications },
      message: 'Notifications de commande envoyées'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: { message: 'Erreur lors de l\'envoi des notifications' }
    });
  }
}));

// @route   GET /api/v1/notifications/history
// @desc    Obtenir l'historique des notifications
// @access  Private (Admin)
router.get('/history', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('type').optional().isIn(['sms', 'whatsapp', 'email']),
  query('status').optional().isIn(['pending', 'sent', 'delivered', 'failed'])
], asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  // TODO: Récupérer depuis la base de données
  const notifications = [];
  const total = 0;

  res.json({
    success: true,
    data: {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// @route   GET /api/v1/notifications/templates
// @desc    Obtenir les templates de messages
// @access  Private (Admin)
router.get('/templates', asyncHandler(async (req, res) => {
  // Templates par défaut
  const templates = [
    {
      id: 'order_confirmation',
      name: 'Confirmation de commande',
      content: 'Nouvelle commande {{orderNumber}}. {{productName}} disponible ? Répondre 1 (oui) ou 0 (non)',
      variables: ['orderNumber', 'productName'],
      type: 'order_confirmation'
    },
    {
      id: 'order_status_update',
      name: 'Mise à jour statut',
      content: 'Commande {{orderNumber}} : {{status}}. Merci !',
      variables: ['orderNumber', 'status'],
      type: 'order_status_update'
    },
    {
      id: 'payment_confirmation',
      name: 'Confirmation paiement',
      content: 'Paiement reçu pour commande {{orderNumber}}. Montant: {{amount}} GNF',
      variables: ['orderNumber', 'amount'],
      type: 'payment_confirmation'
    }
  ];

  res.json({
    success: true,
    data: { templates }
  });
}));

// @route   POST /api/v1/notifications/supplier-response
// @desc    Traiter la réponse d'un fournisseur par SMS
// @access  Public (Webhook)
router.post('/supplier-response', [
  body('from').matches(/^(\+224|224)?[6-7][0-9]{7}$/),
  body('body').trim().isLength({ min: 1 })
], asyncHandler(async (req, res) => {
  const { from, body } = req.body;
  
  // Analyser la réponse (1 = confirmé, 0 = rejeté)
  const response = body.trim();
  
  if (response === '1' || response === '0') {
    // TODO: Trouver la commande correspondante et mettre à jour
    // const supplier = await Supplier.findOne({ phone: from });
    // const pendingOrder = await Order.findOne({
    //   'suppliers.supplierId': supplier._id,
    //   'suppliers.response': 'pending'
    // });
    
    const isConfirmed = response === '1';
    
    res.json({
      success: true,
      data: {
        response: isConfirmed ? 'confirmed' : 'rejected',
        message: 'Réponse traitée avec succès'
      }
    });
  } else {
    res.json({
      success: false,
      error: { message: 'Réponse invalide. Répondre 1 (oui) ou 0 (non)' }
    });
  }
}));

export default router;
