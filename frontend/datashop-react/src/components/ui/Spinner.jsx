export default function Spinner({ dark = false, size = 'md' }) {
  const sz = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-7 h-7' }[size]
  return (
    <div className={`${sz} rounded-full border-2 animate-spin ${
      dark ? 'border-orange-200 border-t-orange-500' : 'border-white/30 border-t-white'
    }`} />
  )
}
