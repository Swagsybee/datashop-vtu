import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { txApi } from '../../api/transactions'
import { fmt, fmtDateTime, typeIcon, statusBadge } from '../../utils/helpers'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import { Search } from 'lucide-react'

const FILTERS = [
  { id: '',            label: 'All' },
  { id: 'data',        label: '📶 Data' },
  { id: 'airtime',     label: '📞 Airtime' },
  { id: 'electricity', label: '⚡ Electric' },
  { id: 'tv',          label: '📺 TV' },
  { id: 'exam',        label: '📝 Exam' },
]

export default function TransactionsPage() {
  const [filter, setFilter]   = useState('')
  const [search, setSearch]   = useState('')
  const [selected, setSelected] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', filter, search],
    queryFn: () => txApi.list({ type: filter || undefined, search: search || undefined }).then((r) => r.data),
  })

  const { data: stats } = useQuery({
    queryKey: ['tx-stats'],
    queryFn: () => txApi.stats().then((r) => r.data),
  })

  const txList = data?.results || data || []

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-black">📋 Transactions</h1>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total',      val: stats?.total_transactions || 0,  color: 'text-blue-600' },
          { label: 'Successful', val: stats?.successful || 0,          color: 'text-green-600' },
          { label: 'Failed',     val: stats?.failed || 0,              color: 'text-red-500' },
          { label: 'Total Spent',val: fmt(stats?.total_spent || 0),    color: 'text-orange-500' },
        ].map(({ label, val, color }) => (
          <div key={label} className="card p-4">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">{label}</p>
            <p className={`text-xl font-black font-mono ${color}`}>{val}</p>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9 py-2 text-sm" placeholder="Search by reference, provider..."
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2 flex-wrap">
            {FILTERS.map((f) => (
              <button key={f.id} onClick={() => setFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${
                  filter === f.id ? 'bg-orange-50 border-orange-400 text-orange-600' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-orange-300'
                }`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner dark size="lg" /></div>
        ) : txList.length === 0 ? (
          <EmptyState icon="📋" title="No transactions found" subtitle="Try a different filter or make a purchase" />
        ) : (
          <div>
            {txList.map((tx) => (
              <div key={tx.id}
                onClick={() => setSelected(selected?.id === tx.id ? null : tx)}
                className="flex items-center gap-4 px-5 py-4 border-b border-gray-50 last:border-0
                           hover:bg-gray-50 cursor-pointer transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-base flex-shrink-0 ${
                  { data:'bg-blue-50', airtime:'bg-green-50', electricity:'bg-orange-50', tv:'bg-purple-50', exam:'bg-red-50' }[tx.type] || 'bg-gray-50'
                }`}>
                  {typeIcon(tx.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800">{tx.service_provider}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{fmtDateTime(tx.created_at)}</p>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">{tx.reference}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black font-mono text-red-500">-{fmt(tx.amount)}</p>
                  <span className={statusBadge(tx.status)} style={{ fontSize: '10px' }}>{tx.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {selected && (
        <div className="card p-5 slide-up border-orange-100">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-black">Transaction Detail</h3>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
          </div>
          {[
            ['Reference', selected.reference],
            ['Service', selected.service_provider],
            ['Type', selected.type_display],
            ['Amount', fmt(selected.amount)],
            ['Status', selected.status_display],
            ['Date', fmtDateTime(selected.created_at)],
            ...(selected.metadata?.phone ? [['Phone', selected.metadata.phone]] : []),
            ...(selected.metadata?.token ? [['Token', selected.metadata.token]] : []),
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between py-2 border-b border-gray-50 last:border-0 text-sm">
              <span className="text-gray-500">{k}</span>
              <span className="font-bold font-mono">{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
