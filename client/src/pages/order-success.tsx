import Layout from '@/components/Layout'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { CheckCircle2 } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function OrderSuccessPage() {
  const router = useRouter()
  const { orderNumber } = router.query
  const [workflow, setWorkflow] = useState<string[]>([])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const data = sessionStorage.getItem('fashop_last_order_workflow')
      if (data) {
        try { setWorkflow(JSON.parse(data)) } catch {}
        sessionStorage.removeItem('fashop_last_order_workflow')
      }
    }
  }, [])

  return (
    <Layout>
      <div className="bg-white py-12">
        <div className="container-custom max-w-2xl">
          <div className="text-center mb-8">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Commande Confirmée</h1>
            <p className="text-gray-600">Merci pour votre achat !</p>
          </div>

          <div className="card p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="text-gray-600">Numéro de commande</div>
              <div className="font-semibold">{orderNumber}</div>
            </div>
          </div>

          {workflow.length > 0 && (
            <div className="card p-6 mb-6">
              <h3 className="text-lg font-semibold mb-3">Workflow FASHOP</h3>
              <ol className="list-decimal ml-5 space-y-1 text-gray-700">
                {workflow.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ol>
            </div>
          )}

          <div className="text-center">
            <Link href="/products" className="btn-primary">Continuer vos achats</Link>
          </div>
        </div>
      </div>
    </Layout>
  )
}
