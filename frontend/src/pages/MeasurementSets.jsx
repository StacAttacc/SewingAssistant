import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Ruler, Trash2 } from 'lucide-react'
import { API } from '../api'

export default function MeasurementSets() {
  const navigate = useNavigate()
  const [sets, setSets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [modalName, setModalName] = useState('')
  const [modalNotes, setModalNotes] = useState('')
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState(null)
  const dialogRef = useRef(null)

  useEffect(() => {
    fetch(`${API}/api/measurement-sets`)
      .then(r => { if (!r.ok) throw new Error(`Error ${r.status}`); return r.json() })
      .then(setSets)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = sets.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.notes?.toLowerCase().includes(search.toLowerCase())
  )

  async function handleCreate(e) {
    e.preventDefault()
    setModalLoading(true)
    setModalError(null)
    try {
      const res = await fetch(`${API}/api/measurement-sets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modalName, notes: modalNotes, measurements: {} }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || `Error ${res.status}`)
      }
      const created = await res.json()
      navigate(`/measurements/${created.id}`)
    } catch (err) {
      setModalError(err.message)
    } finally {
      setModalLoading(false)
    }
  }

  async function handleDelete(e, setId) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('Delete this measurement set? This cannot be undone.')) return
    await fetch(`${API}/api/measurement-sets/${setId}`, { method: 'DELETE' })
    setSets(prev => prev.filter(s => s.id !== setId))
  }

  function filledCount(ms) {
    return Object.values(ms.measurements ?? {}).filter(v => v != null).length
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Measurements</h1>
        <button className="btn btn-primary btn-sm" onClick={() => {
          setModalName(''); setModalNotes(''); setModalError(null)
          dialogRef.current?.showModal()
        }}>
          + New Set
        </button>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search measurement sets…"
          className="input input-bordered w-full"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <span className="loading loading-spinner loading-lg" />
        </div>
      )}

      {error && <div className="alert alert-error"><span>{error}</span></div>}

      {!loading && !error && filtered.length === 0 && (
        <p className="text-base-content/50 text-center py-16">No measurement sets yet.</p>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(ms => (
            <Link
              key={ms.id}
              to={`/measurements/${ms.id}`}
              className="card bg-base-100 border border-base-300 hover:border-primary hover:shadow-md transition-all"
            >
              <div className="card-body gap-2">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="card-title text-base line-clamp-2 flex-1">{ms.name}</h2>
                  <button
                    className="btn btn-xs btn-ghost text-error shrink-0"
                    onClick={e => handleDelete(e, ms.id)}
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {ms.notes && (
                  <p className="text-sm text-base-content/70 line-clamp-2">{ms.notes}</p>
                )}
                <div className="flex items-center gap-2 mt-auto pt-2 text-xs text-base-content/50">
                  <Ruler className="w-3.5 h-3.5" />
                  <span>{filledCount(ms)} / 38 measurements</span>
                  <span className="ml-auto">{new Date(ms.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <dialog ref={dialogRef} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">New Measurement Set</h3>
          {modalError && <div className="alert alert-error mb-4"><span>{modalError}</span></div>}
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="form-control">
              <label className="label"><span className="label-text">Name <span className="text-error">*</span></span></label>
              <input
                type="text"
                className="input input-bordered"
                placeholder="e.g. Ada — Act 1 costume"
                value={modalName}
                onChange={e => setModalName(e.target.value)}
                required
              />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Notes</span></label>
              <textarea
                className="textarea textarea-bordered"
                rows={2}
                value={modalNotes}
                onChange={e => setModalNotes(e.target.value)}
              />
            </div>
            <div className="modal-action mt-0">
              <button type="button" className="btn btn-ghost" onClick={() => dialogRef.current?.close()}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={modalLoading || !modalName.trim()}>
                {modalLoading ? <span className="loading loading-spinner loading-sm" /> : 'Create'}
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop"><button>close</button></form>
      </dialog>
    </div>
  )
}
