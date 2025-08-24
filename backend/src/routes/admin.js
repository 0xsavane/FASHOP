const express = require('express');
const router = express.Router();

// Stockage temporaire en mémoire (remplacera MongoDB plus tard)
let suppliers = [
  {
    id: '1',
    name: 'Mamadou Diallo',
    phone: '+224623456789',
    address: 'Madina, Conakry',
    email: 'mamadou@example.com',
    isActive: true,
    rating: 4.5,
    totalOrders: 25,
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Aissatou Barry',
    phone: '+224654321987',
    address: 'Ratoma, Conakry',
    email: 'aissatou@example.com',
    isActive: true,
    rating: 4.8,
    totalOrders: 42,
    createdAt: new Date().toISOString()
  }
];

let products = [
  {
    id: '1',
    name: 'Robe Africaine Élégante',
    description: 'Belle robe traditionnelle africaine en tissu wax de qualité supérieure',
    category: 'Vêtements Femme',
    supplierPrice: 80000,
    publicPrice: 120000,
    margin: 40000,
    marginPercentage: 50,
    stock: 15,
    minStock: 5,
    status: 'active',
    supplierId: '1',
    supplierName: 'Mamadou Diallo',
    images: [],
    tags: ['robe', 'africaine', 'wax', 'femme'],
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Chaussures Homme Cuir',
    description: 'Chaussures élégantes en cuir véritable, parfaites pour les occasions spéciales',
    category: 'Chaussures',
    supplierPrice: 150000,
    publicPrice: 200000,
    margin: 50000,
    marginPercentage: 33.3,
    stock: 8,
    minStock: 3,
    status: 'active',
    supplierId: '2',
    supplierName: 'Aissatou Barry',
    images: [],
    tags: ['chaussures', 'cuir', 'homme', 'élégant'],
    createdAt: new Date().toISOString()
  }
];

// Utilitaires
const generateId = () => Date.now().toString();

// ROUTES FOURNISSEURS

// Obtenir tous les fournisseurs
router.get('/suppliers', (req, res) => {
  res.json({
    success: true,
    data: { suppliers }
  });
});

// Obtenir un fournisseur par ID
router.get('/suppliers/:id', (req, res) => {
  const supplier = suppliers.find(s => s.id === req.params.id);
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
});

// Créer un nouveau fournisseur
router.post('/suppliers', (req, res) => {
  const { name, phone, address, email } = req.body;
  
  if (!name || !phone || !address) {
    return res.status(400).json({
      success: false,
      error: { message: 'Nom, téléphone et adresse sont requis' }
    });
  }
  
  const newSupplier = {
    id: generateId(),
    name,
    phone,
    address,
    email: email || '',
    isActive: true,
    rating: 0,
    totalOrders: 0,
    createdAt: new Date().toISOString()
  };
  
  suppliers.push(newSupplier);
  
  res.status(201).json({
    success: true,
    data: { supplier: newSupplier },
    message: 'Fournisseur créé avec succès'
  });
});

// Mettre à jour un fournisseur
router.put('/suppliers/:id', (req, res) => {
  const supplierIndex = suppliers.findIndex(s => s.id === req.params.id);
  if (supplierIndex === -1) {
    return res.status(404).json({
      success: false,
      error: { message: 'Fournisseur non trouvé' }
    });
  }
  
  const { name, phone, address, email, isActive } = req.body;
  
  suppliers[supplierIndex] = {
    ...suppliers[supplierIndex],
    name: name || suppliers[supplierIndex].name,
    phone: phone || suppliers[supplierIndex].phone,
    address: address || suppliers[supplierIndex].address,
    email: email !== undefined ? email : suppliers[supplierIndex].email,
    isActive: isActive !== undefined ? isActive : suppliers[supplierIndex].isActive,
    updatedAt: new Date().toISOString()
  };
  
  res.json({
    success: true,
    data: { supplier: suppliers[supplierIndex] },
    message: 'Fournisseur mis à jour avec succès'
  });
});

// Supprimer un fournisseur
router.delete('/suppliers/:id', (req, res) => {
  const supplierIndex = suppliers.findIndex(s => s.id === req.params.id);
  if (supplierIndex === -1) {
    return res.status(404).json({
      success: false,
      error: { message: 'Fournisseur non trouvé' }
    });
  }
  
  // Vérifier si le fournisseur a des produits
  const hasProducts = products.some(p => p.supplierId === req.params.id);
  if (hasProducts) {
    return res.status(400).json({
      success: false,
      error: { message: 'Impossible de supprimer un fournisseur qui a des produits' }
    });
  }
  
  suppliers.splice(supplierIndex, 1);
  
  res.json({
    success: true,
    message: 'Fournisseur supprimé avec succès'
  });
});

// ROUTES PRODUITS

// Obtenir tous les produits
router.get('/products', (req, res) => {
  res.json({
    success: true,
    data: { products }
  });
});

