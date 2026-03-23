import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useBreadcrumb } from '../contexts/BreadcrumbContext'

const SOURCES = ['fabricville', 'tonitex', 'spool_of_thread', 'fine_fabrics_canada', 'the_fabric_club', 'cleanersupply']

export default function AddMaterial() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { setCrumb } = useBreadcrumb()

  useEffect(() => {
    fetch(`http://localhost:8000/api/projects/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setCrumb(data.name) })
    return () => setCrumb(null)
  }, [id, setCrumb])

  async function saveMaterial(body) {
    const res = await fetch(`http://localhost:8000/api/projects/${id}/materials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.detail || `Error ${res.status}`)
    }
    return res.json()
  }

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <h1 className="text-2xl font-semibold">Add Material</h1>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/projects/${id}`)}>
          ← Back to project
        </button>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-2 gap-6 min-h-0 flex-1">
        {/* Left: search stores */}
        <div className="bg-base-200 rounded-xl p-4 flex flex-col min-h-0">
          <SearchSection onSave={saveMaterial} />
        </div>

        {/* Right: manual add */}
        <div className="bg-base-200 rounded-xl p-4 overflow-y-auto">
          <ManualSection onSave={saveMaterial} onDone={() => navigate(`/projects/${id}`)} />
        </div>
      </div>
    </div>
  )
}

// --- Search Section ---

function SearchSection({ onSave }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(new Set())
  const [savingKey, setSavingKey] = useState(null)

  async function handleSearch(e) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setResults([])

    const responses = await Promise.allSettled(
      SOURCES.map(source =>
        fetch('http://localhost:8000/api/materials/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, source }),
        }).then(r => r.ok ? r.json() : Promise.reject())
      )
    )

    const allResults = responses
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value)
    setResults(allResults)
    setLoading(false)
  }

  async function handleAdd(material) {
    const key = material.url
    setSavingKey(key)
    try {
      const notes = [material.price, material.url].filter(Boolean).join(' — ')
      await onSave({ name: material.title, quantity: '', notes, image_url: material.image_url ?? null })
      setSaved(prev => new Set([...prev, key]))
    } finally {
      setSavingKey(null)
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <h2 className="text-lg font-medium mb-4 shrink-0">Search fabric stores</h2>

      <form onSubmit={handleSearch} className="flex gap-2 mb-4 shrink-0">
        <input
          type="text"
          placeholder="Search all stores…"
          className="input input-bordered flex-1"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <span className="loading loading-spinner loading-sm" /> : 'Search'}
        </button>
      </form>

      <div className="overflow-y-auto flex-1 space-y-3 pr-1">
        {loading && (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg" />
          </div>
        )}

        {!loading && results.length === 0 && query && (
          <p className="text-base-content/40 text-sm text-center py-12">No results.</p>
        )}

        {results.map((m, i) => (
          <div key={`${m.url}-${i}`} className="card bg-base-100 border border-base-300">
            <div className="card-body py-3 flex-row items-center gap-3">
              {m.image_url && (
                <img src={m.image_url} alt={m.title} className="w-14 h-14 object-cover rounded shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium line-clamp-2 text-sm">{m.title}</p>
                <div className="flex gap-2 text-xs text-base-content/50 mt-1">
                  {m.price && <span>{m.price}</span>}
                  <span className="capitalize">{m.source.replace(/_/g, ' ')}</span>
                </div>
              </div>
              <button
                className="btn btn-xs btn-primary shrink-0"
                disabled={saved.has(m.url) || savingKey === m.url}
                onClick={() => handleAdd(m)}
              >
                {savingKey === m.url
                  ? <span className="loading loading-spinner loading-xs" />
                  : saved.has(m.url) ? '✓' : 'Add'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// --- Manual Section ---

function ManualSection({ onSave, onDone }) {
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await onSave({ name, quantity, notes })
      onDone()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section>
      <h2 className="text-lg font-medium mb-4">Add manually</h2>
      {error && <div className="alert alert-error mb-4"><span>{error}</span></div>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="form-control">
          <label className="label"><span className="label-text">Name <span className="text-error">*</span></span></label>
          <input
            type="text"
            className="input input-bordered"
            placeholder="e.g. Cotton muslin"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text">Quantity</span></label>
          <input
            type="text"
            className="input input-bordered"
            placeholder="e.g. 2.5 yards"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
          />
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text">Notes</span></label>
          <textarea
            className="textarea textarea-bordered"
            rows={3}
            placeholder="Colour, weight, source URL…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <span className="loading loading-spinner loading-sm" /> : 'Add to project'}
        </button>
      </form>
    </section>
  )
}
