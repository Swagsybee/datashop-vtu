import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { servicesApi } from '../../api/services'
import { useUIStore } from '../../store/uiStore'
import { getApiError, fmt } from '../../utils/helpers'
import Spinner from '../../components/ui/Spinner'
import SuccessModal from '../../components/modals/SuccessModal'

export default function TVPage() {
  const [providerId, setProviderId] = useState('')
  const [planId, setPlanId]         = useState('')
  const [smartcard, setSmartcard]   = useState('')
  const [phone, setPhone]           = useState('')
  const [verified, setVerified]     = useState(null)
  const [success, setSuccess]       = useState(null)
  const { openPinModal } = useUIStore()
  const qc = useQueryClient()

  const { data: providers, isLoading } = useQuery({
    queryKey: ['tv-providers'],
    queryFn: () => servicesApi.tvProviders().then((r) => r.data.results || r.data),
  })

  const curProvider = providers?.find((p) => String(p.id) === providerId)
  const curPlan = curProvider?.plans?.find((p) => String(p.id) === planId)

  const { mutate: verify, isPending: verifying } = useMutation({
    mutationFn: () => servicesApi.verifySmartcard({ provider_id: Number(providerId), smartcard_number: smartcard }),
    onSuccess: (res) => {
      if (res.data.valid) { setVerified(res.data); toast.success(`Verified: ${res.data.customer_name}`) }
      else { toast.error(res.data.message || 'Invalid smartcard'); setVerified(null) }
    },
    onError: (err) => toast.error(getApiError(err)),
  })

  const { mutate: buy, isPending } = useMutation({
    mutationFn: (pin) => servicesApi.buyTV({ plan_id: Number(planId), smartcard_number: smartcard, phone, transaction_pin: pin }),
    onSuccess: (res) => {
      setSuccess({ ...res.data.transaction, message: res.data.message, amount: curPlan?.sell_price })
      setSmartcard(''); setPlanId(''); setVerified(null)
      qc.invalidateQueries(['dashboard'])
    },
    onError: (err) => toast.error(getApiError(err)),
  })

  const handle = () => {
    if (!providerId) { toast.error('Select a TV provider'); return }
    if (!smartcard)  { toast.error('Enter smartcard number'); return }
    if (!planId)     { toast.error('Select a subscription plan'); return }
    if (!phone || phone.length !== 11) { toast.error('Enter a valid phone number'); return }
    openPinModal((pin) => buy(pin), 'Confirm TV Subscription')
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-black mb-1">📺 TV Subscription</h1>
      <p className="text-gray-500 text-sm mb-6">DStv, GOtv, Startimes, Showmax</p>

      <div className="card p-6 space-y-5">
        {/* Provider logos */}
        {isLoading ? <div className="flex justify-center py-8"><Spinner dark /></div> : (
          <div>
            <label className="label">TV Provider *</label>
            <div className="grid grid-cols-2 gap-2">
              {providers?.map((p) => (
                <button key={p.id} onClick={() => { setProviderId(String(p.id)); setPlanId(''); setVerified(null) }}
                  className={`py-3 px-4 rounded-xl border-2 text-sm font-bold transition-all ${
                    providerId === String(p.id) ? 'bg-orange-50 border-orange-400 text-orange-600' : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-orange-300'
                  }`}>
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="label">Smart Card / IUC Number *</label>
          <div className="flex gap-2">
            <input className="input flex-1" placeholder="Enter smartcard number"
              value={smartcard} onChange={(e) => { setSmartcard(e.target.value); setVerified(null) }} />
            <button onClick={() => verify()} disabled={verifying || !providerId || !smartcard}
              className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold hover:bg-orange-50 hover:text-orange-600 transition-colors whitespace-nowrap disabled:opacity-50">
              {verifying ? <Spinner dark size="sm" /> : '🔍 Verify'}
            </button>
          </div>
        </div>

        {verified && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-green-600 mb-1">✅ Card Verified</p>
            <p className="font-black text-gray-800">{verified.customer_name}</p>
            {verified.current_bouquet && <p className="text-xs text-gray-500 mt-1">Current: {verified.current_bouquet}</p>}
          </div>
        )}

        {providerId && (
          <div>
            <label className="label">Subscription Plan *</label>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {curProvider?.plans?.filter((p) => p.is_active).map((p) => (
                <button key={p.id} onClick={() => setPlanId(String(p.id))}
                  className={`w-full flex justify-between items-center p-3 rounded-xl border-2 text-sm transition-all ${
                    planId === String(p.id) ? 'bg-orange-50 border-orange-400' : 'bg-gray-50 border-gray-200 hover:border-orange-300'
                  }`}>
                  <span className="font-semibold text-gray-800">{p.name}</span>
                  <span className="font-black text-orange-500 font-mono">{fmt(p.sell_price)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="label">Phone Number *</label>
          <input className="input" type="tel" placeholder="08012345678" maxLength={11}
            value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>

        <button onClick={handle} disabled={isPending} className="btn-primary">
          {isPending ? <Spinner /> : '📺 Subscribe Now'}
        </button>
      </div>

      <SuccessModal open={!!success} onClose={() => setSuccess(null)} transaction={success} />
    </div>
  )
}
