import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { authApi } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'
import { getInitials, getApiError, fmt } from '../../utils/helpers'
import Spinner from '../../components/ui/Spinner'
import Modal from '../../components/ui/Modal'
import PinInput from '../../components/ui/PinInput'

export default function ProfilePage() {
  const { user, setUser } = useAuthStore()
  const qc = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const [pinOpen, setPinOpen]   = useState(false)
  const [pinStep, setPinStep]   = useState('set') // 'set' | 'change'
  const [oldPin, setOldPin]     = useState('')
  const [newPin, setNewPin]     = useState('')
  const [pinStage, setPinStage] = useState('old') // 'old' | 'new' | 'confirm'
  const [pinLoading, setPinLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: { first_name: user?.first_name, last_name: user?.last_name, phone: user?.phone } })

  const { mutate: updateProfile, isPending: saving } = useMutation({
    mutationFn: (d) => authApi.updateProfile(d),
    onSuccess: (res) => {
      setUser(res.data.user)
      setEditOpen(false)
      toast.success('Profile updated!')
      qc.invalidateQueries(['dashboard'])
    },
    onError: (err) => toast.error(getApiError(err)),
  })

  const handlePinComplete = async (pin) => {
    if (!user?.pin_set) {
      // Set new PIN flow
      if (!newPin) { setNewPin(pin); setPinStage('confirm'); return }
      if (pin !== newPin) { toast.error('PINs do not match. Start again.'); setNewPin(''); setPinStage('new'); return }
      setPinLoading(true)
      try {
        const passRes = prompt('Enter your password to set PIN:')
        await authApi.setPin({ pin, pin2: pin, password: passRes })
        toast.success('Transaction PIN set! ✅')
        setPinOpen(false); setNewPin(''); setPinStage('new')
        qc.invalidateQueries(['dashboard'])
      } catch (e) { toast.error(getApiError(e)) }
      finally { setPinLoading(false) }
    } else {
      // Change PIN flow
      if (pinStage === 'old') { setOldPin(pin); setPinStage('new'); return }
      if (pinStage === 'new') { setNewPin(pin); setPinStage('confirm'); return }
      if (pin !== newPin) { toast.error('PINs do not match.'); setNewPin(''); setPinStage('new'); return }
      setPinLoading(true)
      try {
        await authApi.changePin({ old_pin: oldPin, new_pin: pin, new_pin2: pin })
        toast.success('PIN changed successfully! 🔐')
        setPinOpen(false); setOldPin(''); setNewPin(''); setPinStage('old')
      } catch (e) { toast.error(getApiError(e)) }
      finally { setPinLoading(false) }
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <h1 className="text-2xl font-black">👤 Profile</h1>

      {/* Header card */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 flex items-center gap-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-orange-500/10 rounded-full -translate-y-6 translate-x-6" />
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-purple-500
                        flex items-center justify-center text-white text-3xl font-black border-4 border-white/20 flex-shrink-0">
          {getInitials(user?.full_name)}
        </div>
        <div>
          <h2 className="text-2xl font-black text-white">{user?.full_name}</h2>
          <p className="text-white/50 text-sm">{user?.email}</p>
          <p className="text-orange-400 font-mono text-sm mt-1">{user?.phone}</p>
          <span className="inline-block mt-2 text-xs font-bold bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full capitalize">
            {user?.role} · Member since 2024
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Personal info */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-sm">Personal Information</h3>
            <button onClick={() => setEditOpen(true)}
              className="text-xs font-bold text-orange-500 bg-orange-50 px-3 py-1.5 rounded-lg hover:bg-orange-100 transition-colors">
              ✏️ Edit
            </button>
          </div>
          {[
            ['Full Name', user?.full_name],
            ['Email', user?.email],
            ['Phone', user?.phone],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between py-2.5 border-b border-gray-50 last:border-0 text-sm">
              <span className="text-gray-500">{k}</span>
              <span className="font-semibold">{v}</span>
            </div>
          ))}
        </div>

        {/* Wallet info */}
        <div className="card p-5">
          <h3 className="font-black text-sm mb-4">🏦 Bank Account</h3>
          {[
            ['Bank', 'Paysapp MFB'],
            ['Account No', '6634291141'],
            ['Account Name', user?.full_name],
            ['Referral Code', user?.referral_code],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between py-2.5 border-b border-gray-50 last:border-0 text-sm">
              <span className="text-gray-500">{k}</span>
              <span className={`font-semibold ${k === 'Account No' ? 'font-mono text-orange-500' : ''}`}>{v}</span>
            </div>
          ))}
        </div>

        {/* Security */}
        <div className="card p-5 sm:col-span-2">
          <h3 className="font-black text-sm mb-4">🔐 Security</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Transaction PIN', icon: '🔐', action: () => { setPinStage(user?.pin_set ? 'old' : 'new'); setPinOpen(true) }, actionLabel: user?.pin_set ? 'Change PIN' : 'Set PIN' },
              { label: 'Password',        icon: '🔑', action: () => toast('Password reset email sent!'), actionLabel: 'Reset Password' },
              { label: '2FA',             icon: '🛡️', action: () => toast('Coming soon!'), actionLabel: 'Enable 2FA' },
            ].map(({ label, icon, action, actionLabel }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-4">
                <p className="text-xl mb-2">{icon}</p>
                <p className="text-xs font-semibold text-gray-700 mb-2">{label}</p>
                <button onClick={action}
                  className="text-xs font-bold text-orange-500 bg-orange-50 px-2.5 py-1.5 rounded-lg hover:bg-orange-100 transition-colors">
                  {actionLabel}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="✏️ Edit Profile">
        <form onSubmit={handleSubmit((d) => updateProfile(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">First Name</label>
              <input className="input" {...register('first_name', { required: true })} />
            </div>
            <div>
              <label className="label">Last Name</label>
              <input className="input" {...register('last_name', { required: true })} />
            </div>
          </div>
          <div>
            <label className="label">Phone Number</label>
            <input className="input" type="tel" {...register('phone')} />
          </div>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <Spinner /> : '💾 Save Changes'}
          </button>
        </form>
      </Modal>

      {/* PIN Modal */}
      <Modal open={pinOpen} onClose={() => { setPinOpen(false); setOldPin(''); setNewPin(''); setPinStage(user?.pin_set ? 'old' : 'new') }}
        title={user?.pin_set ? '🔐 Change PIN' : '🔐 Set Transaction PIN'}>
        <p className="text-sm text-gray-500 text-center mb-2">
          {!user?.pin_set
            ? pinStage === 'new' ? 'Enter a new 4-digit PIN' : 'Confirm your PIN'
            : pinStage === 'old' ? 'Enter your current PIN' : pinStage === 'new' ? 'Enter your new PIN' : 'Confirm new PIN'
          }
        </p>
        <PinInput key={pinStage} onComplete={handlePinComplete} loading={pinLoading} />
        {pinLoading && <div className="flex justify-center"><Spinner dark /></div>}
      </Modal>
    </div>
  )
}
