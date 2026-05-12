import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pencil } from 'lucide-react'
import DeleteButton from '../components/DeleteButton'
import { API } from '../api'
import { MEASUREMENTS } from '../constants/measurements'

function MeasurementSetModal({ ms, onClose }) {
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
              onClick={() => { onClose(); navigate(`/measurements/${ms.id}/edit`) }}
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

export default function MyMeasurements() {
  const navigate = useNavigate()
  const [sets, setSets] = useState([])
  const [loading, setLoading] = useState(true)
  const [previewMs, setPreviewMs] = useState(null)

  useEffect(() => {
    fetch(`${API}/api/measurements`)
      .then(r => r.ok ? r.json() : [])
      .then(data => { setSets(data); setLoading(false) })
  }, [])

  async function handleDelete(id) {
    await fetch(`${API}/api/measurements/${id}`, { method: 'DELETE' })
    setSets(prev => prev.filter(s => s.id !== id))
  }

  return (
    <>
      {previewMs && <MeasurementSetModal ms={previewMs} onClose={() => setPreviewMs(null)} />}

      <div className="flex flex-col md:h-full gap-4">
        <div className="flex items-center justify-between shrink-0">
          <h1 className="text-2xl font-semibold">Saved measurements</h1>
          <div className="flex gap-2">
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>← Back</button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/measurements/add')}>+ Add</button>
          </div>
        </div>

        <div className="bg-base-200 rounded-xl p-4 flex flex-col md:flex-1 md:min-h-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : sets.length === 0 ? (
            <p className="text-base-content/40 text-sm px-2 py-8 text-center">
              No measurement sets yet. Add one to get started.
            </p>
          ) : (
            <div className="flex flex-col gap-1 overflow-y-auto">
              {sets.map(ms => (
                <div
                  key={ms.id}
                  className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-base-300 transition-colors cursor-pointer"
                  onClick={() => setPreviewMs(ms)}
                >
                  <span className="flex-1 text-sm font-medium truncate min-w-0">{ms.name}</span>
                  <DeleteButton className="shrink-0" onConfirm={() => handleDelete(ms.id)} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
