import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { CheckCircle, Package, ArrowRight, X } from 'lucide-react'
import { cinetPayService } from '@/lib/cinetpay'

export default function PaymentSuccess() {
  const router = useRouter()
  const { transaction_id, token } = router.query
  const [paymentStatus, setPaymentStatus] = useState<'loading' | 'success' | 'failed'>('loading')
  const [orderDetails, setOrderDetails] = useState<any>(null)

  useEffect(() => {
    if (transaction_id && typeof transaction_id === 'string') {
      verifyPayment(transaction_id)
    }
  }, [transaction_id])

  const verifyPayment = async (transactionId: string) => {
    try {
      const status = await cinetPayService.checkPaymentStatus(transactionId)
      
      if (status.code === '00' && status.message === 'SUCCES') {
        setPaymentStatus('success')
        setOrderDetails(status.data)
        
        // Update order status in backend
        await fetch('/api/v1/orders/payment-confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transactionId,
            paymentData: status.data
          })
        })
      } else {
        setPaymentStatus('failed')
      }
    } catch (error) {
      console.error('Payment verification failed:', error)
      setPaymentStatus('failed')
    }
  }

  if (paymentStatus === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Vérification du paiement...</p>
        </div>
      </div>
    )
  }

  if (paymentStatus === 'failed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Paiement échoué
            </h1>
            <p className="text-gray-600 mb-6">
              Une erreur s'est produite lors du traitement de votre paiement.
            </p>
            <button
              onClick={() => router.push('/cart')}
              className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Retour au panier
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Success Header */}
          <div className="bg-green-50 px-6 py-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Paiement réussi !
            </h1>
            <p className="text-lg text-gray-600">
              Votre commande a été confirmée et sera traitée sous peu.
            </p>
          </div>

          {/* Order Details */}
          <div className="px-6 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Détails de la transaction
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction ID:</span>
                    <span className="font-medium">{transaction_id}</span>
                  </div>
                  {orderDetails && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Montant:</span>
                        <span className="font-medium">{orderDetails.amount} GNF</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Méthode:</span>
                        <span className="font-medium">{orderDetails.payment_method}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Prochaines étapes
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-medium text-primary-600">1</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Notification envoyée aux fournisseurs
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-medium text-primary-600">2</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Préparation de votre commande
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-medium text-primary-600">3</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Livraison à votre adresse
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => router.push('/orders')}
                className="flex-1 bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center"
              >
                <Package className="h-5 w-5 mr-2" />
                Suivre ma commande
              </button>
              <button
                onClick={() => router.push('/')}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
              >
                Continuer mes achats
                <ArrowRight className="h-5 w-5 ml-2" />
              </button>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Besoin d'aide ?
          </h3>
          <p className="text-blue-700 text-sm mb-4">
            Notre équipe est disponible pour vous accompagner tout au long du processus.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 text-sm">
            <span className="text-blue-600">📱 WhatsApp: +224 XXX XXX XXX</span>
            <span className="text-blue-600">📧 Email: support@fashop.gn</span>
          </div>
        </div>
      </div>
    </div>
  )
}
