import { useNavigate } from 'react-router-dom'
import { Pencil } from 'lucide-react'
import { MEASUREMENTS } from '../../constants/measurements'

export default function MeasurementSetModal({ ms, onClose }) {
  const navigate = useNavigate()
  const filled = MEASUREMENTS.filter(([key]) => ms.measurements[key] != null)
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="relative bg-base-100 rounded-xl shadow-2xl flex flex-col"
        style={{ width: '80vw', maxWidth: 500, maxHeight: '80vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-base-300">
          <span className="font-semibold truncate">{ms.name}</span>
          <div className="flex gap-1 shrink-0">
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => { onClose(); navigate(ms.editUrl) }}
              title="Edit"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button className="btn btn-sm btn-ghost text-lg leading-none" onClick={onClose}>×</button>
          </div>
        </div>
        <div className="overflow-y-auto p-4">
          {filled.length > 0 ? (
            <ul className="space-y-2">
              {filled.map(([key, label]) => (
                <li key={key} className="flex items-center justify-between text-sm">
                  <span className="text-base-content/70">{label}</span>
                  <span className="font-medium ml-4 shrink-0">{ms.measurements[key]} cm</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-base-content/40 text-sm">No measurements recorded.</p>
          )}
        </div>
      </div>
    </div>
  )
}
