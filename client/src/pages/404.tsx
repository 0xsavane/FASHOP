import Layout from '@/components/Layout'
import SEO from '@/components/SEO'
import Link from 'next/link'
import { Home, Search, Package, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Custom404() {
  return (
    <Layout>
      <SEO 
        title="Page non trouvée - 404"
        description="La page que vous recherchez n'existe pas ou a été déplacée."
        noindex={true}
      />
      
      <div className="bg-white py-16">
        <div className="container-custom text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Illustration 404 */}
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full mb-6">
                <span className="text-4xl font-bold text-primary-600">404</span>
              </div>
            </div>
            
            {/* Titre et description */}
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Page non trouvée
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Désolé, la page que vous recherchez n'existe pas ou a été déplacée. 
              Explorez nos produits ou retournez à l'accueil.
            </p>
            
            {/* Actions suggérées */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="card p-6 text-center hover:shadow-lg transition-shadow"
              >
                <Home className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Accueil</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Découvrez nos produits vedettes et offres spéciales
                </p>
                <Link href="/" className="btn-primary">
                  Aller à l'accueil
                </Link>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="card p-6 text-center hover:shadow-lg transition-shadow"
              >
                <Package className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Produits</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Parcourez notre catalogue complet de produits
                </p>
                <Link href="/products" className="btn-primary">
                  Voir les produits
                </Link>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="card p-6 text-center hover:shadow-lg transition-shadow"
              >
                <Search className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Catégories</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Explorez nos produits par catégorie
                </p>
                <Link href="/categories" className="btn-primary">
                  Voir les catégories
                </Link>
              </motion.div>
            </div>
            
            {/* Bouton retour */}
            <motion.button
              onClick={() => window.history.back()}
              whileHover={{ scale: 1.05 }}
              className="btn-secondary inline-flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Retour à la page précédente</span>
            </motion.button>
            
            {/* Message d'aide */}
            <div className="mt-12 p-6 bg-gray-50 rounded-lg max-w-2xl mx-auto">
              <h3 className="font-semibold text-gray-900 mb-2">Besoin d'aide ?</h3>
              <p className="text-gray-600 mb-4">
                Si vous pensez qu'il s'agit d'une erreur ou si vous avez besoin d'assistance, 
                n'hésitez pas à nous contacter.
              </p>
              <div className="flex items-center justify-center space-x-4 text-sm">
                <a href="tel:+22461006738" className="text-primary-600 hover:text-primary-700">
                  📞 +224 610 06 73 80
                </a>
                <span className="text-gray-400">•</span>
                <Link href="/contact" className="text-primary-600 hover:text-primary-700">
                  💬 Nous contacter
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  )
}
