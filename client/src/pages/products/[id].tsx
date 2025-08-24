import { useRouter } from 'next/router'
import { useQuery } from 'react-query'
import Layout from '@/components/Layout'
import { productsApi, formatPriceSimple } from '@/lib/api'
import { useCartStore } from '@/lib/store'
import { Package, Star, ShoppingCart } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProductDetailPage() {
  const router = useRouter()
  const { id } = router.query as { id?: string }
  const { data, isLoading } = useQuery(['product', id], () => productsApi.getById(id as string), { enabled: !!id })
  const { addItem, getItemCount } = useCartStore()

  const product = data?.data?.data?.product

  const handleAdd = () => {
    if (!product) return
    addItem({
      id: product.id,
      name: product.name,
      price: product.publicPrice,
      category: product.category,
      supplierId: product.supplierId,
      supplierName: product.supplierName,
    })
    toast.success(`${product.name} ajouté au panier !`)
  }

  return (
    <Layout>
      <div className="bg-white py-8">
        <div className="container-custom">
          {isLoading ? (
            <div className="text-gray-600">Chargement...</div>
          ) : !product ? (
            <div className="text-gray-600">Produit introuvable.</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="card p-6 flex items-center justify-center h-96">
                <Package className="h-24 w-24 text-gray-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                <div className="flex items-center mb-4">
                  {[1,2,3,4,5].map(i => <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />)}
                  <span className="text-sm text-gray-500 ml-2">(4.8)</span>
                </div>
                <div className="text-primary-600 text-3xl font-bold mb-2">{formatPriceSimple(product.publicPrice)}</div>
                <div className="text-sm text-gray-500 mb-6">Vendu par {product.supplierName}</div>
                {product.description && (
                  <p className="text-gray-700 mb-6 leading-relaxed">{product.description}</p>
                )}
                <div className="flex items-center space-x-3">
                  <button onClick={handleAdd} className="btn-primary">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Ajouter au panier
                  </button>
                  {getItemCount(product.id) > 0 && (
                    <div className="text-sm text-gray-600">Dans le panier: {getItemCount(product.id)}</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
