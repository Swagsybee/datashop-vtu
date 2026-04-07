import { useQuery, useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { adminApi } from '../../api/admin'
import { fmt, fmtDateTime } from '../../utils/helpers'
import Spinner from '../../components/ui/Spinner'
import toast from 'react-hot-toast'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Users, CreditCard, TrendingUp, Wifi, Search } from 'lucide-react'

const PIE_COLORS = ['#f97316','#3b82f6','#22c55e','#a855f7']

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.stats().then((r) => r.data),
  })

  if (isLoading) return <div className="flex justify-center py-32"><Spinner dark size="lg" /></div>

  const dailyData = stats?.daily_revenue?.map((d) => ({ ...d, revenue: Number(d.revenue) })) || []
  const pieData = Object.entries(stats?.by_service || {}).map(([k, v]) => ({
    name: v.label, value: Number(v.revenue)
  }))

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: '💰', label: 'Month Revenue', val: fmt(stats?.transactions?.month_revenue || 0), sub: `₦${fmt(stats?.transactions?.today_revenue || 0)} today`, color: 'text-orange-500' },
          { icon: '👥', label: 'Total Users',   val: stats?.users?.total || 0, sub: `+${stats?.users?.new_today || 0} today`, color: 'text-blue-600' },
          { icon: '✅', label: 'Transactions',  val: stats?.transactions?.total || 0, sub: `${stats?.transactions?.today_count || 0} today`, color: 'text-green-600' },
          { icon: '💎', label: 'Wallet Value',  val: fmt(stats?.wallet?.total_balance || 0), sub: 'Total user balances', color: 'text-purple-600' },
        ].map(({ icon, label, val, sub, color }) => (
          <div key={label} className="card p-5">
            <div className="text-2xl mb-2">{icon}</div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">{label}</p>
            <p className={`text-xl font-black font-mono ${color}`}>{val}</p>
            <p className="text-xs text-gray-400 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-black text-sm mb-4">Revenue — Last 7 Days</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={dailyData}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [fmt(v), 'Revenue']} />
              <Bar dataKey="revenue" fill="#f97316" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-5">
          <h3 className="font-black text-sm mb-4">Service Breakdown</h3>
          {pieData.length > 0 && (
            <>
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />
                      <span className="text-gray-600">{d.name}</span>
                    </div>
                    <span className="font-bold">{fmt(d.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent tx + activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <AdminRecentTx />
        <AdminActivity />
      </div>
    </div>
  )
}

function AdminRecentTx() {
  const { data } = useQuery({
    queryKey: ['admin-transactions', 'recent'],
    queryFn: () => adminApi.transactions({ page_size: 8 }).then((r) => r.data.results || r.data),
  })
  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center">
        <h3 className="font-black text-sm">Recent Transactions</h3>
      </div>
      {(data || []).slice(0, 8).map((tx) => (
        <div key={tx.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 text-sm">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800 truncate">{tx.user_name}</p>
            <p className="text-xs text-gray-500">{tx.service_provider} · {fmtDateTime(tx.created_at)}</p>
          </div>
          <div className="text-right">
            <p className="font-bold font-mono text-orange-500">{fmt(tx.amount)}</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              tx.status === 'success' ? 'bg-green-100 text-green-700' : tx.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
            }`}>{tx.status}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function AdminActivity() {
  const { data } = useQuery({
    queryKey: ['admin-activity'],
    queryFn: () => adminApi.activity().then((r) => r.data),
  })
  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-gray-100"><h3 className="font-black text-sm">Live Activity</h3></div>
      {(data || []).slice(0, 8).map((log, i) => (
        <div key={i} className="flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-sm flex-shrink-0">{log.icon}</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-700 leading-relaxed">{log.text}</p>
            <p className="text-[10px] text-gray-400 mt-1">{log.time}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
