import { NavLink, Outlet } from 'react-router-dom'
import { useLogout } from '../../hooks/useAuth'
import { LayoutDashboard, Users, CreditCard, Wallet, Settings, ToggleLeft, Tag, LogOut, Shield } from 'lucide-react'

const NAV = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/transactions', icon: CreditCard, label: 'Transactions' },
  { to: '/admin/wallets', icon: Wallet, label: 'Wallets' },
  { to: '/admin/services', icon: ToggleLeft, label: 'Services' },
  { to: '/admin/rates', icon: Tag, label: 'Data Rates' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
]

export default function AdminLayout() {
  const logout = useLogout()
  return (
    <div className="min-h-screen bg-[#0f1117] flex">
      {/* Sidebar */}
      <aside className="w-56 bg-[#161b27] border-r border-white/[0.07] flex flex-col fixed left-0 top-0 bottom-0">
        <div className="flex items-center gap-2.5 px-4 py-5 border-b border-white/[0.07]">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-black text-sm">D</div>
          <div>
            <span className="text-sm font-black text-white"><span className="text-orange-500">Data</span>shop</span>
            <span className="ml-2 text-[9px] font-black bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">ADMIN</span>
          </div>
        </div>
        <nav className="flex-1 p-2 overflow-y-auto">
          {NAV.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-medium transition-all
                 ${isActive ? 'bg-orange-500/10 text-orange-400' : 'text-white/40 hover:text-white/80 hover:bg-white/[0.04]'}`
              }>
              <div className="w-6 h-6 flex items-center justify-center"><Icon size={15} /></div>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-white/[0.07]">
          <div className="flex items-center gap-3 px-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-500 to-purple-500 flex items-center justify-center text-white text-xs font-black flex-shrink-0"><Shield size={12} /></div>
            <div><p className="text-xs font-bold text-white">Super Admin</p><p className="text-[10px] text-red-400">● ADMIN</p></div>
          </div>
          <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <LogOut size={13} /> Logout
          </button>
        </div>
      </aside>
      {/* Main */}
      <main className="ml-56 flex-1 p-6 min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}
