import Layout from '@/components/Layout'
import Link from 'next/link'
import { useCartStore } from '@/lib/store'
import { formatPriceSimple } from '@/lib/api'
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react'

export default function CartPage() {
  const { items, updateQuantity, removeItem, getTotalItems, getTotalPrice } = useCartStore()

  const totalItems = getTotalItems()
  const totalPrice = getTotalPrice()

  return (
    <Layout>
      <div className="bg-white py-8">
        <div className="container-custom">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Votre Panier</h1>

          {items.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Panier vide</h3>
              <p className="text-gray-600 mb-6">Ajoutez des produits pour continuer vos achats</p>
              <Link href="/products" className="btn-primary">Voir les produits</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="card p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center">📦</div>
                      <div>
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <div className="text-sm text-gray-500">{item.category} • {item.supplierName}</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <button
                          aria-label="Diminuer"
                          className="btn-icon"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-10 text-center">{item.quantity}</span>
                        <button
                          aria-label="Augmenter"
                          className="btn-icon"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="w-24 text-right font-semibold text-primary-600">
                        {formatPriceSimple(item.price * item.quantity)}
                      </div>
                      <button
                        aria-label="Supprimer"
                        className="p-2 text-red-600 hover:text-red-700"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="card p-6 h-fit">
                <h3 className="text-lg font-semibold mb-4">Récapitulatif</h3>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">Articles</span>
                  <span className="font-medium">{totalItems}</span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-600">Total</span>
                  <span className="text-xl font-bold text-primary-600">{formatPriceSimple(totalPrice)}</span>
                </div>
                <Link
                  href={items.length > 0 ? '/checkout' : '#'}
                  className={`btn-primary w-full text-center ${items.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Passer au paiement
                </Link>
                <div className="text-xs text-gray-500 mt-2">Livraison à Conakry en 24-48h</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
