import { useAuthStore } from '../../store/authStore'
import { fmt } from '../../utils/helpers'
import toast from 'react-hot-toast'
import { Copy, Share2 } from 'lucide-react'

const STEPS = [
  { n: '1', title: 'Share your code', desc: 'Send your unique referral code to friends via WhatsApp, SMS or any platform' },
  { n: '2', title: 'Friend signs up',  desc: 'They create a Datashop account using your referral code' },
  { n: '3', title: 'First purchase',   desc: 'Any service purchase qualifies — data, airtime, electricity' },
  { n: '4', title: 'Both earn ₦500',   desc: 'Bonus is credited to your wallet immediately' },
]

export default function ReferralsPage() {
  const { user } = useAuthStore()
  const code = user?.referral_code || 'DSH-XXXXXX'
  const link = `${window.location.origin}/register?ref=${code}`

  const copyCode = () => { navigator.clipboard?.writeText(code); toast.success('Referral code copied! 🎉') }
  const copyLink = () => { navigator.clipboard?.writeText(link); toast.success('Invite link copied! 🔗') }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <h1 className="text-2xl font-black">🎁 Referrals</h1>

      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 text-8xl opacity-[0.08] leading-none select-none">🎁</div>
        <span className="text-[9px] font-black bg-orange-500/20 text-orange-400 px-2.5 py-1 rounded-full uppercase tracking-wide">
          Referral Program
        </span>
        <h2 className="text-white font-black text-3xl mt-3 leading-tight">Refer &amp; Earn<br />₦500 Bonus!</h2>
        <p className="text-blue-200/60 text-sm mt-2 mb-5 leading-relaxed">
          Share your link. Earn ₦500 for every friend who signs up and makes their first purchase. They earn ₦500 too!
        </p>
        <div className="bg-white/[0.07] border border-white/10 rounded-xl p-4 flex items-center justify-between mb-3">
          <span className="text-white font-black text-2xl font-mono tracking-widest">{code}</span>
          <button onClick={copyCode} className="p-2 bg-orange-500 rounded-lg text-white hover:bg-orange-600 transition-colors">
            <Copy size={16} />
          </button>
        </div>
        <button onClick={copyLink}
          className="flex items-center gap-2 text-sm font-bold text-white/80 bg-white/10 border border-white/15 px-4 py-2.5 rounded-xl hover:bg-white/20 transition-colors">
          <Share2 size={14} /> Share Invite Link
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Referred', val: '0',   color: 'text-orange-500' },
          { label: 'Total Earned',   val: fmt(user?.referral_bonus_earned || 0), color: 'text-green-600' },
          { label: 'Pending',        val: '0',   color: 'text-blue-600' },
        ].map(({ label, val, color }) => (
          <div key={label} className="card p-4 text-center">
            <p className={`text-xl font-black font-mono ${color}`}>{val}</p>
            <p className="text-xs text-gray-500 font-semibold mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="card p-5">
        <h3 className="font-black mb-5">How it works</h3>
        <div className="space-y-4">
          {STEPS.map((s) => (
            <div key={s.n} className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-black text-sm flex-shrink-0">
                {s.n}
              </div>
              <div>
                <p className="font-bold text-gray-800 text-sm">{s.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
