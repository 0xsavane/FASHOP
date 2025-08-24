const axios = require('axios');
require('dotenv').config();

// Configuration SMS (Twilio ou service local guinéen)
const SMS_CONFIG = {
  // Twilio (international)
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    fromNumber: process.env.TWILIO_PHONE_NUMBER
  },
  // Service SMS local guinéen (à configurer selon le fournisseur)
  local: {
    apiUrl: process.env.LOCAL_SMS_API_URL || 'https://api.sms-guinea.com/send',
    apiKey: process.env.LOCAL_SMS_API_KEY,
    sender: process.env.LOCAL_SMS_SENDER || 'FASHOP'
  }
};

// Templates de messages SMS
const SMS_TEMPLATES = {
  newOrder: (orderData) => `
🛍️ FASHOP - Nouvelle Commande!

Commande: ${orderData.orderNumber}
Client: ${orderData.customerPhone}
Produit(s): ${orderData.items.map(item => `${item.productName} (x${item.quantity})`).join(', ')}
Total: ${formatPrice(orderData.total)}

Adresse livraison:
${orderData.deliveryAddress.fullName}
${orderData.deliveryAddress.address}, ${orderData.deliveryAddress.city}
Tel: ${orderData.deliveryAddress.phone}

Confirmez disponibilité en répondant:
✅ OUI pour confirmer
❌ NON si indisponible

FASHOP - Votre partenaire dropshipping
  `.trim(),

  orderConfirmed: (orderData) => `
✅ FASHOP - Commande Confirmée

Commande ${orderData.orderNumber} confirmée par le fournisseur.
Livraison programmée sous 24-48h.

Merci de votre confiance!
FASHOP
  `.trim(),

  lowStock: (productData) => `
⚠️ FASHOP - Stock Faible

Produit: ${productData.name}
Stock actuel: ${productData.stock}
Stock minimum: ${productData.minStock}

Pensez à réapprovisionner.

FASHOP - Gestion Stock
  `.trim()
};

// Fonction utilitaire pour formater les prix
const formatPrice = (price) => {
  if (price >= 1000000) {
    return `${(price / 1000000).toFixed(1)}M GNF`;
  } else if (price >= 1000) {
    return `${(price / 1000).toFixed(0)}k GNF`;
  }
  return `${price} GNF`;
};

// Service SMS principal
class SMSService {
  constructor() {
    this.provider = process.env.SMS_PROVIDER || 'local'; // 'twilio' ou 'local'
  }

  async sendSMS(to, message) {
    try {
      console.log(`📱 Envoi SMS vers ${to}:`);
      console.log(`Message: ${message.substring(0, 100)}...`);

      if (this.provider === 'twilio') {
        return await this.sendViaTwilio(to, message);
      } else {
        return await this.sendViaLocal(to, message);
      }
    } catch (error) {
      console.error('❌ Erreur envoi SMS:', error.message);
      throw error;
    }
  }

  async sendViaTwilio(to, message) {
    const { accountSid, authToken, fromNumber } = SMS_CONFIG.twilio;
    
    if (!accountSid || !authToken || !fromNumber) {
      throw new Error('Configuration Twilio manquante');
    }

    const client = require('twilio')(accountSid, authToken);
    
    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to: to
    });

    console.log(`✅ SMS Twilio envoyé: ${result.sid}`);
    return { success: true, messageId: result.sid, provider: 'twilio' };
  }

  async sendViaLocal(to, message) {
    const { apiUrl, apiKey, sender } = SMS_CONFIG.local;
    
    if (!apiUrl || !apiKey) {
      // Mode simulation pour développement
      console.log(`🔄 MODE SIMULATION - SMS vers ${to}:`);
      console.log(`De: ${sender}`);
      console.log(`Message: ${message}`);
      console.log(`✅ SMS simulé envoyé avec succès`);
      
      return { 
        success: true, 
        messageId: `sim_${Date.now()}`, 
        provider: 'simulation',
        message: 'SMS envoyé en mode simulation'
      };
    }

    // Envoi réel via API locale
    const response = await axios.post(apiUrl, {
      to: to,
      message: message,
      sender: sender,
      api_key: apiKey
    });

    console.log(`✅ SMS local envoyé: ${response.data.message_id}`);
    return { 
      success: true, 
      messageId: response.data.message_id, 
      provider: 'local' 
    };
  }

  // Notification nouvelle commande au fournisseur
  async notifySupplierNewOrder(orderData, supplierPhone) {
    const message = SMS_TEMPLATES.newOrder(orderData);
    return await this.sendSMS(supplierPhone, message);
  }

  // Confirmation commande au client
  async notifyCustomerOrderConfirmed(orderData, customerPhone) {
    const message = SMS_TEMPLATES.orderConfirmed(orderData);
    return await this.sendSMS(customerPhone, message);
  }

  // Alerte stock faible
  async notifySupplierLowStock(productData, supplierPhone) {
    const message = SMS_TEMPLATES.lowStock(productData);
    return await this.sendSMS(supplierPhone, message);
  }

  // Test de connectivité SMS
  async testSMS(testPhone = '+224610067380') {
    const testMessage = `🧪 FASHOP - Test SMS\n\nCeci est un message de test.\nHeure: ${new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Conakry' })}\n\nSi vous recevez ce message, le système SMS fonctionne correctement.`;
    
    try {
      const result = await this.sendSMS(testPhone, testMessage);
      console.log('✅ Test SMS réussi:', result);
      return result;
    } catch (error) {
      console.error('❌ Test SMS échoué:', error.message);
      throw error;
    }
  }
}

// Fonction d'intégration avec les commandes
const handleNewOrder = async (orderData) => {
  const smsService = new SMSService();
  
  try {
    // Récupérer le téléphone du fournisseur pour chaque produit
    const notifications = [];
    
    for (const item of orderData.items) {
      if (item.supplierPhone) {
        const notification = await smsService.notifySupplierNewOrder(orderData, item.supplierPhone);
        notifications.push({
          supplier: item.supplierName,
          phone: item.supplierPhone,
          result: notification
        });
      }
    }
    
    console.log(`📱 ${notifications.length} notifications SMS envoyées pour commande ${orderData.orderNumber}`);
    return notifications;
    
  } catch (error) {
    console.error('❌ Erreur notifications SMS:', error.message);
    throw error;
  }
};

module.exports = {
  SMSService,
  handleNewOrder,
  SMS_TEMPLATES,
  formatPrice
};
