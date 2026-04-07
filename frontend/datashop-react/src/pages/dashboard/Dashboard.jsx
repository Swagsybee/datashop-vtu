import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { authApi } from '../../api/auth'
import { servicesApi } from '../../api/services'
import { useUIStore } from '../../store/uiStore'
import { useAuthStore } from '../../store/authStore'
import { fmt, fmtDateTime, typeIcon, statusBadge, getApiError } from '../../utils/helpers'
import Spinner from '../../components/ui/Spinner'
import SuccessModal from '../../components/modals/SuccessModal'
import { Wifi, Phone, Zap, Tv, BookOpen, ArrowRight } from 'lucide-react'

const SERVICES = [
  { to: '/data',        icon: Wifi,     label: 'Data Bundles',    sub: 'SME · Corporate',  color: 'bg-blue-50 text-blue-500' },
  { to: '/airtime',     icon: Phone,    label: 'Airtime',         sub: 'All networks',      color: 'bg-green-50 text-green-500' },
  { to: '/electricity', icon: Zap,      label: 'Electricity',     sub: 'PHCN tokens',       color: 'bg-orange-50 text-orange-500' },
  { to: '/tv',          icon: Tv,       label: 'TV Subscription', sub: 'DStv · GOtv',       color: 'bg-purple-50 text-purple-500' },
  { to: '/exam',        icon: BookOpen, label: 'Exam Pins',       sub: 'WAEC · JAMB',       color: 'bg-red-50 text-red-500' },
]

const NETS = [
  { id: 'mtn',     label: 'MTN',     cls: 'net-mtn' },
  { id: 'airtel',  label: 'Airtel',  cls: 'net-airtel' },
  { id: 'glo',     label: 'Glo',     cls: 'net-glo' },
  { id: '9mobile', label: '9mobile', cls: 'net-9mobile' },
]
const QUICK_AMTS = [100, 200, 500, 1000, 2000]

