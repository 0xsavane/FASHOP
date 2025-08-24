import Layout from '@/components/Layout'
import SEO from '@/components/SEO'
import { useCartStore } from '@/lib/store'
import { ordersApi, formatPriceSimple } from '@/lib/api'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/router'

export default function CheckoutPage() {
  const {
    items,
    deliveryAddress,
    setDeliveryAddress,
    paymentMethod,
    setPaymentMethod,
    getTotalPrice,
    clearCart,
  } = useCartStore()

  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState<{ [k: string]: boolean }>({})

  const sanitizePhone = (raw: string) => raw.replace(/\D/g, '')
  
  const isValidPhoneGN = (raw: string) => {
    const digits = sanitizePhone(raw)
    // Numéros guinéens : 9 chiffres commençant par 6 ou 7
    return digits.length === 9 && /^[67]/.test(digits)
  }
  
  const formatPhoneGN = (raw: string) => {
    const d = sanitizePhone(raw).slice(0, 9)
    // Format 3-2-2-2 (e.g., 621 12 34 56)
    const p1 = d.slice(0, 3)
    const p2 = d.slice(3, 5)
    const p3 = d.slice(5, 7)
    const p4 = d.slice(7, 9)
    return [p1, p2, p3, p4].filter(Boolean).join(' ')
  }

  const getPhoneError = (phone: string) => {
    if (!phone) return 'Numéro de téléphone requis'
    const digits = sanitizePhone(phone)
    if (digits.length === 0) return 'Numéro de téléphone requis'
    if (digits.length < 9) return `${9 - digits.length} chiffre${9 - digits.length > 1 ? 's' : ''} manquant${9 - digits.length > 1 ? 's' : ''}`
    if (digits.length > 9) return 'Trop de chiffres (9 maximum)'
    if (!/^[67]/.test(digits)) return 'Numéro guinéen doit commencer par 6 ou 7'
    return null
  }

  const total = getTotalPrice()

  const canSubmit =
    items.length > 0 &&
    deliveryAddress?.fullName &&
    deliveryAddress?.phone && isValidPhoneGN(deliveryAddress.phone) &&
    deliveryAddress?.address &&
    deliveryAddress?.city &&
    deliveryAddress?.commune &&
    paymentMethod

  const submitOrder = async () => {
    if (!canSubmit || !paymentMethod || !deliveryAddress) {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      setTouched({
        fullName: true,
        phone: true,
        address: true,
        city: true,
        commune: true,
        paymentMethod: true
      })
      toast.error('Veuillez corriger les erreurs du formulaire.')
      return
    }
    setLoading(true)
    try {
      const payload = {
        customerEmail: 'client@example.com',
        customerPhone: deliveryAddress.phone,
        deliveryAddress: {
          fullName: deliveryAddress.fullName,
          phone: deliveryAddress.phone,
          address: deliveryAddress.address,
          city: deliveryAddress.city,
          commune: deliveryAddress.commune,
          landmark: deliveryAddress.landmark,
        },
        items: items.map((it) => ({ productId: it.id, quantity: it.quantity, price: it.price })),
        paymentMethod: paymentMethod,
        total,
      } as const

      const res = await ordersApi.create(payload)
      const order = res.data.data.order

      // Stocker le workflow pour la page de succès
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('fashop_last_order_workflow', JSON.stringify(order.workflow || []))
      }

      clearCart()
      toast.success('Commande créée avec succès')
      router.push(`/order-success?orderNumber=${encodeURIComponent(order.orderNumber)}`)
    } catch (e) {
      toast.error("Erreur lors de la création de la commande")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <SEO 
        title="Paiement - Finaliser votre commande"
        description="Finalisez votre commande en toute sécurité. Livraison rapide en Guinée avec paiement Orange Money ou carte bancaire."
        keywords="paiement, commande, livraison, Orange Money, carte bancaire, sécurisé, Guinée"
        url="/checkout"
        noindex={true}
      />
      <div className="bg-white py-8">
        <div className="container-custom">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Paiement</h1>

          {items.length === 0 ? (
            <div className="text-center py-16 text-gray-600">Votre panier est vide.</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="card p-6">
                  <h3 className="text-lg font-semibold mb-4">Adresse de livraison</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      className="input"
                      placeholder="Nom complet"
                      value={deliveryAddress?.fullName || ''}
                      onBlur={() => setTouched((t) => ({ ...t, fullName: true }))}
                      onChange={(e) => setDeliveryAddress({ ...(deliveryAddress || { fullName: '', phone: '', address: '', city: '', commune: '' }), fullName: e.target.value })}
                    />
                    {touched.fullName && !(deliveryAddress?.fullName && deliveryAddress.fullName.trim().length >= 2) && (
                      <div className="md:col-span-2 text-sm text-red-600">Nom complet requis (min 2 caractères)</div>
                    )}
                    <input
                      className="input"
                      placeholder="Téléphone"
                      value={deliveryAddress?.phone || ''}
                      onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                      onChange={(e) => setDeliveryAddress({ ...(deliveryAddress || { fullName: '', phone: '', address: '', city: '', commune: '' }), phone: formatPhoneGN(e.target.value) })}
                    />
                    {touched.phone && getPhoneError(deliveryAddress?.phone || '') && (
                      <div className="md:col-span-2 text-sm text-red-600">{getPhoneError(deliveryAddress?.phone || '')}</div>
                    )}
                    <input
                      className="input md:col-span-2"
                      placeholder="Adresse"
                      value={deliveryAddress?.address || ''}
                      onBlur={() => setTouched((t) => ({ ...t, address: true }))}
                      onChange={(e) => setDeliveryAddress({ ...(deliveryAddress || { fullName: '', phone: '', address: '', city: '', commune: '' }), address: e.target.value })}
                    />
                    {touched.address && !(deliveryAddress?.address && deliveryAddress.address.trim().length >= 5) && (
                      <div className="md:col-span-2 text-sm text-red-600">Adresse requise (min 5 caractères)</div>
                    )}
                    <input
                      className="input"
                      placeholder="Ville"
                      value={deliveryAddress?.city || ''}
                      onBlur={() => setTouched((t) => ({ ...t, city: true }))}
                      onChange={(e) => setDeliveryAddress({ ...(deliveryAddress || { fullName: '', phone: '', address: '', city: '', commune: '' }), city: e.target.value })}
                    />
                    {touched.city && !deliveryAddress?.city && (
                      <div className="md:col-span-2 text-sm text-red-600">Ville requise</div>
                    )}
                    <input
                      className="input"
                      placeholder="Commune"
                      value={deliveryAddress?.commune || ''}
                      onBlur={() => setTouched((t) => ({ ...t, commune: true }))}
                      onChange={(e) => setDeliveryAddress({ ...(deliveryAddress || { fullName: '', phone: '', address: '', city: '', commune: '' }), commune: e.target.value })}
                    />
                    {touched.commune && !deliveryAddress?.commune && (
                      <div className="md:col-span-2 text-sm text-red-600">Commune requise</div>
                    )}
                    <input
                      className="input md:col-span-2"
                      placeholder="Point de repère (optionnel)"
                      value={deliveryAddress?.landmark || ''}
                      onChange={(e) => setDeliveryAddress({ ...(deliveryAddress || { fullName: '', phone: '', address: '', city: '', commune: '' }), landmark: e.target.value })}
                    />
                  </div>
                </div>

                <div className="card p-6">
                  <h3 className="text-lg font-semibold mb-4">Méthode de paiement</h3>
                  <div className="space-y-3">
                    <label className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer ${paymentMethod === 'orange_money' ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}>
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'orange_money'}
                        onChange={() => setPaymentMethod('orange_money')}
                      />
                      <span>Orange Money (simulation)</span>
                    </label>
                    <label className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer ${paymentMethod === 'card' ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}>
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'card'}
                        onChange={() => setPaymentMethod('card')}
                      />
                      <span>Carte bancaire (Stripe test)</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="card p-6 h-fit">
                <h3 className="text-lg font-semibold mb-4">Récapitulatif</h3>
                <div className="space-y-2 text-sm">
                  {items.map((it) => (
                    <div key={it.id} className="flex items-center justify-between">
                      <span className="text-gray-600">{it.name} × {it.quantity}</span>
                      <span className="font-medium">{formatPriceSimple(it.price * it.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t my-4" />
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">Total</span>
                  <span className="text-xl font-bold text-primary-600">{formatPriceSimple(total)}</span>
                </div>
                {!canSubmit && (
                  <div className="text-sm text-red-600 mb-2">Veuillez compléter les champs requis avant de confirmer.</div>
                )}
                <button
                  onClick={submitOrder}
                  disabled={!canSubmit || loading}
                  className={`btn-primary w-full ${!canSubmit || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Traitement...' : 'Confirmer la commande'}
                </button>
                <div className="text-xs text-gray-500 mt-2">Vous serez redirigé vers la confirmation.</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
