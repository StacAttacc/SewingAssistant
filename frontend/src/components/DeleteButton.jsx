import { useState } from 'react'
import { Trash2 } from 'lucide-react'

export default function DeleteButton({ onConfirm, size = 'btn-xs', className = '', children }) {
  const [pending, setPending] = useState(false)

  function handleClick(e) {
    e.stopPropagation()
    if (pending) {
      onConfirm()
    } else {
      setPending(true)
    }
  }

  return (
    <button
      className={`btn ${size} ${pending ? 'btn-error text-white' : 'btn-ghost text-error'} ${className}`}
      onClick={handleClick}
      onBlur={() => setPending(false)}
      title={pending ? 'Click again to confirm' : 'Delete'}
    >
      {children ?? <Trash2 className="w-4 h-4" />}
    </button>
  )
}
