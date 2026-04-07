import { useState } from 'react'
import { Bell, Menu } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useUIStore } from '../../store/uiStore'
import { useNotifications } from '../../hooks/useAuth'
import { fmtDateTime } from '../../utils/helpers'

export default function Topbar({ title }) {
  const { user } = useAuthStore()
  const { toggleSidebar } = useUIStore()
  const [showNotifs, setShowNotifs] = useState(false)
  const { data: notifs } = useNotifications()
  const unread = notifs?.filter((n) => !n.is_read).length || 0

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-gray-100 px-6 py-3.5
                       flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-orange-500 transition-colors">
          <Menu size={18} />
        </button>
        <div>
          <h1 className="text-base font-black text-gray-900"
              dangerouslySetInnerHTML={{ __html: title || `Good morning, <span class="text-orange-500">${user?.first_name}</span> 👋` }} />
          <p className="text-xs text-gray-400 hidden sm:block">
            {new Date().toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative">
          <button onClick={() => setShowNotifs(!showNotifs)}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center relative
                       text-gray-600 hover:bg-orange-50 hover:text-orange-500 transition-colors">
            <Bell size={16} />
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black
                               rounded-full flex items-center justify-center border-2 border-white">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-11 w-80 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 overflow-hidden slide-up">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <span className="font-bold text-sm">Notifications</span>
                <button className="text-xs text-orange-500 font-semibold">Mark all read</button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifs?.length > 0 ? notifs.slice(0, 8).map((n) => (
                  <div key={n.id}
                    className={`p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors ${!n.is_read ? 'bg-orange-50/40' : ''}`}>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-sm flex-shrink-0">
                        {n.type === 'transaction' ? '💳' : n.type === 'wallet' ? '💰' : '📢'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 leading-relaxed">{n.message}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{fmtDateTime(n.created_at)}</p>
                      </div>
                      {!n.is_read && <div className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0 mt-1" />}
                    </div>
                  </div>
                )) : (
                  <div className="p-8 text-center text-sm text-gray-400">No notifications</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-purple-500
                        flex items-center justify-center text-white text-xs font-black cursor-pointer">
          {user?.initials || 'U'}
        </div>
      </div>
    </header>
  )
}
