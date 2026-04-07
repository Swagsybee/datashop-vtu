import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { servicesApi } from '../../api/services'
import { useUIStore } from '../../store/uiStore'
import { getApiError, fmt } from '../../utils/helpers'
import Spinner from '../../components/ui/Spinner'
import SuccessModal from '../../components/modals/SuccessModal'

const NETS = [
  { id: 'mtn',     label: 'MTN',     cls: 'net-mtn' },
  { id: 'airtel',  label: 'Airtel',  cls: 'net-airtel' },
  { id: 'glo',     label: 'Glo',     cls: 'net-glo' },
  { id: '9mobile', label: '9mobile', cls: 'net-9mobile' },
]
const VENDORS = [
  { id: 'sme',              label: 'SME Data',          icon: '📦', desc: 'Best rates for personal use' },
  { id: 'gifting',          label: 'Gifting',           icon: '💝', desc: 'Send to friends & family' },
  { id: 'corporate_gifting',label: 'Corporate Gifting', icon: '🎁', desc: 'Bulk send to employees' },
  { id: 'corporate',        label: 'Corporate',         icon: '🏢', desc: 'Enterprise data plans' },
  { id: 'reseller',         label: 'Reseller',          icon: '🔁', desc: 'Wholesale prices' },
]

export default function DataPage() {
  const [step, setStep]   = useState(1)   // 1=vendor, 2=plan+form
  const [vendor, setVendor] = useState(null)
  const [net, setNet]     = useState('mtn')
  const [plan, setPlan]   = useState(null)
  const [phone, setPhone] = useState('')
  const [giftEmail, setGiftEmail] = useState('')
  const [qty, setQty]     = useState(1)
  const [success, setSuccess] = useState(null)
  const { openPinModal } = useUIStore()
  const qc = useQueryClient()

  const { data: plans, isLoading } = useQuery({
    queryKey: ['data-plans', net, vendor?.id],
    queryFn: () => servicesApi.dataPlans({ network: net, vendor_type: vendor?.id }).then((r) => r.data.results || r.data),
    enabled: step === 2,
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (pin) => servicesApi.buyData({
      plan_id: plan.id, phone, transaction_pin: pin,
      gift_email: giftEmail, quantity: qty,
    }),
    onSuccess: (res) => {
      setSuccess({ ...res.data.transaction, message: res.data.message, amount: plan?.sell_price })
      setPhone(''); setPlan(null)
      qc.invalidateQueries(['dashboard'])
    },
    onError: (err) => toast.error(getApiError(err)),
  })

  const handleBuy = () => {
    if (!phone || phone.length !== 11) { toast.error('Enter a valid 11-digit phone number'); return }
    if (!plan) { toast.error('Select a data plan'); return }
    openPinModal((pin) => mutate(pin), 'Confirm Data Purchase')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black">📶 Data Bundles</h1>
        <p className="text-gray-500 text-sm mt-1">Choose vendor type, network and plan</p>
      </div>

      {/* Step 1: Vendor */}
      {step === 1 && (
        <div className="slide-up">
          <p className="text-sm font-semibold text-gray-600 mb-4">Choose how you want to buy data:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {VENDORS.map((v) => (
              <button key={v.id} onClick={() => { setVendor(v); setStep(2) }}
                className="card p-5 text-left hover:-translate-y-1 hover:shadow-md hover:border-orange-200
                           transition-all border-2 border-transparent group">
                <div className="text-3xl mb-3">{v.icon}</div>
                <h3 className="font-black text-gray-800 mb-1">{v.label}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{v.desc}</p>
                {v.id === 'sme' && (
                  <span className="inline-block mt-2 text-[9px] font-black bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full uppercase">
                    Most Popular
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Plans + Form */}
      {step === 2 && (
        <div className="slide-up space-y-5">
          {/* Back + title */}
          <div className="flex items-center gap-3">
            <button onClick={() => setStep(1)}
              className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-sm font-semibold
                         hover:bg-orange-50 hover:text-orange-600 transition-colors">
              ← Back
            </button>
            <div>
              <h2 className="font-black">{vendor?.icon} {vendor?.label}</h2>
              <p className="text-xs text-gray-500">Select network and plan</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Plans */}
            <div className="lg:col-span-2 space-y-4">
              {/* Network tabs */}
              <div className="flex gap-2 flex-wrap">
                {NETS.map((n) => (
                  <button key={n.id} onClick={() => { setNet(n.id); setPlan(null) }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-bold transition-all ${
                      net === n.id ? n.cls : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}>
                    {n.label}
                  </button>
                ))}
              </div>

              {/* Plan cards */}
              {isLoading ? (
                <div className="flex justify-center py-12"><Spinner dark size="lg" /></div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {plans?.map((p) => (
                    <button key={p.id} onClick={() => setPlan(p)}
                      className={`card p-4 text-left transition-all hover:-translate-y-0.5 border-2 ${
                        plan?.id === p.id ? 'border-orange-400 bg-orange-50' : 'border-transparent hover:border-orange-200'
                      }`}>
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-black text-gray-900 text-lg">{p.size_display}</span>
                        <span className="font-black text-orange-500 font-mono text-sm">{fmt(p.sell_price)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        {p.validity_display}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">{p.name}</p>
                    </button>
                  ))}
                  {plans?.length === 0 && (
                    <div className="col-span-3 py-8 text-center text-gray-400 text-sm">
                      No plans available for this network/vendor.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Form */}
            <div className="card p-5 space-y-4 self-start">
              <h3 className="font-black text-sm">📋 Enter Details</h3>

              {plan && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
                  <p className="text-xs font-semibold text-gray-600">Selected Plan</p>
                  <p className="font-black text-gray-900">{plan.size_display} — <span className="text-orange-500">{fmt(plan.sell_price)}</span></p>
                  <p className="text-xs text-gray-500">{plan.validity_display}</p>
                </div>
              )}

              <div>
                <label className="label">Phone Number *</label>
                <input className="input" type="tel" placeholder="08012345678" maxLength={11}
                  value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>

              {(vendor?.id === 'gifting' || vendor?.id === 'corporate_gifting') && (
                <div>
                  <label className="label">Gift Recipient Email</label>
                  <input className="input" type="email" placeholder="recipient@email.com"
                    value={giftEmail} onChange={(e) => setGiftEmail(e.target.value)} />
                </div>
              )}

              {(vendor?.id === 'corporate' || vendor?.id === 'reseller' || vendor?.id === 'corporate_gifting') && (
                <div>
                  <label className="label">Quantity</label>
                  <input className="input" type="number" min={1} max={50} value={qty}
                    onChange={(e) => setQty(Number(e.target.value))} />
                </div>
              )}

              <button onClick={handleBuy} disabled={isPending || !plan} className="btn-primary">
                {isPending ? <Spinner /> : '🛒 Purchase Now'}
              </button>
              <button className="btn-ghost w-full justify-center text-xs">⏰ Schedule instead</button>
            </div>
          </div>
        </div>
      )}

      <SuccessModal open={!!success} onClose={() => setSuccess(null)} transaction={success} />
    </div>
  )
}
