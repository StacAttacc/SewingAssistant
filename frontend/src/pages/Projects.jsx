import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { API } from '../api'

export default function Projects() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  const [modalName, setModalName] = useState('')
  const [modalDesc, setModalDesc] = useState('')
  const [modalBudget, setModalBudget] = useState('')
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState(null)
  const [globalSets, setGlobalSets] = useState([])
  const [selectedGlobalSets, setSelectedGlobalSets] = useState(new Set())
  const dialogRef = useRef(null)

  async function fetchProjects() {
    try {
      const res = await fetch(`${API}/api/projects`)
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const data = await res.json()
      setProjects(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProjects() }, [])

  const filtered = projects.filter(p => {
    const q = search.toLowerCase()
    return (
      p.name?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      String(p.budget ?? '').includes(q)
    )
  })

  async function handleCreate(e) {
    e.preventDefault()
    setModalLoading(true)
    setModalError(null)
    try {
      const res = await fetch(`${API}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: modalName,
          description: modalDesc,
          budget: modalBudget !== '' ? parseFloat(modalBudget) : null,
          global_measurement_set_ids: [...selectedGlobalSets],
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || `Error ${res.status}`)
      }
      const created = await res.json()
      navigate(`/projects/${created.id}`)
    } catch (err) {
      setModalError(err.message)
    } finally {
      setModalLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <button className="btn btn-primary btn-sm" onClick={() => {
          setModalName(''); setModalDesc(''); setModalBudget(''); setModalError(null)
          setSelectedGlobalSets(new Set())
          fetch(`${API}/api/measurements`).then(r => r.ok ? r.json() : []).then(setGlobalSets)
          dialogRef.current?.showModal()
        }}>
          + New Project
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search projects…"
          className="input input-bordered w-full"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      {loading && (
        <div className="flex justify-center py-16">
          <span className="loading loading-spinner loading-lg" />
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <p className="text-base-content/50 text-center py-16">No projects found.</p>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => (
            <Link
              key={p.id}
              to={`/projects/${p.id}`}
              className="card bg-base-100 border border-base-300 hover:border-primary hover:shadow-md transition-all"
            >
              <div className="card-body gap-2">
                <h2 className="card-title text-base line-clamp-2">{p.name}</h2>
                {p.description && (
                  <p className="text-sm text-base-content/70 line-clamp-2">{p.description}</p>
                )}
                <div className="flex items-center gap-3 mt-auto pt-2 text-xs text-base-content/50">
                  {p.budget != null && <span>${Number(p.budget).toFixed(2)}</span>}
                  {p.created_at && (
                    <span>{new Date(p.created_at).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* New Project modal */}
      <dialog ref={dialogRef} className="modal">
        <div className="modal-box max-w-md">
          <button
            type="button"
            className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3"
            onClick={() => dialogRef.current?.close()}
          >✕</button>
          <h3 className="font-bold text-lg mb-5">New Project</h3>

          {modalError && (
            <div className="alert alert-error mb-4">
              <span>{modalError}</span>
            </div>
          )}

          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Project name <span className="text-error">*</span></span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="e.g. Spring collection 2026"
                value={modalName}
                onChange={e => setModalName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Description</span>
              </label>
              <textarea
                className="textarea textarea-bordered w-full"
                rows={3}
                placeholder="What are you making?"
                value={modalDesc}
                onChange={e => setModalDesc(e.target.value)}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Budget</span>
              </label>
              <label className="input input-bordered w-full flex items-center gap-2">
                <span className="text-base-content/40 text-sm select-none">$</span>
                <input
                  type="number"
                  className="grow"
                  placeholder="0.00"
                  value={modalBudget}
                  onChange={e => setModalBudget(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </label>
            </div>

            {globalSets.length > 0 && (
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Include your measurements</span>
                </label>
                <div className="flex flex-col gap-1 max-h-36 overflow-y-auto">
                  {globalSets.map(gs => (
                    <label key={gs.id} className="flex items-center gap-2 cursor-pointer py-1">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        checked={selectedGlobalSets.has(gs.id)}
                        onChange={e => setSelectedGlobalSets(prev => {
                          const next = new Set(prev)
                          e.target.checked ? next.add(gs.id) : next.delete(gs.id)
                          return next
                        })}
                      />
                      <span className="text-sm">{gs.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-2">
              <button type="submit" className="btn btn-primary w-full" disabled={modalLoading}>
                {modalLoading ? <span className="loading loading-spinner loading-sm" /> : 'Create'}
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  )
}
