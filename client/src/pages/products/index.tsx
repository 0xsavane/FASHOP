import { useQuery } from 'react-query'
import Layout from '@/components/Layout'
import SEO from '@/components/SEO'
import { productsApi, type Product, formatPriceSimple } from '@/lib/api'
import { useCartStore } from '@/lib/store'
import { 
  ShoppingCart, 
  Search, 
  Filter,
  Star,
  Package,
  Grid3X3,
  List,
  AlertTriangle
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function ProductsPage() {
  const { data, isLoading, isError, refetch } = useQuery('products', () => productsApi.getAll())
  const { addItem, getItemCount } = useCartStore()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [addingToCart, setAddingToCart] = useState<string | null>(null)
  
  const products = data?.data?.data?.products || []
  
  // Filtrage et tri
  const filteredProducts = products
    .filter((product: Product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = !categoryFilter || product.category === categoryFilter
      return matchesSearch && matchesCategory && product.status === 'active'
    })
    .sort((a: Product, b: Product) => {
      switch (sortBy) {
        case 'price_low':
          return a.publicPrice - b.publicPrice
        case 'price_high':
          return b.publicPrice - a.publicPrice
        case 'name':
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })

  const categories = [...new Set(products.map((p: Product) => p.category))]

  const handleAddToCart = async (product: Product) => {
    setAddingToCart(product.id)
    
    addItem({
      id: product.id,
      name: product.name,
      price: product.publicPrice,
      category: product.category,
      supplierId: product.supplierId,
      supplierName: product.supplierName,
    })
    
    toast.success(`${product.name} ajouté au panier !`)
    setTimeout(() => setAddingToCart(null), 500)
  }

  return (
    <Layout>
      <SEO 
        title="Produits - Catalogue complet"
        description="Découvrez notre catalogue complet de produits de qualité en Guinée. Mode, électronique, maison et plus encore, livrés rapidement."
        keywords="produits, catalogue, mode, électronique, maison, Guinée, shopping, qualité"
        url="/products"
      />
      <div className="bg-white py-8">
        <div className="container-custom">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Catalogue Produits
            </h1>
            <p className="text-gray-600">
              Découvrez nos {products.length} produits de qualité en Guinée
            </p>
          </div>

          {/* Filtres */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  className="input pl-10 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <select
                className="input"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">Toutes catégories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              
              <select
                className="input"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="name">Trier par nom</option>
                <option value="price_low">Prix croissant</option>
                <option value="price_high">Prix décroissant</option>
              </select>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-3 rounded-lg ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600'}`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-3 rounded-lg ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600'}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{filteredProducts.length} produits trouvés</span>
              {(searchTerm || categoryFilter) && (
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setCategoryFilter('')
                  }}
                  className="text-primary-600 hover:text-primary-700"
                >
                  Effacer les filtres
                </button>
              )}
            </div>
          </div>

          {/* Produits */}
          {isError ? (
            <div className="text-center py-16">
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Impossible de charger les produits</h3>
              <p className="text-gray-600 mb-6">Vérifiez votre connexion ou réessayez plus tard.</p>
              <button onClick={() => refetch()} className="btn-primary">Réessayer</button>
            </div>
          ) : isLoading ? (
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="card p-6 animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Aucun produit trouvé
              </h3>
              <p className="text-gray-600 mb-6">
                Essayez de modifier vos critères de recherche
              </p>
              <button
                onClick={() => {
                  setSearchTerm('')
                  setCategoryFilter('')
                }}
                className="btn-primary"
              >
                Voir tous les produits
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts.map((product: Product, index: number) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="card-hover p-6 group"
                >
                  <div className="relative mb-4">
                    <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                      <Package className="h-16 w-16 text-gray-400" />
                    </div>
                    <div className="absolute top-2 right-2">
                      <span className="badge-primary">{product.category}</span>
                    </div>
                    {product.stock < 5 && (
                      <div className="absolute top-2 left-2">
                        <span className="badge-warning">Stock faible</span>
                      </div>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                    {product.name}
                  </h3>
                  
                  <div className="flex items-center mb-2">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="h-4 w-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500 ml-2">(4.8)</span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">
                    Vendu par <span className="font-medium">{product.supplierName}</span>
                  </p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-2xl font-bold text-primary-600">
                        {formatPriceSimple(product.publicPrice)}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Stock: {product.stock}</div>
                      <div className="text-xs text-green-600">
                        Marge: {product.marginPercentage.toFixed(0)}%
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={addingToCart === product.id || product.stock === 0}
                    className={`w-full btn-primary ${
                      addingToCart === product.id ? 'opacity-75' : ''
                    } ${product.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {addingToCart === product.id ? (
                      'Ajout...'
                    ) : product.stock === 0 ? (
                      'Rupture de stock'
                    ) : getItemCount(product.id) > 0 ? (
                      `Dans le panier (${getItemCount(product.id)})`
                    ) : (
                      <>
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Ajouter au panier
                      </>
                    )}
                  </button>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredProducts.map((product: Product, index: number) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="card p-6 flex items-center space-x-6"
                >
                  <div className="flex-shrink-0">
                    <div className="h-24 w-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                      <Package className="h-8 w-8 text-gray-400" />
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">
                          {product.name}
                        </h3>
                        <p className="text-gray-600 mb-2">{product.category}</p>
                        <p className="text-sm text-gray-500">
                          Par {product.supplierName}
                        </p>
                        <div className="flex items-center mt-2">
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star key={star} className="h-4 w-4 text-yellow-400 fill-current" />
                            ))}
                          </div>
                          <span className="text-sm text-gray-500 ml-2">(4.8)</span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary-600 mb-1">
                          {formatPriceSimple(product.publicPrice)}
                        </div>
                        <div className="text-sm text-gray-500">Stock: {product.stock}</div>
                        <div className="text-sm text-green-600">
                          +{product.marginPercentage.toFixed(0)}% marge
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={addingToCart === product.id || product.stock === 0}
                      className={`btn-primary ${
                        addingToCart === product.id ? 'opacity-75' : ''
                      } ${product.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {addingToCart === product.id ? (
                        'Ajout...'
                      ) : product.stock === 0 ? (
                        'Rupture'
                      ) : getItemCount(product.id) > 0 ? (
                        `Panier (${getItemCount(product.id)})`
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Ajouter
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
