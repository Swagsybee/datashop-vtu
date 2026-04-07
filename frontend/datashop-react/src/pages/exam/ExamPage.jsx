import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { servicesApi } from '../../api/services'
import { useUIStore } from '../../store/uiStore'
import { getApiError, fmt } from '../../utils/helpers'
import Spinner from '../../components/ui/Spinner'
import SuccessModal from '../../components/modals/SuccessModal'

const BODIES = [
  { id: 'waec',   label: 'WAEC',   icon: '🎓', desc: 'Result checker & registration' },
  { id: 'jamb',   label: 'JAMB',   icon: '📚', desc: 'UTME e-PIN purchase' },
  { id: 'neco',   label: 'NECO',   icon: '📖', desc: 'Result checker tokens' },
  { id: 'nabteb', label: 'NABTEB', icon: '🏫', desc: 'Business & Technical exams' },
]

export default function ExamPage() {
  const [body, setBody]       = useState('')
  const [productId, setProductId] = useState('')
  const [phone, setPhone]     = useState('')
  const [email, setEmail]     = useState('')
  const [qty, setQty]         = useState(1)
  const [success, setSuccess] = useState(null)
  const { openPinModal } = useUIStore()
  const qc = useQueryClient()

  const { data: products, isLoading } = useQuery({
    queryKey: ['exam-products', body],
    queryFn: () => servicesApi.examProducts({ body }).then((r) => r.data.results || r.data),
    enabled: !!body,
  })

  const curProduct = products?.find((p) => String(p.id) === productId)

  const { mutate, isPending } = useMutation({
    mutationFn: (pin) => servicesApi.buyExam({
      product_id: Number(productId), phone, email, quantity: qty, transaction_pin: pin,
    }),
    onSuccess: (res) => {
      setSuccess({ ...res.data.transaction, message: res.data.message, pins: res.data.pins, amount: curProduct?.sell_price })
      setPhone(''); setEmail(''); setProductId('')
      qc.invalidateQueries(['dashboard'])
    },
    onError: (err) => toast.error(getApiError(err)),
  })

  const handle = () => {
    if (!productId) { toast.error('Select a product'); return }
    if (!email || !email.includes('@')) { toast.error('Enter a valid email'); return }
    if (!phone || phone.length !== 11) { toast.error('Enter a valid phone number'); return }
    openPinModal((pin) => mutate(pin), 'Confirm Exam Pin Purchase')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-black mb-1">📝 Exam Pins</h1>
      <p className="text-gray-500 text-sm mb-6">WAEC, JAMB, NECO and NABTEB</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {BODIES.map((b) => (
          <button key={b.id} onClick={() => { setBody(b.id); setProductId('') }}
            className={`card p-4 text-center border-2 transition-all hover:-translate-y-0.5 ${
              body === b.id ? 'border-orange-400 bg-orange-50' : 'border-transparent hover:border-orange-200'
            }`}>
            <div className="text-3xl mb-2">{b.icon}</div>
            <p className="font-black text-sm">{b.label}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{b.desc}</p>
          </button>
        ))}
      </div>

      <div className="card p-6 space-y-5">
        <div>
          <label className="label">Product / Pin Type *</label>
          {isLoading ? <div className="flex justify-center py-6"><Spinner dark /></div> : (
            <div className="space-y-2">
              {products?.map((p) => (
                <button key={p.id} onClick={() => setProductId(String(p.id))}
                  className={`w-full flex justify-between items-center p-3 rounded-xl border-2 text-sm transition-all ${
                    productId === String(p.id) ? 'bg-orange-50 border-orange-400' : 'bg-gray-50 border-gray-200 hover:border-orange-300'
                  }`}>
                  <span className="font-semibold text-gray-800">{p.name}</span>
                  <span className="font-black text-orange-500 font-mono">{fmt(p.sell_price)}</span>
                </button>
              ))}
              {body && products?.length === 0 && <p className="text-gray-400 text-sm text-center py-4">No products available.</p>}
              {!body && <p className="text-gray-400 text-sm text-center py-4">Select an exam body above.</p>}
            </div>
          )}
        </div>

        <div>
          <label className="label">Quantity</label>
          <input className="input" type="number" min={1} max={10} value={qty}
            onChange={(e) => setQty(Number(e.target.value))} />
        </div>
        <div>
          <label className="label">Email Address (pin delivery) *</label>
          <input className="input" type="email" placeholder="email@example.com"
            value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label">Phone Number *</label>
          <input className="input" type="tel" placeholder="08012345678" maxLength={11}
            value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>

        {curProduct && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex justify-between">
            <div>
              <p className="text-xs text-gray-500">Total Amount</p>
              <p className="font-black text-orange-500 text-xl font-mono">{fmt(Number(curProduct.sell_price) * qty)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Quantity</p>
              <p className="font-black text-gray-800 text-xl">{qty}</p>
            </div>
          </div>
        )}

        <button onClick={handle} disabled={isPending || !body} className="btn-primary">
          {isPending ? <Spinner /> : '📝 Get Exam Pin'}
        </button>
      </div>

      <SuccessModal open={!!success} onClose={() => setSuccess(null)} transaction={success} />
    </div>
  )
}
