import { useState, useMemo } from 'react'
import Layout from '@/components/Layout'
import SEO from '@/components/SEO'
import { useQuery } from 'react-query'
import { productsApi, formatPrice } from '@/lib/api'
import { useCartStore } from '@/lib/store'
import { 
  Grid, 
  List, 
  Filter, 
  Search, 
  ChevronDown, 
  ShoppingCart,
  AlertTriangle,
  Package
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

export default function CategoriesPage() {
  const { data, isLoading, isError, refetch } = useQuery('products', productsApi.getAll)
  const { addItem } = useCartStore()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const [filtersOpen, setFiltersOpen] = useState(false)
  
  const itemsPerPage = 12
  
  const products = data?.data?.data?.products || []
  
  // Extraire les catégories uniques
  const categories = useMemo(() => {
    const cats = [...new Set(products.map(p => p.category))]
    return cats.sort()
  }, [products])
  
  // Filtrer et trier les produits
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
      return matchesSearch && matchesCategory
    })
    
    // Tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.publicPrice - b.publicPrice
        case 'price-desc':
          return b.publicPrice - a.publicPrice
        case 'name':
          return a.name.localeCompare(b.name)
        case 'category':
          return a.category.localeCompare(b.category)
        default:
          return 0
      }
    })
    
    return filtered
  }, [products, searchTerm, selectedCategory, sortBy])
  
  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )
  
  const handleAddToCart = (product: any) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.publicPrice,
      category: product.category,
      supplierId: product.supplierId,
      supplierName: product.supplierName,
    })
    toast.success(`${product.name} ajouté au panier`)
  }
  
  if (isError) {
    return (
      <Layout>
        <div className="bg-white py-16">
          <div className="container-custom text-center">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Erreur de chargement</h2>
            <p className="text-gray-600 mb-6">Impossible de charger les catégories</p>
            <button onClick={() => refetch()} className="btn-primary">
              Réessayer
            </button>
          </div>
        </div>
      </Layout>
    )
  }
  
  return (
    <Layout>
      <SEO 
        title="Catégories - Explorez par catégorie"
        description="Explorez nos produits par catégorie : mode, électronique, maison et plus encore. Filtres avancés et recherche pour trouver exactement ce que vous cherchez."
        keywords="catégories, mode, électronique, maison, filtres, recherche, produits, Guinée"
        url="/categories"
      />
      <div className="bg-white py-8">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Catégories</h1>
              <p className="text-gray-600 mt-2">
                Découvrez nos produits par catégorie ({filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''})
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Toggle vue */}
              <div className="flex items-center border rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
              
              {/* Filtres mobile */}
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="md:hidden btn-secondary flex items-center space-x-2"
              >
                <Filter className="h-4 w-4" />
                <span>Filtres</span>
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar filtres */}
            <div className={`lg:col-span-1 ${filtersOpen ? 'block' : 'hidden lg:block'}`}>
              <div className="card p-6 space-y-6">
                {/* Recherche */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rechercher</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Nom du produit..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value)
                        setCurrentPage(1)
                      }}
                      className="input pl-10"
                    />
                  </div>
                </div>
                
                {/* Catégories */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="input"
                  >
                    <option value="all">Toutes les catégories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                
                {/* Tri */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Trier par</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="input"
                  >
                    <option value="name">Nom A-Z</option>
                    <option value="price-asc">Prix croissant</option>
                    <option value="price-desc">Prix décroissant</option>
                    <option value="category">Catégorie</option>
                  </select>
                </div>
                
                {/* Stats */}
                <div className="pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    <div className="flex justify-between mb-2">
                      <span>Total produits:</span>
                      <span className="font-medium">{products.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Résultats:</span>
                      <span className="font-medium text-primary-600">{filteredProducts.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Contenu principal */}
            <div className="lg:col-span-3">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="card p-6 animate-pulse">
                      <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-16">
                  <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">Aucun produit trouvé</h3>
                  <p className="text-gray-600">Essayez de modifier vos filtres de recherche</p>
                </div>
              ) : (
                <>
                  {/* Grille produits */}
                  <div className={`grid gap-6 ${
                    viewMode === 'grid' 
                      ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' 
                      : 'grid-cols-1'
                  }`}>
                    <AnimatePresence>
                      {paginatedProducts.map((product, index) => (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`card p-6 hover:shadow-lg transition-shadow ${
                            viewMode === 'list' ? 'flex items-center space-x-6' : ''
                          }`}
                        >
                          <div className={`${viewMode === 'list' ? 'w-32 h-32 flex-shrink-0' : 'h-48 mb-4'} bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center text-primary-600 font-bold text-2xl`}>
                            {product.name.charAt(0)}
                          </div>
                          
                          <div className={viewMode === 'list' ? 'flex-1' : ''}>
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded ml-2">
                                {product.category}
                              </span>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {product.description || `Produit de qualité de ${product.supplierName}`}
                            </p>
                            
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-lg font-bold text-primary-600">
                                  {formatPrice(product.publicPrice)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Stock: {product.stock > 0 ? product.stock : 'Épuisé'}
                                </div>
                              </div>
                              
                              <button
                                onClick={() => handleAddToCart(product)}
                                disabled={product.stock === 0}
                                className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <ShoppingCart className="h-4 w-4" />
                                <span>Ajouter</span>
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center mt-8 space-x-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Précédent
                      </button>
                      
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-10 h-10 rounded-lg font-medium ${
                              page === currentPage
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                      
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Suivant
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
