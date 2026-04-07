import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { servicesApi } from '../../api/services'
import { useUIStore } from '../../store/uiStore'
import { getApiError, fmt } from '../../utils/helpers'
import Spinner from '../../components/ui/Spinner'
import SuccessModal from '../../components/modals/SuccessModal'

const NETS = [
  { id: 'mtn',     label: 'MTN',     cls: 'net-mtn',    emoji: '🟡' },
  { id: 'airtel',  label: 'Airtel',  cls: 'net-airtel', emoji: '🔴' },
  { id: 'glo',     label: 'Glo',     cls: 'net-glo',    emoji: '🟢' },
  { id: '9mobile', label: '9mobile', cls: 'net-9mobile', emoji: '🔵' },
]
const QUICK = [50, 100, 200, 500, 1000, 2000, 5000]

export default function AirtimePage() {
  const [net, setNet]     = useState('mtn')
  const [phone, setPhone] = useState('')
  const [amount, setAmount] = useState('')
  const [success, setSuccess] = useState(null)
  const { openPinModal } = useUIStore()
  const qc = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: (pin) => servicesApi.buyAirtime({ network: net, phone, amount: Number(amount), transaction_pin: pin }),
    onSuccess: (res) => {
      setSuccess({ ...res.data.transaction, message: res.data.message, amount })
      setPhone(''); setAmount('')
      qc.invalidateQueries(['dashboard'])
      toast.success(res.data.message)
    },
    onError: (err) => toast.error(getApiError(err)),
  })

  const handle = () => {
    if (!phone || phone.length !== 11) { toast.error('Enter a valid 11-digit phone number'); return }
    if (!amount || Number(amount) < 50) { toast.error('Minimum airtime is ₦50'); return }
    openPinModal((pin) => mutate(pin), 'Confirm Airtime Purchase')
  }

  const curNet = NETS.find((n) => n.id === net)

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-black mb-1">📞 Airtime</h1>
      <p className="text-gray-500 text-sm mb-6">Top up any Nigerian number instantly</p>

      <div className="card p-6 space-y-5">
        {/* Network */}
        <div>
          <label className="label">Select Network</label>
          <div className="grid grid-cols-4 gap-2">
            {NETS.map((n) => (
              <button key={n.id} onClick={() => setNet(n.id)}
                className={`flex flex-col items-center py-3 rounded-xl border-2 text-xs font-bold transition-all ${
                  net === n.id ? n.cls : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'
                }`}>
                <span className="text-xl mb-1">{n.emoji}</span>
                {n.label}
              </button>
            ))}
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="label">Phone Number *</label>
          <input className="input" type="tel" placeholder="08012345678" maxLength={11}
            value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>

        {/* Amount */}
        <div>
          <label className="label">Amount (₦) *</label>
          <input className="input" type="number" placeholder="Enter amount (min ₦50)"
            value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>

        {/* Quick amounts */}
        <div>
          <label className="label">Quick Select</label>
          <div className="flex gap-2 flex-wrap">
            {QUICK.map((a) => (
              <button key={a} onClick={() => setAmount(String(a))}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${
                  amount === String(a)
                    ? 'bg-orange-50 border-orange-400 text-orange-600'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-orange-300'
                }`}>
                {fmt(a)}
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        {phone && amount && (
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Network</span><span className="font-bold">{curNet?.label}</span></div>
            <div className="flex justify-between text-sm mt-1"><span className="text-gray-500">Phone</span><span className="font-bold font-mono">{phone}</span></div>
            <div className="flex justify-between text-sm mt-1"><span className="text-gray-500">Amount</span><span className="font-black text-orange-500">{fmt(amount)}</span></div>
          </div>
        )}

        <button onClick={handle} disabled={isPending} className="btn-primary">
          {isPending ? <Spinner /> : `📞 Buy ${curNet?.label} Airtime`}
        </button>
        <button className="btn-ghost w-full justify-center text-xs">⏰ Schedule instead</button>
      </div>

      <SuccessModal open={!!success} onClose={() => setSuccess(null)} transaction={success} />
    </div>
  )
}
