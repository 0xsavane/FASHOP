import mongoose, { Document, Schema } from 'mongoose';
import { Product as ProductType } from '../../../shared/src';
import { calculateMargin } from '../../../shared/src';

export interface IProduct extends Omit<ProductType, 'id'>, Document {}

const productSchema = new Schema<IProduct>({
  name: {
    type: String,
    required: [true, 'Nom du produit requis'],
    trim: true,
    maxlength: [200, 'Le nom ne peut pas dépasser 200 caractères']
  },
  description: {
    type: String,
    required: [true, 'Description requise'],
    trim: true,
    maxlength: [2000, 'La description ne peut pas dépasser 2000 caractères']
  },
  category: {
    type: String,
    required: [true, 'Catégorie requise'],
    trim: true
  },
  subcategory: {
    type: String,
    trim: true
  },
  brand: {
    type: String,
    trim: true
  },
  sku: {
    type: String,
    required: [true, 'SKU requis'],
    unique: true,
    trim: true,
    uppercase: true,
    match: [/^[A-Z0-9-_]+$/, 'SKU invalide (lettres majuscules, chiffres, tirets et underscores uniquement)']
  },
  
  // Prix et marges
  supplierPrice: {
    type: Number,
    required: [true, 'Prix fournisseur requis'],
    min: [0, 'Le prix fournisseur ne peut pas être négatif']
  },
  publicPrice: {
    type: Number,
    required: [true, 'Prix public requis'],
    min: [0, 'Le prix public ne peut pas être négatif']
  },
  margin: {
    type: Number,
    min: [0, 'La marge ne peut pas être négative']
  },
  marginPercentage: {
    type: Number,
    min: [0, 'Le pourcentage de marge ne peut pas être négatif']
  },
  
  // Stock et disponibilité
  stock: {
    type: Number,
    min: [0, 'Le stock ne peut pas être négatif'],
    default: 0
  },
  minStock: {
    type: Number,
    min: [0, 'Le stock minimum ne peut pas être négatif'],
    default: 1
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  
  // Informations produit
  images: [{
    type: String,
    trim: true
  }],
  mainImage: {
    type: String,
    trim: true
  },
  colors: [{
    type: String,
    trim: true
  }],
  sizes: [{
    type: String,
    trim: true
  }],
  weight: {
    type: Number,
    min: [0, 'Le poids ne peut pas être négatif']
  },
  dimensions: {
    length: {
      type: Number,
      min: [0, 'La longueur ne peut pas être négative']
    },
    width: {
      type: Number,
      min: [0, 'La largeur ne peut pas être négative']
    },
    height: {
      type: Number,
      min: [0, 'La hauteur ne peut pas être négative']
    }
  },
  
  // Fournisseur
  supplierId: {
    type: Schema.Types.ObjectId,
    ref: 'Supplier',
    required: [true, 'ID fournisseur requis']
  },
  supplierName: {
    type: String,
    required: [true, 'Nom fournisseur requis'],
    trim: true
  },
  
  // SEO et métadonnées
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  metaTitle: {
    type: String,
    trim: true,
    maxlength: [60, 'Le titre meta ne peut pas dépasser 60 caractères']
  },
  metaDescription: {
    type: String,
    trim: true,
    maxlength: [160, 'La description meta ne peut pas dépasser 160 caractères']
  },
  
  // Statistiques
  views: {
    type: Number,
    min: [0, 'Le nombre de vues ne peut pas être négatif'],
    default: 0
  },
  orders: {
    type: Number,
    min: [0, 'Le nombre de commandes ne peut pas être négatif'],
    default: 0
  },
  rating: {
    type: Number,
    min: [0, 'La note ne peut pas être négative'],
    max: [5, 'La note ne peut pas dépasser 5'],
    default: 0
  },
  reviewCount: {
    type: Number,
    min: [0, 'Le nombre d\'avis ne peut pas être négatif'],
    default: 0
  },
  
  // Statut
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'out_of_stock'],
    default: 'draft'
  },
  featured: {
    type: Boolean,
    default: false
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
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ subcategory: 1 });
productSchema.index({ supplierId: 1 });
productSchema.index({ status: 1 });
productSchema.index({ featured: -1 });
productSchema.index({ publicPrice: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ orders: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ sku: 1 });

// Middleware pour calculer automatiquement la marge avant sauvegarde
productSchema.pre('save', function(next) {
  if (this.isModified('supplierPrice') || this.isModified('publicPrice')) {
    const marginData = calculateMargin(this.supplierPrice, this.publicPrice);
    this.margin = marginData.margin;
    this.marginPercentage = marginData.marginPercentage;
  }
  
  // Définir l'image principale si pas définie
  if (!this.mainImage && this.images.length > 0) {
    this.mainImage = this.images[0];
  }
  
  // Mettre à jour le statut selon le stock
  if (this.stock <= 0 && this.status === 'active') {
    this.status = 'out_of_stock';
  } else if (this.stock > 0 && this.status === 'out_of_stock') {
    this.status = 'active';
  }
  
  next();
});

// Méthode pour incrémenter les vues
productSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Méthode pour incrémenter les commandes
productSchema.methods.incrementOrders = function() {
  this.orders += 1;
  return this.save();
};

// Méthode pour mettre à jour le stock
productSchema.methods.updateStock = function(quantity: number) {
  this.stock = Math.max(0, this.stock + quantity);
  if (this.stock <= 0) {
    this.status = 'out_of_stock';
    this.isAvailable = false;
  } else if (this.status === 'out_of_stock') {
    this.status = 'active';
    this.isAvailable = true;
  }
  return this.save();
};

// Méthode virtuelle pour vérifier si le stock est bas
productSchema.virtual('isLowStock').get(function() {
  return this.stock <= this.minStock;
});

export const Product = mongoose.model<IProduct>('Product', productSchema);
