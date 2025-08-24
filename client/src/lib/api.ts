import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === '1' || process.env.NEXT_PUBLIC_USE_MOCK === 'true'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Types
export interface Product {
  id: string
  name: string
  category: string
  supplierPrice: number
  publicPrice: number
  margin: number
  marginPercentage: number
  stock: number
  status: string
  supplierId: string
  supplierName: string
  description?: string
  images?: string[]
}

export interface OrderRequest {
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
    quantity: number
    price: number
  }>
  paymentMethod: 'orange_money' | 'card'
  total: number
}

export interface OrderResponse {
  orderNumber: string
  status: string
  message: string
  workflow: string[]
}

// Mock helpers and data
const mockLatency = Number(process.env.NEXT_PUBLIC_MOCK_LATENCY_MS || 600)
const mockErrorRate = Number(process.env.NEXT_PUBLIC_MOCK_ERROR_RATE || 0)

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))
const maybeFail = () => {
  if (mockErrorRate > 0 && Math.random() < mockErrorRate) {
    const err: any = new Error('Mock API error')
    err.response = { status: 500, data: { success: false, message: 'Mock API error' } }
    throw err
  }
}

const mockProducts: Product[] = [
  {
    id: 'p-1',
    name: 'Smartphone GN 4G',
    category: 'Électronique',
    supplierPrice: 900000,
    publicPrice: 1200000,
    margin: 300000,
    marginPercentage: 25,
    stock: 12,
    status: 'active',
    supplierId: 's-1',
    supplierName: 'Fournisseur Conakry',
    description: 'Un smartphone fiable avec 4G adapté au marché guinéen.',
  },
  {
    id: 'p-2',
    name: 'Sac à dos robuste',
    category: 'Mode',
    supplierPrice: 80000,
    publicPrice: 150000,
    margin: 70000,
    marginPercentage: 46,
    stock: 5,
    status: 'active',
    supplierId: 's-2',
    supplierName: 'Marché Madina',
  },
  {
    id: 'p-3',
    name: 'Chaussures sport',
    category: 'Mode',
    supplierPrice: 120000,
    publicPrice: 220000,
    margin: 100000,
    marginPercentage: 45,
    stock: 0,
    status: 'active',
    supplierId: 's-2',
    supplierName: 'Marché Madina',
  },
  {
    id: 'p-4',
    name: 'Bouilloire électrique',
    category: 'Maison',
    supplierPrice: 70000,
    publicPrice: 130000,
    margin: 60000,
    marginPercentage: 46,
    stock: 20,
    status: 'active',
    supplierId: 's-3',
    supplierName: 'Boutique Kaloum',
  },
]

// API Functions (real or mock)
export const productsApi = USE_MOCK
  ? {
      getAll: async () => {
        await delay(mockLatency)
        maybeFail()
        return {
          data: { success: true, data: { products: mockProducts } },
        } as any
      },
      getById: async (id: string) => {
        await delay(mockLatency)
        maybeFail()
        const product = mockProducts.find((p) => p.id === id)
        if (!product) {
          const err: any = new Error('Not found')
          err.response = { status: 404, data: { success: false, message: 'Not found' } }
          throw err
        }
        return { data: { success: true, data: { product } } } as any
      },
    }
  : {
      getAll: () => api.get<{ success: boolean; data: { products: Product[] } }>(
        '/api/v1/test/products'
      ),
      getById: (id: string) =>
        api.get<{ success: boolean; data: { product: Product } }>(`/api/v1/test/products/${id}`),
    }

export const ordersApi = USE_MOCK
  ? {
      create: async (data: OrderRequest) => {
        await delay(mockLatency)
        maybeFail()
        const order: OrderResponse = {
          orderNumber: `FA-${Math.floor(100000 + Math.random() * 900000)}`,
          status: 'created',
          message: 'Commande créée (mock)',
          workflow: [
            'Commande reçue',
            'Notification fournisseur (mock)',
            'Confirmation fournisseur (mock)',
            'Livraison en cours (mock)'
          ],
        }
        return { data: { success: true, data: { order } } } as any
      },
    }
  : {
      create: (data: OrderRequest) =>
        api.post<{ success: boolean; data: { order: OrderResponse } }>(
          '/api/v1/test/orders',
          data
        ),
    }

export const healthApi = USE_MOCK
  ? {
      check: async () => {
        await delay(100)
        return {
          data: { status: 'ok', service: 'mock-client', timestamp: new Date().toISOString() },
        } as any
      },
    }
  : {
      check: () => api.get<{ status: string; service: string; timestamp: string }>(
        '/api/v1/health'
      ),
    }

// Utility functions
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('fr-GN', {
    style: 'currency',
    currency: 'GNF',
    minimumFractionDigits: 0,
  }).format(price).replace('GNF', 'GNF')
}

export const formatPriceSimple = (price: number): string => {
  if (price >= 1000000) {
    return `${(price / 1000000).toFixed(1)}M GNF`
  } else if (price >= 1000) {
    return `${(price / 1000).toFixed(0)}k GNF`
  }
  return `${price} GNF`
}
