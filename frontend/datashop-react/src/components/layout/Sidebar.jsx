import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useUIStore } from '../../store/uiStore'
import { useLogout } from '../../hooks/useAuth'
import { fmt, getInitials } from '../../utils/helpers'
import { LayoutDashboard, Wifi, Phone, Zap, Tv, BookOpen, Receipt, Gift, User, Settings, LogOut } from 'lucide-react'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/data', icon: Wifi, label: 'Data Bundles', badge: 'Hot' },
  { to: '/airtime', icon: Phone, label: 'Airtime' },
  { to: '/electricity', icon: Zap, label: 'Electricity' },
  { to: '/tv', icon: Tv, label: 'TV Subscription' },
  { to: '/exam', icon: BookOpen, label: 'Exam Pins' },
]
const ACCOUNT = [
  { to: '/transactions', icon: Receipt, label: 'Transactions' },
  { to: '/referrals', icon: Gift, label: 'Referrals' },
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const { user } = useAuthStore()
  const { sidebarOpen, closeSidebar, openFundModal } = useUIStore()
  const logout = useLogout()

  return (
    <>
      {/* Overlay on mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={closeSidebar} />
      )}

      <aside className={`fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-100
                         flex flex-col z-50 transition-transform duration-300
                         ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 
                          flex items-center justify-center text-white font-black text-base shadow-lg shadow-orange-200">
            D
          </div>
          <span className="text-lg font-black tracking-tight">
            <span className="text-orange-500">Data</span>shop
          </span>
        </div>

        {/* Wallet Card */}
        <div className="mx-3 mt-3 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/15 rounded-full -translate-y-3 translate-x-3" />
          <p className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1">Wallet Balance</p>
          <p className="text-2xl font-black text-white font-mono mb-1">
            <span className="text-lg line-through opacity-40">₦</span>
            {Number(user?.wallet_balance || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-white/40">Acct: <span className="text-orange-400 font-mono">6634291141</span> · Paysapp</p>
          <button onClick={() => { openFundModal(); closeSidebar() }}
            className="mt-3 w-full text-xs font-bold py-2 rounded-lg bg-orange-500/15 border border-orange-500/30
                       text-orange-400 hover:bg-orange-500 hover:text-white transition-all">
            + Fund Wallet
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest px-3 py-2">Services</p>
          {NAV.map(({ to, icon: Icon, label, badge }) => (
            <NavLink key={to} to={to} onClick={closeSidebar}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-medium transition-all
                 ${isActive ? 'bg-orange-50 text-orange-600 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`
              }>
              {({ isActive }) => (
                <>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm
                    ${isActive ? 'bg-orange-100' : 'bg-gray-100'}`}>
                    <Icon size={14} />
                  </div>
                  <span className="flex-1">{label}</span>
                  {badge && (
                    <span className="text-[9px] font-black bg-orange-500 text-white px-1.5 py-0.5 rounded-full">{badge}</span>
                  )}
                </>
              )}
            </NavLink>
          ))}

          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest px-3 py-2 mt-2">Account</p>
          {ACCOUNT.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} onClick={closeSidebar}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-medium transition-all
                 ${isActive ? 'bg-orange-50 text-orange-600 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`
              }>
              <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                <Icon size={14} />
              </div>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-gray-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-purple-500
                          flex items-center justify-center text-white text-sm font-black flex-shrink-0">
            {getInitials(user?.full_name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{user?.full_name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
          <button onClick={logout}
            className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
            title="Logout">
            <LogOut size={15} />
          </button>
        </div>
      </aside>
    </>
  )
}
