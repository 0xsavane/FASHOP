// CinetPay API Integration for FASHOP
// Documentation: https://docs.cinetpay.com/

interface CinetPayConfig {
  apikey: string
  site_id: string
  notify_url: string
  return_url: string
  cancel_url: string
  mode: 'PRODUCTION' | 'TEST'
}

interface CinetPayPaymentData {
  transaction_id: string
  amount: number
  currency: 'GNF' | 'USD' | 'EUR'
  description: string
  customer_name: string
  customer_surname: string
  customer_email: string
  customer_phone_number: string
  customer_address: string
  customer_city: string
  customer_country: string
  customer_state: string
  customer_zip_code: string
}

interface CinetPayResponse {
  code: string
  message: string
  description: string
  data: {
    payment_method: string
    payment_url: string
    payment_token: string
  }
}

export class CinetPayService {
  private config: CinetPayConfig

  constructor(config: CinetPayConfig) {
    this.config = config
  }

  async initializePayment(paymentData: CinetPayPaymentData): Promise<CinetPayResponse> {
    const endpoint = this.config.mode === 'TEST' 
      ? 'https://api-checkout.cinetpay.com/v2/payment'
      : 'https://api-checkout.cinetpay.com/v2/payment'

    const payload = {
      apikey: this.config.apikey,
      site_id: this.config.site_id,
      transaction_id: paymentData.transaction_id,
      amount: paymentData.amount,
      currency: paymentData.currency,
      description: paymentData.description,
      notify_url: this.config.notify_url,
      return_url: this.config.return_url,
      cancel_url: this.config.cancel_url,
      customer_name: paymentData.customer_name,
      customer_surname: paymentData.customer_surname,
      customer_email: paymentData.customer_email,
      customer_phone_number: paymentData.customer_phone_number,
      customer_address: paymentData.customer_address,
      customer_city: paymentData.customer_city,
      customer_country: paymentData.customer_country,
      customer_state: paymentData.customer_state,
      customer_zip_code: paymentData.customer_zip_code,
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: CinetPayResponse = await response.json()
      return result
    } catch (error) {
      console.error('CinetPay payment initialization failed:', error)
      throw new Error('Erreur lors de l\'initialisation du paiement')
    }
  }

  async checkPaymentStatus(transactionId: string): Promise<any> {
    const endpoint = this.config.mode === 'TEST'
      ? 'https://api-checkout.cinetpay.com/v2/payment/check'
      : 'https://api-checkout.cinetpay.com/v2/payment/check'

    const payload = {
      apikey: this.config.apikey,
      site_id: this.config.site_id,
      transaction_id: transactionId,
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('CinetPay status check failed:', error)
      throw new Error('Erreur lors de la vérification du statut de paiement')
    }
  }

  generateTransactionId(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 15)
    return `FASHOP_${timestamp}_${random}`
  }
}

// Sandbox configuration for testing
export const cinetPayTestConfig: CinetPayConfig = {
  apikey: process.env.NEXT_PUBLIC_CINETPAY_API_KEY || 'test_api_key',
  site_id: process.env.NEXT_PUBLIC_CINETPAY_SITE_ID || 'test_site_id',
  notify_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/cinetpay/notify`,
  return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success`,
  cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/cancel`,
  mode: 'TEST'
}

// Production configuration
export const cinetPayProdConfig: CinetPayConfig = {
  apikey: process.env.CINETPAY_API_KEY || '',
  site_id: process.env.CINETPAY_SITE_ID || '',
  notify_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/cinetpay/notify`,
  return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success`,
  cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/cancel`,
  mode: 'PRODUCTION'
}

// Initialize service based on environment
export const cinetPayService = new CinetPayService(
  process.env.NODE_ENV === 'production' ? cinetPayProdConfig : cinetPayTestConfig
)
