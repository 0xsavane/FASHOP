import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Types
export interface Supplier {
  id: string
  name: string
  phone: string
  address: string
  rating: number
  totalOrders: number
  isActive: boolean
  createdAt: string
}

export interface Product {
  id: string
  name: string
  category: string
  supplierName: string
  supplierId: string
  supplierPrice: number
  publicPrice: number
  margin: number
  marginPercentage: number
  stock: number
  minStock: number
  status: 'active' | 'inactive' | 'out_of_stock'
  description?: string
  images?: string[]
  views: number
  orders: number
  createdAt: string
}

export interface Order {
  id: string
  orderNumber: string
  customerEmail: string
  customerPhone: string
  deliveryAddress: {
    fullName: string
    phone: string
    address: string
    city: string
    commune: string
    landmark?: string
  }
  items: Array<{
    productId: string
    productName: string
    quantity: number
    price: number
    supplierName: string
  }>
  paymentMethod: 'orange_money' | 'card'
  total: number
  status: 'pending' | 'confirmed' | 'supplier_notified' | 'in_delivery' | 'delivered' | 'cancelled'
  workflow: string[]
  supplierNotified: boolean
  supplierConfirmed: boolean
  createdAt: string
}

export interface Stats {
  suppliers: {
    total: number
    active: number
  }
  products: {
    total: number
    active: number
    lowStock: number
  }
  financial: {
    avgMargin: number
    totalRevenue: number
    totalMargin: number
  }
}

// API Functions
export const suppliersApi = {
  getAll: () => api.get<{ success: boolean; data: { suppliers: Supplier[] } }>('/api/v1/test/suppliers'),
  create: (data: Partial<Supplier>) => api.post<{ success: boolean; data: { supplier: Supplier } }>('/api/v1/suppliers', data),
}

export const productsApi = {
  getAll: () => api.get<{ success: boolean; data: { products: Product[] } }>('/api/v1/test/products'),
  getById: (id: string) => api.get<{ success: boolean; data: { product: Product } }>(`/api/v1/test/products/${id}`),
  create: (data: Partial<Product>) => api.post<{ success: boolean; data: { product: Product } }>('/api/v1/products', data),
}

export const ordersApi = {
  getAll: () => api.get<{ success: boolean; data: { orders: Order[] } }>('/api/v1/test/orders'),
  create: (data: Partial<Order>) => api.post<{ success: boolean; data: { order: Order } }>('/api/v1/orders', data),
}

export const healthApi = {
  check: () => api.get<{ status: string; service: string; timestamp: string }>('/api/v1/health'),
}

// Utility functions
export const formatPrice = (price: number): string => {
  if (price >= 1000000) {
    return `${(price / 1000000).toFixed(1)}M GNF`
  } else if (price >= 1000) {
    return `${(price / 1000).toFixed(0)}k GNF`
  }
  return `${price} GNF`
}

export const calculateStats = (suppliers: Supplier[], products: Product[]): Stats => {
  const activeSuppliers = suppliers.filter(s => s.isActive).length
  const activeProducts = products.filter(p => p.status === 'active').length
  const lowStockProducts = products.filter(p => p.stock <= p.minStock).length
  
  const avgMargin = products.length > 0 
    ? products.reduce((sum, p) => sum + p.marginPercentage, 0) / products.length 
    : 0
  
  const totalRevenue = products.reduce((sum, p) => sum + (p.publicPrice * p.stock), 0)
  const totalMargin = products.reduce((sum, p) => sum + (p.margin * p.stock), 0)

  return {
    suppliers: {
      total: suppliers.length,
      active: activeSuppliers,
    },
    products: {
      total: products.length,
      active: activeProducts,
      lowStock: lowStockProducts,
    },
    financial: {
      avgMargin,
      totalRevenue,
      totalMargin,
    },
  }
}
