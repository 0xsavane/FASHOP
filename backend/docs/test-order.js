const axios = require('axios');

// Test d'une commande complète avec SMS
async function testCompleteOrder() {
  console.log('🛍️ Test Commande Complète FASHOP\n');
  
  const API_URL = 'http://localhost:5000';
  
  // Données de commande test
  const orderData = {
    customerEmail: 'client.test@fashop.gn',
    customerPhone: '+224610067380',
    deliveryAddress: {
      fullName: 'Mamadou Camara',
      phone: '+224610067380',
      address: '123 Avenue de la République',
      city: 'Conakry',
      commune: 'Kaloum',
      landmark: 'Près du marché central'
    },
    items: [
      {
        productId: '1',
        productName: 'Robe Africaine Élégante',
        quantity: 1,
        price: 120000,
        supplierName: 'Mamadou Diallo'
      }
    ],
    paymentMethod: 'orange_money',
    total: 120000
  };

  try {
    console.log('📤 Envoi de la commande...');
    const response = await axios.post(`${API_URL}/api/v1/test/orders`, orderData);
    
    if (response.data.success) {
      const order = response.data.data.order;
      console.log('✅ Commande créée avec succès !');
      console.log(`📋 Numéro: ${order.orderNumber}`);
      console.log(`💰 Total: ${order.total.toLocaleString()} GNF`);
      console.log(`📱 Client: ${order.customerPhone}`);
      console.log(`🏠 Adresse: ${order.deliveryAddress.address}, ${order.deliveryAddress.city}`);
      console.log(`📦 Produit: ${order.items[0].productName} (x${order.items[0].quantity})`);
      
      console.log('\n🔄 Workflow:');
      order.workflow.forEach((step, index) => {
        console.log(`   ${index + 1}. ${step}`);
      });
      
      console.log('\n📱 Le SMS a été envoyé automatiquement au fournisseur !');
      console.log('   Vérifiez les logs du serveur pour voir le contenu du SMS.');
      
    } else {
      console.error('❌ Erreur création commande:', response.data.error);
    }
    
  } catch (error) {
    console.error('❌ Erreur requête:', error.message);
  }
}

// Exécuter le test
if (require.main === module) {
  testCompleteOrder();
}

module.exports = { testCompleteOrder };
