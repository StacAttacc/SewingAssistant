import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { API } from '../api'
import ProjectFormModal from '../components/ProjectFormModal'

const STATUS_OPTIONS = [
  { value: 'to_start',    label: 'To Start',    dot: 'bg-base-content/50', badge: 'bg-base-content/50 text-black' },
  { value: 'in_progress', label: 'In Progress', dot: 'bg-success',         badge: 'badge-success' },
  { value: 'on_hold',     label: 'On Hold',     dot: 'bg-warning',         badge: 'badge-warning' },
  { value: 'completed',   label: 'Completed',   dot: 'bg-info',            badge: 'badge-info' },
]

export default function Projects() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState(null)
  const [sortDir, setSortDir] = useState('asc')
  const [statusFilter, setStatusFilter] = useState('all')

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

  function toggleSort(field) {
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(field); setSortDir('asc') }
  }

  const filtered = (() => {
    const q = search.toLowerCase()
    let result = projects.filter(p => {
      const matchesSearch = !q ||
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      const matchesStatus = statusFilter === 'all' || (p.status ?? 'to_start') === statusFilter
      return matchesSearch && matchesStatus
    })
    if (sortBy === 'title') {
      result = [...result].sort((a, b) => {
        const cmp = a.name.localeCompare(b.name)
        return sortDir === 'asc' ? cmp : -cmp
      })
    } else if (sortBy === 'budget') {
      result = [...result].sort((a, b) => {
        const a_ = a.budget ?? -Infinity
        const b_ = b.budget ?? -Infinity
        return sortDir === 'asc' ? a_ - b_ : b_ - a_
      })
    } else if (sortBy === 'date') {
      result = [...result].sort((a, b) => {
        const a_ = new Date(a.created_at).getTime()
        const b_ = new Date(b.created_at).getTime()
        return sortDir === 'asc' ? a_ - b_ : b_ - a_
      })
    }
    return result
  })()

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
    <div className="max-w-5xl mx-auto w-full">
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
      <div className="mb-3">
        <input
          type="text"
          placeholder="Search projects…"
          className="input input-bordered w-full"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {[['title', 'Title'], ['budget', 'Budget'], ['date', 'Date']].map(([field, label]) => (
          <button
            key={field}
            className={`btn btn-xs min-w-[4.5rem] ${sortBy === field ? 'btn-neutral' : 'btn-ghost'}`}
            onClick={() => toggleSort(field)}
          >
            {label} {sortBy === field ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
          </button>
        ))}

        <div className="w-px h-4 bg-base-300 mx-1 shrink-0" />

        <button
          className={`badge cursor-pointer select-none badge-ghost`}
          onClick={() => setStatusFilter('all')}
        >
          All
        </button>
        {STATUS_OPTIONS.map(opt => (
          <button
            key={opt.value}
            className={`badge cursor-pointer select-none ${opt.badge}`}
            onClick={() => setStatusFilter(opt.value)}
          >
            {opt.label}
          </button>
        ))}

        {(sortBy !== null || statusFilter !== 'all') && (
          <button
            className="btn btn-xs btn-ghost text-base-content/40 ml-auto"
            onClick={() => { setSortBy(null); setSortDir('asc'); setStatusFilter('all') }}
          >
            Clear ×
          </button>
        )}
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
                <div className="flex items-center justify-between mt-auto pt-2 text-xs text-base-content/50">
                  <div className="flex gap-3">
                    {p.budget != null && <span>${Number(p.budget).toFixed(2)}</span>}
                    {p.created_at && <span>{new Date(p.created_at).toLocaleDateString()}</span>}
                  </div>
                  {(() => {
                    const opt = STATUS_OPTIONS.find(o => o.value === (p.status ?? 'to_start')) ?? STATUS_OPTIONS[0]
                    return <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${opt.dot}`} title={opt.label} />
                  })()}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <ProjectFormModal
        dialogRef={dialogRef}
        mode="create"
        name={modalName} setName={setModalName}
        desc={modalDesc} setDesc={setModalDesc}
        budget={modalBudget} setBudget={setModalBudget}
        loading={modalLoading}
        error={modalError}
        onSubmit={handleCreate}
        globalSets={globalSets}
        selectedGlobalSets={selectedGlobalSets}
        setSelectedGlobalSets={setSelectedGlobalSets}
      />
    </div>
  )
}
