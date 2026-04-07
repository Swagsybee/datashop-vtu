import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/admin'
import { fmt, fmtDateTime, getInitials, getApiError } from '../../utils/helpers'
import Spinner from '../../components/ui/Spinner'
import Modal from '../../components/ui/Modal'
import { Search, UserPlus } from 'lucide-react'

export default function AdminUsers() {
  const [search, setSearch]   = useState('')
  const [selected, setSelected] = useState(null)
  const [addOpen, setAddOpen]  = useState(false)
  const [fundOpen, setFundOpen] = useState(false)
  const [fundAmt, setFundAmt]   = useState('')
  const [fundReason, setFundReason] = useState('')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: () => adminApi.users({ search: search || undefined }).then((r) => r.data.results || r.data),
  })

  const { mutate: toggleStatus, isPending: toggling } = useMutation({
    mutationFn: (user) => user.is_suspended
      ? adminApi.activateUser(user.id)
      : adminApi.suspendUser({ user_id: user.id, reason: 'Suspended by admin' }),
    onSuccess: () => { qc.invalidateQueries(['admin-users']); toast.success('User status updated.'); setSelected(null) },
    onError: (e) => toast.error(getApiError(e)),
  })

  const { mutate: fundWallet, isPending: funding } = useMutation({
    mutationFn: () => adminApi.fundUser({ user_id: selected?.id, amount: Number(fundAmt), reason: fundReason }),
    onSuccess: () => { qc.invalidateQueries(['admin-users']); toast.success('Wallet funded!'); setFundOpen(false); setFundAmt(''); setFundReason('') },
    onError: (e) => toast.error(getApiError(e)),
  })

  const users = data || []
  const COLORS = ['#f97316','#3b82f6','#22c55e','#a855f7','#eab308','#ef4444']

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">👥 Users</h1>
        <button onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 bg-orange-500 text-white font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200">
          <UserPlus size={15} /> Add User
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9 py-2 text-sm" placeholder="Search name, email or phone..."
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {isLoading ? <div className="flex justify-center py-16"><Spinner dark size="lg" /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['User', 'Phone', 'Wallet', 'Txs', 'Role', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0`}
                          style={{ background: COLORS[i % COLORS.length] }}>
                          {getInitials(u.full_name)}
                        </div>
                        <div>
                          <p className="font-semibold">{u.full_name}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{u.phone}</td>
                    <td className="px-4 py-3 font-bold text-green-600 font-mono">{fmt(u.wallet_balance)}</td>
                    <td className="px-4 py-3">{u.total_transactions}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${u.role === 'reseller' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${u.is_suspended ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {u.is_suspended ? 'Suspended' : 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => setSelected(u)}
                          className="text-xs font-bold text-gray-600 bg-gray-100 px-2.5 py-1.5 rounded-lg hover:bg-orange-50 hover:text-orange-600 transition-colors">
                          View
                        </button>
                        <button onClick={() => toggleStatus(u)} disabled={toggling}
                          className={`text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors ${
                            u.is_suspended ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-red-50 text-red-700 hover:bg-red-100'
                          }`}>
                          {u.is_suspended ? 'Activate' : 'Suspend'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User detail modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={`👤 ${selected?.full_name}`} wide>
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Email', selected.email], ['Phone', selected.phone],
                ['Wallet', fmt(selected.wallet_balance)], ['Total Spent', fmt(selected.total_spent || 0)],
                ['Transactions', selected.total_transactions], ['Joined', fmtDateTime(selected.created_at)],
              ].map(([k, v]) => (
                <div key={k} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">{k}</p>
                  <p className="font-bold">{v}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setFundOpen(true) }}
                className="flex-1 bg-green-50 text-green-700 font-bold text-sm py-2.5 rounded-xl border border-green-200 hover:bg-green-100 transition-colors">
                💰 Fund Wallet
              </button>
              <button onClick={() => toggleStatus(selected)} disabled={toggling}
                className={`flex-1 font-bold text-sm py-2.5 rounded-xl border transition-colors ${
                  selected.is_suspended ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                }`}>
                {selected.is_suspended ? '✅ Activate' : '🚫 Suspend'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Fund wallet modal */}
      <Modal open={fundOpen} onClose={() => setFundOpen(false)} title={`💰 Fund ${selected?.full_name}'s Wallet`}>
        <div className="space-y-4">
          <div>
            <label className="label">Amount (₦) *</label>
            <input className="input" type="number" placeholder="Enter amount" value={fundAmt} onChange={(e) => setFundAmt(e.target.value)} />
          </div>
          <div>
            <label className="label">Reason / Note</label>
            <input className="input" placeholder="e.g. Manual top-up, Compensation..." value={fundReason} onChange={(e) => setFundReason(e.target.value)} />
          </div>
          <button onClick={() => fundWallet()} disabled={funding || !fundAmt} className="btn-primary">
            {funding ? <Spinner /> : '💰 Fund Wallet'}
          </button>
        </div>
      </Modal>

      {/* Add user - simplified */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="➕ Add New User">
        <p className="text-sm text-gray-500 text-center py-6">Use the Register endpoint or Django Admin to create users.<br /><span className="text-orange-500 font-semibold">django-admin → Users → Add User</span></p>
      </Modal>
    </div>
  )
}