// Obtenir un produit par ID
router.get('/products/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({
      success: false,
      error: { message: 'Produit non trouvé' }
    });
  }
  res.json({
    success: true,
    data: { product }
  });
});

// Créer un nouveau produit
router.post('/products', (req, res) => {
  const { 
    name, 
    description, 
    category, 
    supplierPrice, 
    publicPrice, 
    stock, 
    minStock, 
    supplierId,
    tags 
  } = req.body;
  
  if (!name || !category || !supplierPrice || !publicPrice || !supplierId) {
    return res.status(400).json({
      success: false,
      error: { message: 'Nom, catégorie, prix fournisseur, prix public et fournisseur sont requis' }
    });
  }
  
  // Vérifier que le fournisseur existe
  const supplier = suppliers.find(s => s.id === supplierId);
  if (!supplier) {
    return res.status(400).json({
      success: false,
      error: { message: 'Fournisseur non trouvé' }
    });
  }
  
  const margin = publicPrice - supplierPrice;
  const marginPercentage = (margin / supplierPrice) * 100;
  
  const newProduct = {
    id: generateId(),
    name,
    description: description || '',
    category,
    supplierPrice: parseFloat(supplierPrice),
    publicPrice: parseFloat(publicPrice),
    margin,
    marginPercentage,
    stock: parseInt(stock) || 0,
    minStock: parseInt(minStock) || 5,
    status: 'active',
    supplierId,
    supplierName: supplier.name,
    images: [],
    tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
    createdAt: new Date().toISOString()
  };
  
  products.push(newProduct);
  
  res.status(201).json({
    success: true,
    data: { product: newProduct },
    message: 'Produit créé avec succès'
  });
});

// Mettre à jour un produit
router.put('/products/:id', (req, res) => {
  const productIndex = products.findIndex(p => p.id === req.params.id);
  if (productIndex === -1) {
    return res.status(404).json({
      success: false,
      error: { message: 'Produit non trouvé' }
    });
  }
  
  const { 
    name, 
    description, 
    category, 
    supplierPrice, 
    publicPrice, 
    stock, 
    minStock, 
    status,
    tags 
  } = req.body;
  
  const currentProduct = products[productIndex];
  const newSupplierPrice = supplierPrice !== undefined ? parseFloat(supplierPrice) : currentProduct.supplierPrice;
  const newPublicPrice = publicPrice !== undefined ? parseFloat(publicPrice) : currentProduct.publicPrice;
  const margin = newPublicPrice - newSupplierPrice;
  const marginPercentage = (margin / newSupplierPrice) * 100;
  
  products[productIndex] = {
    ...currentProduct,
    name: name || currentProduct.name,
    description: description !== undefined ? description : currentProduct.description,
    category: category || currentProduct.category,
    supplierPrice: newSupplierPrice,
    publicPrice: newPublicPrice,
    margin,
    marginPercentage,
    stock: stock !== undefined ? parseInt(stock) : currentProduct.stock,
    minStock: minStock !== undefined ? parseInt(minStock) : currentProduct.minStock,
    status: status || currentProduct.status,
    tags: tags ? tags.split(',').map(tag => tag.trim()) : currentProduct.tags,
    updatedAt: new Date().toISOString()
  };
  
  res.json({
    success: true,
    data: { product: products[productIndex] },
    message: 'Produit mis à jour avec succès'
  });
});

// Supprimer un produit
router.delete('/products/:id', (req, res) => {
  const productIndex = products.findIndex(p => p.id === req.params.id);
  if (productIndex === -1) {
    return res.status(404).json({
      success: false,
      error: { message: 'Produit non trouvé' }
    });
  }
  
  products.splice(productIndex, 1);
  
  res.json({
    success: true,
    message: 'Produit supprimé avec succès'
  });
});

// ROUTES UTILITAIRES

// Obtenir les catégories
router.get('/categories', (req, res) => {
  const categories = [...new Set(products.map(p => p.category))];
  res.json({
    success: true,
    data: { categories }
  });
});

// Statistiques dashboard
router.get('/stats', (req, res) => {
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.status === 'active').length;
  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter(s => s.isActive).length;
  const lowStockProducts = products.filter(p => p.stock <= p.minStock).length;
  
  const totalValue = products.reduce((sum, p) => sum + (p.publicPrice * p.stock), 0);
  const totalMargin = products.reduce((sum, p) => sum + (p.margin * p.stock), 0);
  const avgMargin = products.length > 0 
    ? products.reduce((sum, p) => sum + p.marginPercentage, 0) / products.length 
    : 0;
  
  res.json({
    success: true,
    data: {
      products: {
        total: totalProducts,
        active: activeProducts,
        lowStock: lowStockProducts
      },
      suppliers: {
        total: totalSuppliers,
        active: activeSuppliers
      },
      financial: {
        totalValue,
        totalMargin,
        avgMargin: Math.round(avgMargin * 100) / 100
      }
    }
  });
});

module.exports = router;
