import mongoose, { Document, Schema } from 'mongoose';
import { Order as OrderType, OrderItem, DeliveryAddress } from '@fashop/shared';

export interface IOrder extends Omit<OrderType, 'id'>, Document {}

const orderItemSchema = new Schema<OrderItem>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true,
    trim: true
  },
  productImage: {
    type: String,
    trim: true
  },
  sku: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'La quantité doit être au moins 1']
  },
  supplierPrice: {
    type: Number,
    required: true,
    min: [0, 'Le prix fournisseur ne peut pas être négatif']
  },
  publicPrice: {
    type: Number,
    required: true,
    min: [0, 'Le prix public ne peut pas être négatif']
  },
  totalPrice: {
    type: Number,
    required: true,
    min: [0, 'Le prix total ne peut pas être négatif']
  },
  color: {
    type: String,
    trim: true
  },
  size: {
    type: String,
    trim: true
  },
  supplierId: {
    type: Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  supplierName: {
    type: String,
    required: true,
    trim: true
  }
}, { _id: false });

const deliveryAddressSchema = new Schema<DeliveryAddress>({
  firstName: {
    type: String,
    required: [true, 'Prénom requis'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Nom requis'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Téléphone requis'],
    trim: true,
    match: [/^(\+224|224)?[6-7][0-9]{7}$/, 'Numéro de téléphone guinéen invalide']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email invalide']
  },
  address: {
    type: String,
    required: [true, 'Adresse requise'],
    trim: true
  },
  city: {
    type: String,
    default: 'Conakry',
    trim: true
  },
  commune: {
    type: String,
    trim: true
  },
  quartier: {
    type: String,
    trim: true
  },
  landmark: {
    type: String,
    trim: true
  },
  instructions: {
    type: String,
    trim: true
  }
}, { _id: false });

const supplierOrderSchema = new Schema({
  supplierId: {
    type: Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  supplierName: {
    type: String,
    required: true,
    trim: true
  },
  supplierPhone: {
    type: String,
    required: true,
    trim: true
  },
  items: [{
    type: String // IDs des produits
  }],
  notificationSent: {
    type: Boolean,
    default: false
  },
  response: {
    type: String,
    enum: ['pending', 'confirmed', 'rejected'],
    default: 'pending'
  },
  responseTime: {
    type: Date
  }
}, { _id: false });

const orderSchema = new Schema<IOrder>({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    match: [/^FASH-\d+$/, 'Format de numéro de commande invalide']
  },
  
  // Client
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  customerEmail: {
    type: String,
    required: [true, 'Email client requis'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email invalide']
  },
  customerPhone: {
    type: String,
    required: [true, 'Téléphone client requis'],
    trim: true,
    match: [/^(\+224|224)?[6-7][0-9]{7}$/, 'Numéro de téléphone guinéen invalide']
  },
  
  // Articles
  items: [orderItemSchema],
  
  // Montants
  subtotal: {
    type: Number,
    required: true,
    min: [0, 'Le sous-total ne peut pas être négatif']
  },
  deliveryFee: {
    type: Number,
    min: [0, 'Les frais de livraison ne peuvent pas être négatifs'],
    default: 0
  },
  total: {
    type: Number,
    required: true,
    min: [0, 'Le total ne peut pas être négatif']
  },
  totalMargin: {
    type: Number,
    min: [0, 'La marge totale ne peut pas être négative'],
    default: 0
  },
  
  // Livraison
  deliveryAddress: {
    type: deliveryAddressSchema,
    required: true
  },
  deliveryMethod: {
    type: String,
    enum: ['standard', 'express', 'pickup'],
    default: 'standard'
  },
  estimatedDelivery: {
    type: Date
  },
  
  // Statuts
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  
  // Paiement
  paymentMethod: {
    type: String,
    enum: ['orange_money', 'card', 'cash'],
    required: true
  },
  paymentReference: {
    type: String,
    trim: true
  },
  
  // Fournisseurs
  suppliers: [supplierOrderSchema],
  
  // Métadonnées
  notes: {
    type: String,
    trim: true
  },
  adminNotes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Index pour optimiser les recherches
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ customerId: 1 });
orderSchema.index({ customerEmail: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'suppliers.supplierId': 1 });

// Middleware pour calculer la marge totale avant sauvegarde
orderSchema.pre('save', function(next) {
  if (this.isModified('items')) {
    this.totalMargin = this.items.reduce((total, item) => {
      const margin = (item.publicPrice - item.supplierPrice) * item.quantity;
      return total + margin;
    }, 0);
  }
  next();
});

// Méthode pour mettre à jour le statut
orderSchema.methods.updateStatus = function(newStatus: string, adminNotes?: string) {
  this.status = newStatus;
  if (adminNotes) {
    this.adminNotes = adminNotes;
  }
  return this.save();
};

// Méthode pour confirmer le paiement
orderSchema.methods.confirmPayment = function(paymentReference?: string) {
  this.paymentStatus = 'paid';
  if (paymentReference) {
    this.paymentReference = paymentReference;
  }
  return this.save();
};

// Méthode pour traiter la réponse d'un fournisseur
orderSchema.methods.processSupplierResponse = function(supplierId: string, response: 'confirmed' | 'rejected') {
  const supplier = this.suppliers.find(s => s.supplierId.toString() === supplierId);
  if (supplier) {
    supplier.response = response;
    supplier.responseTime = new Date();
    
    // Si tous les fournisseurs ont répondu positivement, confirmer la commande
    const allConfirmed = this.suppliers.every(s => s.response === 'confirmed');
    const anyRejected = this.suppliers.some(s => s.response === 'rejected');
    
    if (allConfirmed) {
      this.status = 'confirmed';
    } else if (anyRejected) {
      this.status = 'cancelled';
    }
  }
  
  return this.save();
};

export const Order = mongoose.model<IOrder>('Order', orderSchema);
