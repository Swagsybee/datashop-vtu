import { useState } from 'react'
import toast from 'react-hot-toast'
import { useLogout } from '../../hooks/useAuth'
import { LogOut, Bell, Shield, Smartphone, Moon, Trash2, MessageSquare, HelpCircle } from 'lucide-react'

function Toggle({ defaultOn = false }) {
  const [on, setOn] = useState(defaultOn)
  return (
    <button onClick={() => setOn(!on)}
      className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 relative ${on ? 'bg-orange-500' : 'bg-gray-200'}`}>
      <div className={`absolute w-5 h-5 rounded-full bg-white top-0.5 transition-transform shadow ${on ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}

function SettingRow({ icon: Icon, iconBg, name, desc, children }) {
  return (
    <div className="flex items-center gap-4 py-4 border-b border-gray-50 last:border-0">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800">{name}</p>
        {desc && <p className="text-xs text-gray-500 mt-0.5">{desc}</p>}
      </div>
      {children}
    </div>
  )
}

function Group({ title, children }) {
  return (
    <div className="card overflow-hidden">
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-5 pt-4 pb-1">{title}</p>
      <div className="px-5">{children}</div>
    </div>
  )
}

export default function SettingsPage() {
  const logout = useLogout()

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h1 className="text-2xl font-black">⚙️ Settings</h1>

      <Group title="Notifications">
        <SettingRow icon={Bell} iconBg="bg-orange-50 text-orange-500" name="Push Notifications" desc="Transaction alerts"><Toggle defaultOn /></SettingRow>
        <SettingRow icon={MessageSquare} iconBg="bg-blue-50 text-blue-500" name="Email Receipts" desc="Transaction confirmation emails"><Toggle defaultOn /></SettingRow>
        <SettingRow icon={Smartphone} iconBg="bg-green-50 text-green-500" name="SMS Alerts" desc="Alerts to your phone"><Toggle /></SettingRow>
        <SettingRow icon={Bell} iconBg="bg-purple-50 text-purple-500" name="Promotions" desc="Deals and special offers"><Toggle /></SettingRow>
      </Group>

      <Group title="App">
        <SettingRow icon={Shield} iconBg="bg-orange-50 text-orange-500" name="Biometric Login" desc="Fingerprint or face unlock"><Toggle /></SettingRow>
        <SettingRow icon={Moon} iconBg="bg-gray-100 text-gray-600" name="Dark Mode" desc="Coming soon"><Toggle /></SettingRow>
        <SettingRow icon={Trash2} iconBg="bg-red-50 text-red-500" name="Clear Cache" desc="Free up storage">
          <button onClick={() => toast.success('Cache cleared!')}
            className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors">
            Clear
          </button>
        </SettingRow>
      </Group>

      <Group title="Support">
        <SettingRow icon={MessageSquare} iconBg="bg-green-50 text-green-500" name="Live Chat" desc="Chat with our support team">
          <button onClick={() => toast('Opening live chat...')}
            className="text-xs font-bold text-orange-500 bg-orange-50 px-3 py-1.5 rounded-lg hover:bg-orange-100 transition-colors">
            Chat
          </button>
        </SettingRow>
        <SettingRow icon={HelpCircle} iconBg="bg-blue-50 text-blue-500" name="FAQs" desc="Frequently asked questions">
          <button onClick={() => toast('Opening FAQs...')}
            className="text-xs font-bold text-blue-500 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
            View
          </button>
        </SettingRow>
      </Group>

      <div className="card p-5">
        <button onClick={logout}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-red-50 text-red-600
                     font-bold text-sm border-2 border-red-100 hover:bg-red-500 hover:text-white transition-all">
          <LogOut size={16} /> Logout
        </button>
      </div>
    </div>
  )
}
