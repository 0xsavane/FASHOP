const { SMSService } = require('./sms-service');

// Script de test pour le système SMS
async function testSMSSystem() {
  console.log('🧪 Test du système SMS FASHOP\n');
  
  const smsService = new SMSService();
  
  try {
    // Test basique
    console.log('1. Test SMS basique...');
    const result = await smsService.testSMS('+224610067380');
    console.log('✅ Test réussi:', result);
    
    // Test notification commande
    console.log('\n2. Test notification nouvelle commande...');
    const mockOrder = {
      orderNumber: 'FA-123456',
      customerPhone: '+224610067380',
      items: [
        { productName: 'Robe Africaine', quantity: 1, supplierName: 'Mamadou Diallo' }
      ],
      total: 120000,
      deliveryAddress: {
        fullName: 'Test Client',
        address: 'Kaloum',
        city: 'Conakry',
        phone: '+224610067380'
      }
    };
    
    const orderResult = await smsService.notifySupplierNewOrder(mockOrder, '+224610067380');
    console.log('✅ Notification commande:', orderResult);
    
    console.log('\n🎉 Tous les tests SMS réussis!');
    
  } catch (error) {
    console.error('❌ Erreur test SMS:', error.message);
  }
}

// Exécuter les tests
if (require.main === module) {
  testSMSSystem();
}

module.exports = { testSMSSystem };
