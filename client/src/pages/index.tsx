import { useQuery } from 'react-query'
import Layout from '@/components/Layout'
import SEO from '@/components/SEO'
import { productsApi, type Product, formatPriceSimple } from '@/lib/api'
import { useCartStore } from '@/lib/store'
import { 
  ShoppingCart, 
  Star, 
  Truck, 
  Shield, 
  Phone,
  ArrowRight,
  Package,
  Users,
  TrendingUp,
  AlertTriangle
} from 'lucide-react'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import { useState } from 'react'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function HomePage() {
  const { data, isLoading, isError, refetch } = useQuery('products', () => productsApi.getAll())
  const { addItem, getItemCount } = useCartStore()
  const [addingToCart, setAddingToCart] = useState<string | null>(null)
  
  const products = data?.data?.data?.products || []
  const featuredProducts = products.slice(0, 6)

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

  const stats = [
    { icon: Users, label: 'Fournisseurs Locaux', value: '50+' },
    { icon: Package, label: 'Produits Disponibles', value: '500+' },
    { icon: TrendingUp, label: 'Commandes Livrées', value: '1000+' },
  ]

  return (
    <Layout>
      <SEO 
        title="FASHOP - E-commerce en Guinée"
        description="La première plateforme e-commerce de dropshipping local en Guinée. Des produits de qualité, livrés rapidement à Conakry et dans toute la Guinée."
        keywords="e-commerce, Guinée, dropshipping, livraison, Conakry, produits, shopping, mode, électronique, maison"
        url="/"
      />
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-white py-16 lg:py-24">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
                Découvrez le
                <span className="text-gradient block">Shopping Local</span>
                en Guinée
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                FASHOP connecte les meilleurs fournisseurs locaux avec vous. 
                Des produits authentiques, des prix justes, une livraison rapide à Conakry.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/products" className="btn-primary btn-lg">
                  Explorer les Produits
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <button className="btn-outline btn-lg">
                  <Phone className="mr-2 h-5 w-5" />
                  Nous Contacter
                </button>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="bg-white rounded-2xl shadow-2xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="h-8 w-8 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Livraison Rapide</h3>
                  <p className="text-gray-600">Recevez vos commandes en 24-48h à Conakry</p>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 w-12 h-8 guinea-flag rounded shadow-lg"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Truck,
                title: 'Livraison Gratuite',
                description: 'Livraison gratuite à Conakry pour toute commande supérieure à 100k GNF'
              },
              {
                icon: Shield,
                title: 'Qualité Garantie',
                description: 'Tous nos fournisseurs sont vérifiés et nos produits sont garantis'
              },
              {
                icon: Phone,
                title: 'Support 24/7',
                description: 'Notre équipe est disponible pour vous aider à tout moment'
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center p-6"
              >
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              FASHOP en Chiffres
            </h2>
            <p className="text-xl text-gray-600">
              La confiance de nos clients guinéens
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="h-10 w-10 text-white" />
                </div>
                <div className="text-3xl font-bold text-primary-600 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Produits Populaires
            </h2>
            <p className="text-xl text-gray-600">
              Découvrez nos meilleures ventes
            </p>
          </div>
          
          {isError ? (
            <div className="text-center py-16">
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Impossible de charger les produits</h3>
              <p className="text-gray-600 mb-6">Vérifiez votre connexion ou réessayez plus tard.</p>
              <button onClick={() => refetch()} className="btn-primary">Réessayer</button>
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="card p-6 animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="card-hover p-6 group"
                >
                  <div className="relative mb-4">
                    <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                      <Package className="h-16 w-16 text-gray-400" />
                    </div>
                    <div className="absolute top-2 right-2">
                      <span className="badge-success">{product.category}</span>
                    </div>
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
                  
                  <p className="text-sm text-gray-600 mb-4">Par {product.supplierName}</p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-2xl font-bold text-primary-600">
                        {formatPriceSimple(product.publicPrice)}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Stock: {product.stock}</div>
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
                </div>
              ))}
            </div>
          )}
          
          <div className="text-center mt-12">
            <Link href="/products" className="btn-outline btn-lg">
              Voir Tous les Produits
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="container-custom text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Prêt à Découvrir FASHOP ?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Rejoignez des milliers de Guinéens qui font confiance à FASHOP pour leurs achats
            </p>
            <Link href="/products" className="btn bg-white text-primary-600 hover:bg-gray-100 btn-lg">
              Commencer Maintenant
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </motion.div>
        </div>
      </section>
    </Layout>
  )
}
