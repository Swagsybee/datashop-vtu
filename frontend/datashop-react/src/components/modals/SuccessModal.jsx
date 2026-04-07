import { CheckCircle, Copy } from 'lucide-react'
import Modal from '../ui/Modal'
import toast from 'react-hot-toast'
import { fmt, fmtDateTime } from '../../utils/helpers'

export default function SuccessModal({ open, onClose, transaction }) {
  if (!transaction) return null
  return (
    <Modal open={open} onClose={onClose} title="Transaction Complete">
      <div className="text-center py-2">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={40} className="text-green-500" />
        </div>
        <h3 className="text-xl font-black mb-1">Payment Successful!</h3>
        <p className="text-gray-500 text-sm mb-5">{transaction.message || 'Your purchase was processed.'}</p>
        <div className="bg-gray-50 rounded-xl p-4 text-left mb-4">
          <div className="flex justify-between text-sm py-2 border-b border-gray-100">
            <span className="text-gray-500">Amount</span>
            <span className="font-bold text-orange-500">{fmt(transaction.amount || 0)}</span>
          </div>
          <div className="flex justify-between items-center text-sm py-2">
            <span className="text-gray-500">Reference</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs">{transaction.reference}</span>
              <button onClick={() => { navigator.clipboard?.writeText(transaction.reference); toast.success('Copied!') }}
                className="text-gray-400 hover:text-orange-500 transition-colors">
                <Copy size={13} />
              </button>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="btn-primary">Done</button>
      </div>
    </Modal>
  )
}
