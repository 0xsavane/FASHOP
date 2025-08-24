import mongoose, { Document, Schema } from 'mongoose';
import { Supplier as SupplierType } from '@fashop/shared';

export interface ISupplier extends Omit<SupplierType, 'id'>, Document {}

const supplierSchema = new Schema<ISupplier>({
  name: {
    type: String,
    required: [true, 'Nom du fournisseur requis'],
    trim: true,
    maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email invalide']
  },
  phone: {
    type: String,
    required: [true, 'Numéro de téléphone requis'],
    trim: true,
    match: [/^(\+224|224)?[6-7][0-9]{7}$/, 'Numéro de téléphone guinéen invalide']
  },
  whatsapp: {
    type: String,
    trim: true,
    match: [/^(\+224|224)?[6-7][0-9]{7}$/, 'Numéro WhatsApp invalide']
  },
  address: {
    type: String,
    required: [true, 'Adresse requise'],
    trim: true,
    maxlength: [200, 'L\'adresse ne peut pas dépasser 200 caractères']
  },
  city: {
    type: String,
    default: 'Conakry',
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'La description ne peut pas dépasser 500 caractères']
  },
  rating: {
    type: Number,
    min: [0, 'La note ne peut pas être négative'],
    max: [5, 'La note ne peut pas dépasser 5'],
    default: 0
  },
  totalOrders: {
    type: Number,
    min: [0, 'Le nombre de commandes ne peut pas être négatif'],
    default: 0
  },
  successfulOrders: {
    type: Number,
    min: [0, 'Le nombre de commandes réussies ne peut pas être négatif'],
    default: 0
  },
  averageResponseTime: {
    type: Number,
    min: [0, 'Le temps de réponse ne peut pas être négatif']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  paymentTerms: {
    type: String,
    trim: true,
    maxlength: [200, 'Les conditions de paiement ne peuvent pas dépasser 200 caractères']
  },
  deliveryZones: [{
    type: String,
    enum: ['Kaloum', 'Dixinn', 'Matam', 'Ratoma', 'Matoto']
  }],
  categories: [{
    type: String,
    trim: true
  }]
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
supplierSchema.index({ name: 1 });
supplierSchema.index({ phone: 1 });
supplierSchema.index({ isActive: 1 });
supplierSchema.index({ categories: 1 });
supplierSchema.index({ deliveryZones: 1 });
supplierSchema.index({ rating: -1 });

// Méthode virtuelle pour calculer le taux de succès
supplierSchema.virtual('successRate').get(function() {
  if (this.totalOrders === 0) return 0;
  return Math.round((this.successfulOrders / this.totalOrders) * 100);
});

// Méthode pour mettre à jour les statistiques
supplierSchema.methods.updateStats = function(isSuccessful: boolean, responseTime?: number) {
  this.totalOrders += 1;
  if (isSuccessful) {
    this.successfulOrders += 1;
  }
  
  if (responseTime && responseTime > 0) {
    if (this.averageResponseTime) {
      this.averageResponseTime = (this.averageResponseTime + responseTime) / 2;
    } else {
      this.averageResponseTime = responseTime;
    }
  }
  
  // Recalculer la note basée sur le taux de succès et le temps de réponse
  const successRate = this.successfulOrders / this.totalOrders;
  const responseScore = this.averageResponseTime ? Math.max(0, 5 - (this.averageResponseTime / 60)) : 3;
  this.rating = Math.min(5, (successRate * 3) + (responseScore * 0.4) + 1);
  
  return this.save();
};

export const Supplier = mongoose.model<ISupplier>('Supplier', supplierSchema);
