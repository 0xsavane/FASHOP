import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useQuery } from 'react-query'
import { Users, Package, AlertTriangle, TrendingUp } from 'lucide-react'
import { suppliersApi, productsApi, ordersApi, healthApi, calculateStats, formatPrice } from '@/lib/api'
import type { Supplier, Product, Order } from '@/lib/api'
import Layout from '@/components/Layout'

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'suppliers' | 'products' | 'orders'>('suppliers')
  const [backendStatus, setBackendStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (status === 'loading') return // Still loading
    if (!session) router.push('/auth/signin')
  }, [session, status, router])

  // Queries
  const { data: suppliersData, isLoading: suppliersLoading } = useQuery('suppliers', suppliersApi.getAll)
  const { data: productsData, isLoading: productsLoading } = useQuery('products', productsApi.getAll)
  const { data: ordersData, isLoading: ordersLoading } = useQuery('orders', ordersApi.getAll)

  const suppliers = suppliersData?.data?.data?.suppliers || []
  const products = productsData?.data?.data?.products || []
  const orders = ordersData?.data?.data?.orders || []

  const stats = calculateStats(suppliers, products)

  // Check backend status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        await healthApi.check()
        setBackendStatus('connected')
      } catch (error) {
        setBackendStatus('disconnected')
      }
    }

    checkStatus()
    const interval = setInterval(checkStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse">Chargement...</div>
      </div>
    )
  }

  if (!session) {
    return null // Will redirect to signin
  }

  return (
    <Layout>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Dashboard Title */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard FASHOP</h2>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="card p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Fournisseurs</p>
                  <p className="text-2xl font-semibold">{stats.suppliers.active}/{stats.suppliers.total}</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Package className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Produits</p>
                  <p className="text-2xl font-semibold">{stats.products.active}/{stats.products.total}</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Stock Faible</p>
                  <p className="text-2xl font-semibold">{stats.products.lowStock}</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="p-3 bg-primary-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Marge Moyenne</p>
                  <p className="text-2xl font-semibold">{stats.financial.avgMargin.toFixed(1)}%</p>
                  <p className="text-xs text-gray-400">Potentiel: {formatPrice(stats.financial.totalMargin)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('suppliers')}
              className={`tab-btn ${activeTab === 'suppliers' ? 'active' : ''}`}
            >
              Fournisseurs
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
            >
              Produits
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            >
              Commandes
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'suppliers' && (
          <SuppliersTab suppliers={suppliers} loading={suppliersLoading} />
        )}
        {activeTab === 'products' && (
          <ProductsTab products={products} loading={productsLoading} />
        )}
        {activeTab === 'orders' && (
          <OrdersTab orders={orders} loading={ordersLoading} />
        )}
      </main>
    </Layout>
  )
}

// Suppliers Tab Component
function SuppliersTab({ suppliers, loading }: { suppliers: Supplier[], loading: boolean }) {
  if (loading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse">Chargement des fournisseurs...</div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="px-6 py-4 border-b flex justify-between items-center">
        <h3 className="text-lg font-medium">Fournisseurs Locaux</h3>
        <button className="btn-primary">+ Nouveau Fournisseur</button>
      </div>
      <div className="p-6">
        {suppliers.length === 0 ? (
          <p className="text-gray-500">Aucun fournisseur pour le moment</p>
        ) : (
          <div className="space-y-4">
            {suppliers.map((supplier) => (
              <div key={supplier.id} className="flex items-center justify-between py-4 border-b last:border-b-0">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="font-medium text-primary-600">{supplier.name.charAt(0)}</span>
                  </div>
                  <div>
                    <h4 className="font-medium">{supplier.name}</h4>
                    <p className="text-sm text-gray-500">{supplier.phone} • {supplier.address}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1">
                    <span className="text-yellow-400">★</span>
                    <span className="text-sm">{supplier.rating}</span>
                  </div>
                  <p className="text-sm text-gray-500">{supplier.totalOrders} commandes</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Products Tab Component
function ProductsTab({ products, loading }: { products: Product[], loading: boolean }) {
  if (loading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse">Chargement des produits...</div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="px-6 py-4 border-b flex justify-between items-center">
        <h3 className="text-lg font-medium">Catalogue Produits</h3>
        <button className="btn-primary">+ Nouveau Produit</button>
      </div>
      <div className="p-6">
        {products.length === 0 ? (
          <p className="text-gray-500">Aucun produit pour le moment</p>
        ) : (
          <div className="space-y-4">
            {products.map((product) => (
              <div key={product.id} className="flex items-center justify-between py-4 border-b last:border-b-0">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Package className="h-8 w-8 text-gray-400" />
                  </div>
                  <div>
                    <h4 className="font-medium">{product.name}</h4>
                    <p className="text-sm text-gray-500">{product.category} • Par {product.supplierName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary-600">{formatPrice(product.publicPrice)}</p>
                  <p className="text-sm text-green-600">+{product.marginPercentage.toFixed(0)}% marge</p>
                  <p className={`text-sm ${product.stock <= product.minStock ? 'text-red-600' : 'text-gray-500'}`}>
                    Stock: {product.stock}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Orders Tab Component
function OrdersTab({ orders, loading }: { orders: Order[], loading: boolean }) {
  if (loading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse">Chargement des commandes...</div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="px-6 py-4 border-b">
        <h3 className="text-lg font-medium">Commandes</h3>
      </div>
      <div className="p-6">
        {orders.length === 0 ? (
          <p className="text-gray-500">Aucune commande pour le moment</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between py-4 border-b last:border-b-0">
                <div>
                  <h4 className="font-medium">{order.orderNumber}</h4>
                  <p className="text-sm text-gray-500">{order.customerEmail}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatPrice(order.total)}</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    order.status === 'delivered' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