export default function Dashboard() {
  const { user } = useAuthStore()
  const { openFundModal } = useUIStore()
  const [qbTab, setQbTab] = useState('airtime')

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => authApi.dashboard().then((r) => r.data),
  })

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Spinner dark size="lg" />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Wallet Banner */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full -translate-y-8 translate-x-8" />
        <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-blue-500/8 rounded-full translate-y-8" />
        <div className="relative flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <p className="text-xs text-white/40 uppercase tracking-widest font-semibold mb-2">Wallet Balance</p>
            <p className="text-4xl font-black text-white font-mono">
              <span className="text-2xl line-through opacity-30">₦</span>
              {Number(user?.wallet_balance || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-white/35 mt-2">
              Account: <span className="text-orange-400 font-mono font-semibold">6634291141</span> · Paysapp
            </p>
          </div>
          <button onClick={openFundModal}
            className="self-start bg-orange-500/20 border border-orange-500/30 text-orange-400
                       font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-orange-500 hover:text-white
                       transition-all whitespace-nowrap">
            + Fund Wallet
          </button>
        </div>
        <div className="relative grid grid-cols-3 mt-6 pt-5 border-t border-white/[0.07]">
          {[
            { label: 'Total Spent',    val: `₦${Number(data?.total_spent || 0).toLocaleString()}`, color: 'text-orange-400' },
            { label: 'Transactions',   val: data?.total_transactions || 0, color: 'text-blue-400' },
            { label: 'Referral Bonus', val: `₦${Number(user?.referral_bonus_earned || 0).toLocaleString()}`, color: 'text-purple-400' },
          ].map(({ label, val, color }) => (
            <div key={label} className="text-center">
              <p className={`text-lg font-black font-mono ${color}`}>{val}</p>
              <p className="text-[10px] text-white/30 uppercase tracking-wide font-semibold mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Services */}
      <div>
        <h2 className="text-base font-black mb-4">⚡ Services</h2>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {SERVICES.map(({ to, icon: Icon, label, sub, color }) => (
            <Link key={to} to={to}
              className="card p-4 text-center hover:-translate-y-1 hover:shadow-md hover:border-orange-200
                         transition-all cursor-pointer group">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 ${color} group-hover:scale-105 transition-transform`}>
                <Icon size={20} />
              </div>
              <p className="text-xs font-bold text-gray-800 leading-tight">{label}</p>
              <p className="text-[10px] text-gray-400 mt-0.5 hidden sm:block">{sub}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Quick Purchase */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="border-b border-gray-100">
            <div className="flex items-center gap-1 px-5 pt-5 pb-0">
              <h3 className="text-sm font-black flex-1">⚡ Quick Purchase</h3>
              <Link to="/data" className="text-xs text-orange-500 font-semibold flex items-center gap-1">Buy Data <ArrowRight size={11} /></Link>
            </div>
            <div className="flex mt-3">
              {['airtime', 'electricity', 'tv'].map((t) => (
                <button key={t} onClick={() => setQbTab(t)}
                  className={`px-5 py-2.5 text-xs font-semibold border-b-2 transition-colors capitalize ${
                    qbTab === t ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="p-5">
            {qbTab === 'airtime' && <QuickAirtime />}
            {qbTab === 'electricity' && (
              <div className="text-center py-6">
                <p className="text-4xl mb-3">⚡</p>
                <p className="font-bold text-gray-700 mb-4">Purchase electricity tokens</p>
                <Link to="/electricity" className="btn-primary" style={{ width: 'auto', padding: '10px 24px' }}>Go to Electricity →</Link>
              </div>
            )}
            {qbTab === 'tv' && (
              <div className="text-center py-6">
                <p className="text-4xl mb-3">📺</p>
                <p className="font-bold text-gray-700 mb-4">DStv, GOtv, Startimes, Showmax</p>
                <Link to="/tv" className="btn-primary" style={{ width: 'auto', padding: '10px 24px' }}>Go to TV Sub →</Link>
              </div>
            )}
          </div>
        </div>

        {/* Right col */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute right-0 bottom-0 text-6xl opacity-10 leading-none">🎁</div>
            <span className="text-[9px] font-black bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full uppercase tracking-wide">Referral</span>
            <h3 className="text-white font-black text-lg mt-2 leading-tight">Refer &amp; Earn ₦500!</h3>
            <p className="text-blue-200/60 text-xs mt-1 mb-4 leading-relaxed">Earn per friend who signs up and purchases.</p>
            <Link to="/referrals" className="inline-flex items-center gap-2 text-xs font-bold text-white/80 bg-white/10 border border-white/15 px-4 py-2 rounded-lg hover:bg-white/20 transition-colors">
              View Referrals <ArrowRight size={12} />
            </Link>
          </div>

          <div className="card overflow-hidden">
            <div className="flex items-center justify-between p-4 pb-0">
              <h3 className="text-sm font-black">Recent Transactions</h3>
              <Link to="/transactions" className="text-xs text-orange-500 font-semibold">All →</Link>
            </div>
            {data?.recent_transactions?.length > 0 ? (
              <div className="mt-3">
                {data.recent_transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0 ${
                      { data:'bg-blue-50', airtime:'bg-green-50', electricity:'bg-orange-50', tv:'bg-purple-50', exam:'bg-red-50' }[tx.type] || 'bg-gray-50'
                    }`}>
                      {typeIcon(tx.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{tx.service_provider}</p>
                      <p className="text-[10px] text-gray-400">{fmtDateTime(tx.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black font-mono text-red-500">-{fmt(tx.amount)}</p>
                      <span className={statusBadge(tx.status)} style={{ fontSize: '9px', padding: '1px 6px' }}>{tx.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-gray-400">
                <p className="text-2xl mb-2">🕐</p>
                <p className="font-semibold">No transactions yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function QuickAirtime() {
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
    },
    onError: (err) => toast.error(getApiError(err)),
  })

  const handle = () => {
    if (!phone || phone.length !== 11) { toast.error('Enter valid 11-digit phone'); return }
    if (!amount || Number(amount) < 50) { toast.error('Minimum airtime ₦50'); return }
    openPinModal((pin) => mutate(pin), 'Confirm Airtime Purchase')
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {NETS.map((n) => (
          <button key={n.id} onClick={() => setNet(n.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${
              net === n.id ? n.cls : 'bg-gray-50 border-gray-200 text-gray-500'
            }`}>
            {n.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Phone Number</label>
          <input className="input" type="tel" placeholder="08012345678" maxLength={11}
            value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <label className="label">Amount (₦)</label>
          <input className="input" type="number" placeholder="Min ₦50"
            value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        {QUICK_AMTS.map((a) => (
          <button key={a} onClick={() => setAmount(String(a))}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${
              amount === String(a) ? 'bg-orange-50 border-orange-400 text-orange-600' : 'bg-gray-50 border-gray-200 text-gray-600'
            }`}>
            ₦{a.toLocaleString()}
          </button>
        ))}
      </div>
      <button onClick={handle} disabled={isPending} className="btn-primary">
        {isPending ? <Spinner /> : '📞 Buy Airtime'}
      </button>
      <SuccessModal open={!!success} onClose={() => setSuccess(null)} transaction={success} />
    </div>
  )
}
