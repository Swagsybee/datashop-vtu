import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { servicesApi } from '../../api/services'
import { useUIStore } from '../../store/uiStore'
import { getApiError, fmt } from '../../utils/helpers'
import Spinner from '../../components/ui/Spinner'
import SuccessModal from '../../components/modals/SuccessModal'

const QUICK = [1000, 2000, 3000, 5000, 10000]

export default function ElectricityPage() {
  const [discoId, setDiscoId]   = useState('')
  const [meter, setMeter]       = useState('')
  const [mType, setMType]       = useState('prepaid')
  const [amount, setAmount]     = useState('')
  const [phone, setPhone]       = useState('')
  const [verified, setVerified] = useState(null)
  const [success, setSuccess]   = useState(null)
  const { openPinModal } = useUIStore()
  const qc = useQueryClient()

  const { data: discos, isLoading: loadingDiscos } = useQuery({
    queryKey: ['discos'],
    queryFn: () => servicesApi.discos().then((r) => r.data.results || r.data),
  })

  const { mutate: verifyMeter, isPending: verifying } = useMutation({
    mutationFn: () => servicesApi.verifyMeter({ disco_id: Number(discoId), meter_number: meter, meter_type: mType }),
    onSuccess: (res) => {
      if (res.data.valid) {
        setVerified(res.data)
        toast.success(`Meter verified: ${res.data.customer_name}`)
      } else {
        toast.error(res.data.message || 'Invalid meter number')
        setVerified(null)
      }
    },
    onError: (err) => toast.error(getApiError(err)),
  })

  const { mutate: buyToken, isPending } = useMutation({
    mutationFn: (pin) => servicesApi.buyElectricity({
      disco_id: Number(discoId), meter_number: meter,
      meter_type: mType, amount: Number(amount), phone, transaction_pin: pin,
    }),
    onSuccess: (res) => {
      setSuccess({ ...res.data.transaction, message: res.data.message, token: res.data.token, amount })
      setMeter(''); setAmount(''); setVerified(null)
      qc.invalidateQueries(['dashboard'])
    },
    onError: (err) => toast.error(getApiError(err)),
  })

  const handleBuy = () => {
    if (!discoId) { toast.error('Select a DISCO'); return }
    if (!meter)   { toast.error('Enter meter number'); return }
    if (!verified){ toast.error('Verify meter first'); return }
    if (!amount || Number(amount) < 1000) { toast.error('Minimum is ₦1,000'); return }
    if (!phone || phone.length !== 11) { toast.error('Enter a valid phone number'); return }
    openPinModal((pin) => buyToken(pin), 'Confirm Electricity Purchase')
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-black mb-1">⚡ Electricity</h1>
      <p className="text-gray-500 text-sm mb-6">Buy prepaid or postpaid electricity tokens</p>

      <div className="card p-6 space-y-5">
        <div>
          <label className="label">Distribution Company (DISCO) *</label>
          <select className="input" value={discoId} onChange={(e) => { setDiscoId(e.target.value); setVerified(null) }}>
            <option value="">— Select DISCO —</option>
            {loadingDiscos ? <option>Loading...</option> : discos?.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Meter Type</label>
            <select className="input" value={mType} onChange={(e) => { setMType(e.target.value); setVerified(null) }}>
              <option value="prepaid">Prepaid</option>
              <option value="postpaid">Postpaid</option>
            </select>
          </div>
          <div>
            <label className="label">Meter Number *</label>
            <input className="input" placeholder="Enter meter no." value={meter}
              onChange={(e) => { setMeter(e.target.value); setVerified(null) }} />
          </div>
        </div>

        <button onClick={() => verifyMeter()} disabled={verifying || !discoId || !meter}
          className="btn-secondary">
          {verifying ? <><Spinner dark />Verifying...</> : '🔍 Verify Meter'}
        </button>

        {verified && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-green-600 mb-1">✅ Meter Verified</p>
            <p className="font-black text-gray-800">{verified.customer_name}</p>
            {verified.address && <p className="text-xs text-gray-500 mt-1">{verified.address}</p>}
          </div>
        )}

        <div>
          <label className="label">Amount (₦) *</label>
          <input className="input" type="number" placeholder="Min ₦1,000"
            value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {QUICK.map((a) => (
            <button key={a} onClick={() => setAmount(String(a))}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${
                amount === String(a) ? 'bg-orange-50 border-orange-400 text-orange-600' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-orange-300'
              }`}>
              {fmt(a)}
            </button>
          ))}
        </div>

        <div>
          <label className="label">Phone Number (for receipt) *</label>
          <input className="input" type="tel" placeholder="08012345678" maxLength={11}
            value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>

        <button onClick={handleBuy} disabled={isPending || !verified} className="btn-primary">
          {isPending ? <Spinner /> : '⚡ Vend Token'}
        </button>
      </div>

      {success && (
        <div className="card p-5 mt-4 border-green-200 bg-green-50">
          <p className="font-black text-green-700 mb-1">✅ Token Purchased!</p>
          {success.token && (
            <div className="bg-white rounded-lg p-3 mt-2 font-mono text-center text-lg font-black tracking-widest border border-green-200">
              {success.token}
            </div>
          )}
          <p className="text-xs text-gray-500 text-center mt-2">Enter this token in your meter</p>
        </div>
      )}
      <SuccessModal open={!!success && !success.token} onClose={() => setSuccess(null)} transaction={success} />
    </div>
  )
}
