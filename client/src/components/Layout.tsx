import { ReactNode, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { 
  ShoppingCart, 
  Search, 
  Menu, 
  X, 
  User,
  Heart,
  Phone,
  MapPin,
  Trash,
  Plus,
  Minus
} from 'lucide-react'
import { useCartStore } from '@/lib/store'
import { motion, AnimatePresence } from 'framer-motion'
import { formatPrice } from '@/lib/api'

interface LayoutProps {
  children: ReactNode
}

const navigation = [
  { name: 'Accueil', href: '/' },
  { name: 'Produits', href: '/products' },
  { name: 'Catégories', href: '/categories' },
  { name: 'Contact', href: '/contact' },
]

export default function Layout({ children }: LayoutProps) {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const { getTotalItems, items, getTotalPrice, removeItem, updateQuantity } = useCartStore()
  
  const totalItems = getTotalItems()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-primary-600 text-white py-2 text-sm">
        <div className="container-custom flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Phone className="h-3 w-3" />
              <span>+224 610 06 73 80</span>
            </div>
            <div className="hidden sm:flex items-center space-x-1">
              <MapPin className="h-3 w-3" />
              <span>Livraison à Conakry</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-3 guinea-flag rounded-sm"></div>
            <span className="hidden sm:inline">Fait en Guinée</span>
          </div>
        </div>
      </div>

      {/* Main header */}
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-40">
        <div className="container-custom">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">F</span>
              </div>
              <span className="text-xl font-bold text-gradient">FASHOP</span>
            </Link>

            {/* Desktop navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navigation.map((item) => {
                const isActive = router.pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-primary-600'
                        : 'text-gray-700 hover:text-primary-600'
                    }`}
                  >
                    {item.name}
                  </Link>
                )
              })}
            </nav>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              {/* Search */}
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Wishlist */}
              <button className="p-2 text-gray-600 hover:text-primary-600 transition-colors">
                <Heart className="h-5 w-5" />
              </button>

              {/* Cart */}
              <button
                onClick={() => setCartOpen(true)}
                className="relative p-2 text-gray-600 hover:text-primary-600 transition-colors"
              >
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {totalItems}
                  </span>
                )}
              </button>

              {/* Account */}
              <button className="p-2 text-gray-600 hover:text-primary-600 transition-colors">
                <User className="h-5 w-5" />
              </button>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 text-gray-600 hover:text-primary-600 transition-colors"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 right-0 h-full w-80 bg-white shadow-xl z-50 md:hidden"
            >
              <div className="flex items-center justify-between p-4 border-b">
                <span className="text-lg font-semibold">Menu</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-gray-600 hover:text-primary-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="p-4 space-y-4">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="block py-2 text-gray-700 hover:text-primary-600 font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mini cart drawer */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setCartOpen(false)}
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col"
              aria-label="Mini panier"
            >
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center space-x-2">
                  <ShoppingCart className="h-5 w-5 text-primary-600" />
                  <span className="font-semibold">Panier</span>
                  {totalItems > 0 && <span className="text-sm text-gray-500">({totalItems})</span>}
                </div>
                <button onClick={() => setCartOpen(false)} className="p-2 text-gray-600 hover:text-primary-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {items.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center text-gray-500 py-12"
                  >
                    <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">Votre panier est vide</p>
                    <p className="text-sm">Découvrez nos produits et ajoutez-les à votre panier</p>
                  </motion.div>
                ) : (
                  items.map((it, index) => (
                    <motion.div 
                      key={it.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between border rounded-lg p-3 bg-white shadow-sm"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="h-12 w-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center text-primary-600 font-semibold">
                          {it.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{it.name}</div>
                          <div className="text-xs text-gray-500">{it.category} • {it.supplierName}</div>
                          <div className="text-sm font-semibold text-primary-600 mt-1">
                            {formatPrice(it.price)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center border rounded-lg">
                          <button 
                            aria-label="Diminuer quantité" 
                            className="p-2 hover:bg-gray-100 text-gray-600 hover:text-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => updateQuantity(it.id, it.quantity - 1)}
                            disabled={it.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="px-3 py-2 text-sm font-medium min-w-[2rem] text-center">{it.quantity}</span>
                          <button 
                            aria-label="Augmenter quantité" 
                            className="p-2 hover:bg-gray-100 text-gray-600 hover:text-primary-600 transition-colors"
                            onClick={() => updateQuantity(it.id, it.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <button 
                          aria-label="Supprimer du panier" 
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          onClick={() => removeItem(it.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {items.length > 0 && (
                <div className="p-4 border-t space-y-3 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Sous-total ({totalItems} article{totalItems > 1 ? 's' : ''})</span>
                    <span className="font-medium">{formatPrice(getTotalPrice())}</span>
                  </div>
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary-600">{formatPrice(getTotalPrice())}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Link 
                      href="/cart" 
                      onClick={() => setCartOpen(false)} 
                      className="btn-secondary text-center py-3 font-medium"
                    >
                      Voir panier
                    </Link>
                    <Link 
                      href="/checkout" 
                      onClick={() => setCartOpen(false)} 
                      className="btn-primary text-center py-3 font-medium"
                    >
                      Commander
                    </Link>
                  </div>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Search modal */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher des produits..."
                    className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none"
                    autoFocus
                  />
                </div>
                <div className="mt-4 text-sm text-gray-500">
                  Recherchez parmi nos produits de qualité en Guinée
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-16">
        <div className="container-custom py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">F</span>
                </div>
                <span className="text-xl font-bold">FASHOP</span>
              </div>
              <p className="text-gray-400 mb-4">
                La première plateforme e-commerce de dropshipping local en Guinée. 
                Des produits de qualité, livrés rapidement.
              </p>
              <div className="w-12 h-8 guinea-flag rounded"></div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Navigation</h3>
              <ul className="space-y-2">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Link href={item.href} className="text-gray-400 hover:text-white transition-colors">
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Centre d'aide</li>
                <li>Livraison</li>
                <li>Retours</li>
                <li>Conditions d'utilisation</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Contact</h3>
              <div className="space-y-2 text-gray-400">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>+224 610 06 73 80</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>Conakry, Guinée</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 FASHOP. Tous droits réservés. Fait avec ❤️ en Guinée.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
