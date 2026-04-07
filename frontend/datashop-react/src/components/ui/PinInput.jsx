import { useRef, useState } from 'react'

export default function PinInput({ onComplete, loading }) {
  const [pins, setPins] = useState(['', '', '', ''])
  const refs = [useRef(), useRef(), useRef(), useRef()]

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...pins]
    next[i] = val
    setPins(next)
    if (val && i < 3) refs[i + 1].current.focus()
    if (next.every((p) => p) && next.length === 4) {
      onComplete(next.join(''))
    }
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !pins[i] && i > 0) refs[i - 1].current.focus()
  }

  const handlePaste = (e) => {
    const txt = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4)
    if (txt.length === 4) {
      setPins(txt.split(''))
      refs[3].current.focus()
      onComplete(txt)
    }
  }

  return (
    <div className="flex gap-3 justify-center my-6">
      {pins.map((p, i) => (
        <input
          key={i}
          ref={refs[i]}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={p}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          disabled={loading}
          className="w-14 h-16 text-center text-2xl font-bold rounded-xl border-2 border-gray-200
                     outline-none transition-all focus:border-orange-400 focus:ring-2 focus:ring-orange-100
                     bg-gray-50 font-mono disabled:opacity-50"
        />
      ))}
    </div>
  )
}
