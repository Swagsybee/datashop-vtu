import { useState } from 'react'
import { useUIStore } from '../../store/uiStore'
import Modal from '../ui/Modal'
import PinInput from '../ui/PinInput'
import Spinner from '../ui/Spinner'

export default function PinModal() {
  const { pinModal, closePinModal } = useUIStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleComplete = async (pin) => {
    setError('')
    setLoading(true)
    try {
      await pinModal.onSuccess(pin)
      closePinModal()
    } catch (e) {
      setError(e?.message || 'Incorrect PIN. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={pinModal.open} onClose={closePinModal} title={`🔐 ${pinModal.title}`}>
      <p className="text-sm text-gray-500 text-center">Enter your 4-digit transaction PIN</p>
      <PinInput onComplete={handleComplete} loading={loading} />
      {loading && (
        <div className="flex justify-center mb-4">
          <Spinner dark size="lg" />
        </div>
      )}
      {error && (
        <div className="text-sm text-red-600 font-semibold text-center bg-red-50 rounded-lg p-3">{error}</div>
      )}
      <p className="text-xs text-gray-400 text-center mt-3">
        Demo PIN: <span className="font-bold text-gray-600">1234</span>
      </p>
    </Modal>
  )
}
