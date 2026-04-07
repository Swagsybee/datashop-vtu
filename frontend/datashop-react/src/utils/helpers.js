export const fmt = (amount) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(amount)

export const fmtDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })

export const fmtTime = (dateStr) =>
  new Date(dateStr).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })

export const fmtDateTime = (dateStr) => `${fmtDate(dateStr)}, ${fmtTime(dateStr)}`

export const getInitials = (name) =>
  name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || 'U'

export const netClass = (net) => ({
  mtn: 'net-mtn', airtel: 'net-airtel', glo: 'net-glo', '9mobile': 'net-9mobile'
}[net?.toLowerCase()] || 'bg-gray-100 text-gray-700 border-gray-200')

export const typeIcon = (type) => ({
  data: '📶', airtime: '📞', electricity: '⚡', tv: '📺', exam: '📝'
}[type] || '💸')

export const statusBadge = (status) => ({
  success: 'badge-success', pending: 'badge-pending', failed: 'badge-failed', refunded: 'badge-info'
}[status] || 'badge-info')

export const getApiError = (err) => {
  if (!err.response) return 'Network error. Check your connection.'
  const data = err.response.data
  if (data?.error) return data.error
  if (data?.detail) return data.detail
  if (data?.errors) {
    const first = Object.values(data.errors)[0]
    return Array.isArray(first) ? first[0] : first
  }
  return 'Something went wrong.'
}
