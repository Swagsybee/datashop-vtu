export default function StatCard({ icon, label, value, sub, color = 'orange' }) {
  const colors = {
    orange: 'bg-orange-50 text-orange-500',
    blue:   'bg-blue-50 text-blue-500',
    green:  'bg-green-50 text-green-500',
    purple: 'bg-purple-50 text-purple-500',
    red:    'bg-red-50 text-red-500',
  }
  const valColors = {
    orange: 'text-orange-500', blue: 'text-blue-600',
    green: 'text-green-600', purple: 'text-purple-600', red: 'text-red-500',
  }
  return (
    <div className="card p-5 hover:-translate-y-0.5 transition-transform">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-3 ${colors[color]}`}>
        {icon}
      </div>
      <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">{label}</div>
      <div className={`text-2xl font-black font-mono ${valColors[color]}`}>{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  )
}
