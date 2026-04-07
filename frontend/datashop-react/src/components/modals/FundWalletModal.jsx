import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useUIStore } from '../../store/uiStore'
import { walletApi } from '../../api/wallet'
import { useAuthStore } from '../../store/authStore'
import { getApiError, fmt } from '../../utils/helpers'
import Modal from '../ui/Modal'
import Spinner from '../ui/Spinner'
import { Copy } from 'lucide-react'

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000, 20000]

export default function FundWalletModal() {
  const { fundModal, closeFundModal } = useUIStore()
  const { user } = useAuthStore()
  const [amount, setAmount] = useState('')
  const [selected, setSelected] = useState(null)
  const qc = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: (d) => walletApi.initiateFund(d),
    onSuccess: (res) => {
      window.open(res.data.authorization_url, '_blank')
      closeFundModal()
      toast.success('Complete payment in the opened window.')
      setTimeout(() => qc.invalidateQueries(['dashboard']), 5000)
    },
    onError: (err) => toast.error(getApiError(err)),
  })

  const handleFund = () => {
    const amt = Number(amount || selected)
    if (!amt || amt < 100) { toast.error('Minimum funding is ₦100'); return }
    mutate({ amount: amt, callback_url: `${window.location.origin}/wallet/callback` })
  }

  return (
    <Modal open={fundModal} onClose={closeFundModal} title="💰 Fund Wallet">
      {/* Virtual Account */}
      <div className="bg-gray-900 rounded-xl p-4 mb-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full -translate-y-4 translate-x-4" />
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Bank Transfer</p>
        <p className="text-white font-semibold mb-3">Paysapp Microfinance Bank</p>
        <p className="text-xs text-gray-400 mb-1">Account Number</p>
        <div className="flex items-center gap-2">
          <p className="text-2xl font-black text-orange-400 font-mono tracking-widest">6634 2911 41</p>
          <button onClick={() => { navigator.clipboard?.writeText('6634291141'); toast.success('Copied!') }}
            className="p-1.5 rounded-lg bg-white/10 text-gray-400 hover:text-white transition-colors">
            <Copy size={14} />
          </button>
        </div>
        <p className="text-sm text-gray-300 font-semibold mt-2">{user?.full_name}</p>
        <p className="text-xs text-green-400 mt-2 font-semibold">⚡ Instant credit after transfer</p>
      </div>

      <div className="relative flex items-center gap-2 mb-5">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 font-semibold">OR PAY WITH CARD</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Quick amounts */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {QUICK_AMOUNTS.map((a) => (
          <button key={a}
            onClick={() => { setSelected(a); setAmount('') }}
            className={`py-2 rounded-xl text-sm font-bold border-2 transition-all ${
              selected === a
                ? 'bg-orange-50 border-orange-400 text-orange-600'
                : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-orange-300'
            }`}>
            {fmt(a)}
          </button>
        ))}
      </div>

      <div className="mb-4">
        <label className="label">Custom Amount (₦)</label>
        <input className="input" type="number" placeholder="Enter amount (min ₦100)"
          value={amount} onChange={(e) => { setAmount(e.target.value); setSelected(null) }} />
      </div>

      <button onClick={handleFund} disabled={isPending} className="btn-primary">
        {isPending ? <Spinner /> : '💳 Pay with Paystack'}
      </button>
    </Modal>
  )
}
