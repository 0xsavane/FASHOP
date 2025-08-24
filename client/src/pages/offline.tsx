import { Wifi, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'

export default function OfflinePage() {
  const router = useRouter()
  const [isRetrying, setIsRetrying] = useState(false)

  const handleRetry = async () => {
    setIsRetrying(true)
    
    // Check if we're back online
    if (navigator.onLine) {
      try {
        // Test connectivity with a simple fetch
        await fetch('/api/v1/health', { 
          method: 'HEAD',
          cache: 'no-cache'
        })
        
        // If successful, navigate back to home
        router.push('/')
      } catch (error) {
        // Still offline or server issues
        setTimeout(() => setIsRetrying(false), 1000)
      }
    } else {
      setTimeout(() => setIsRetrying(false), 1000)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
            <Wifi className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Vous êtes hors ligne
          </h1>
          <p className="text-gray-600 mb-8">
            Vérifiez votre connexion internet et réessayez
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Que pouvez-vous faire ?
              </h2>
              
              <div className="space-y-3 text-left">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                  <p className="text-sm text-gray-600">
                    Consultez les produits déjà chargés dans votre cache
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                  <p className="text-sm text-gray-600">
                    Vos articles dans le panier sont sauvegardés localement
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                  <p className="text-sm text-gray-600">
                    Les commandes seront synchronisées une fois reconnecté
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                  Reconnexion...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Réessayer
                </>
              )}
            </button>

            <div className="text-center">
              <button
                onClick={() => router.push('/')}
                className="text-sm text-primary-600 hover:text-primary-500"
              >
                Retour à l'accueil (mode hors ligne)
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            FASHOP fonctionne même hors ligne grâce à la technologie PWA
          </p>
        </div>
      </div>
    </div>
  )
}
