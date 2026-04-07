import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children, wide = false }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${wide ? 'max-w-lg' : 'max-w-md'} 
                       slide-up max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between p-6 pb-0">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center 
                       text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
