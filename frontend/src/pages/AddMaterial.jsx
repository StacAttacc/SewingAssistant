import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useBreadcrumb } from '../contexts/BreadcrumbContext'
import { API } from '../api'

const SOURCES = ['fabricville', 'tonitex', 'spool_of_thread', 'fine_fabrics_canada', 'the_fabric_club', 'cleanersupply']

export default function AddMaterial() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { setCrumb } = useBreadcrumb()
  const [activeTab, setActiveTab] = useState('search')

  useEffect(() => {
    fetch(`${API}/api/projects/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setCrumb(data.name) })
    return () => setCrumb(null)
  }, [id, setCrumb])

  async function saveMaterial(body) {
    const res = await fetch(`${API}/api/projects/${id}/materials`, {
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
    <div className="flex flex-col md:h-full gap-4">
      <div className="flex items-center justify-between shrink-0">
        <h1 className="text-2xl font-semibold">Add Material</h1>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/projects/${id}`)}>
          ← Back
        </button>
      </div>

      <div role="tablist" className="tabs tabs-border shrink-0">
        <button role="tab" className={`tab ${activeTab === 'search' ? 'tab-active' : ''}`} onClick={() => setActiveTab('search')}>Search</button>
        <button role="tab" className={`tab ${activeTab === 'manual' ? 'tab-active' : ''}`} onClick={() => setActiveTab('manual')}>Manual Upload</button>
      </div>

      {activeTab === 'search' && (
        <div className="bg-base-200 rounded-xl p-4 flex flex-col md:flex-1 md:min-h-0">
          <SearchSection projectId={id} onSave={saveMaterial} />
        </div>
      )}

      {activeTab === 'manual' && (
        <div className="bg-base-200 rounded-xl p-4 overflow-y-auto md:flex-1">
          <ManualSection projectId={id} onSave={saveMaterial} onDone={() => navigate(`/projects/${id}`)} />
        </div>
      )}
    </div>
  )
}

// --- Search Section ---

function SearchSection({ projectId, onSave }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(new Set())
  const [savingKey, setSavingKey] = useState(null)
  const [suggesting, setSuggesting] = useState(false)

  async function handleSuggest() {
    setSuggesting(true)
    try {
      const res = await fetch(`${API}/api/llm/suggest-materials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: Number(projectId) }),
      })
      if (res.ok) {
        const suggestion = await res.json()
        setQuery(suggestion)
        doSearch(suggestion)
      }
    } finally {
      setSuggesting(false)
    }
  }

  async function doSearch(q) {
    if (!q.trim()) return
    setLoading(true)
    setResults([])

    const responses = await Promise.allSettled(
      SOURCES.map(source =>
        fetch(`${API}/api/materials/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: q, source }),
        }).then(r => r.ok ? r.json() : Promise.reject())
      )
    )

    const allResults = responses
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value)
    setResults(allResults)
    setLoading(false)
    setSaved(new Set())
  }

  async function handleSearch(e) {
    e.preventDefault()
    doSearch(query)
  }

  async function handleAdd(material) {
    const key = material.url
    setSavingKey(key)
    try {
      const price = material.price
        ? parseFloat(material.price.replace(/[^0-9.]/g, '')) || null
        : null
      await onSave({
        name: material.title,
        quantity: '',
        notes: material.url,
        image_url: material.image_url ?? null,
        price,
      })
      setSaved(prev => new Set([...prev, key]))
    } finally {
      setSavingKey(null)
    }
  }

  return (
    <div className="flex flex-col md:flex-1 md:min-h-0">
      <h2 className="text-lg font-medium mb-4 shrink-0">Search fabric stores</h2>

      <form onSubmit={handleSearch} className="flex gap-2 mb-4 shrink-0">
        <input
          type="text"
          placeholder="Search all stores…"
          className="input input-bordered flex-1"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button type="button" className="btn btn-outline btn-secondary" disabled={suggesting || loading} onClick={handleSuggest}>
          {suggesting ? <span className="loading loading-spinner loading-sm" /> : 'Suggest'}
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading || !query.trim()}>
          {loading ? <span className="loading loading-spinner loading-sm" /> : 'Search'}
        </button>
      </form>

      <div className="overflow-y-auto md:flex-1 md:min-h-0 space-y-3 pr-1">
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
                <a href={m.url} target="_blank" rel="noreferrer" className="font-medium line-clamp-2 text-sm hover:underline">{m.title}</a>
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

function ManualSection({ projectId, onSave, onDone }) {
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [price, setPrice] = useState('')
  const [notes, setNotes] = useState('')
  const [careInstructions, setCareInstructions] = useState('')
  const [grainDirection, setGrainDirection] = useState('')
  const [preWash, setPreWash] = useState(0)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function handleImageChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function clearImage() {
    setImageFile(null)
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      let image_url = null
      if (imageFile) {
        const fd = new FormData()
        fd.append('file', imageFile)
        const res = await fetch(`${API}/api/projects/${projectId}/materials/upload-image`, {
          method: 'POST',
          body: fd,
        })
        if (!res.ok) {
          const d = await res.json().catch(() => ({}))
          throw new Error(d.detail || `Upload failed (${res.status})`)
        }
        const { url } = await res.json()
        image_url = url
      }
      await onSave({
        name, quantity, notes, price: parseFloat(price), image_url,
        care_instructions: careInstructions || null,
        grain_direction: grainDirection || null,
        pre_wash: preWash,
      })
      onDone()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section>
      {error && <div className="alert alert-error mb-4"><span>{error}</span></div>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="form-control">
          <label className="label"><span className="label-text font-medium">Name <span className="text-error">*</span></span></label>
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="e.g. Cotton muslin"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text font-medium">Quantity <span className="text-error">*</span></span></label>
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="e.g. 2.5 yards"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            required
          />
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text font-medium">Price <span className="text-error">*</span></span></label>
          <label className="input input-bordered w-full flex items-center gap-2">
            <span className="text-base-content/40 text-sm select-none">$</span>
            <input
              type="number"
              className="grow"
              placeholder="0.00"
              value={price}
              onChange={e => setPrice(e.target.value)}
              min="0"
              step="0.01"
              required
            />
          </label>
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text font-medium">Image</span></label>
          {imagePreview ? (
            <div className="flex items-center gap-3">
              <img src={imagePreview} alt="preview" className="w-20 h-20 object-cover rounded" />
              <button type="button" className="btn btn-ghost btn-sm" onClick={clearImage}>Remove</button>
            </div>
          ) : (
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="file-input file-input-bordered w-full"
              onChange={handleImageChange}
            />
          )}
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text font-medium">Notes</span></label>
          <textarea
            className="textarea textarea-bordered w-full"
            rows={3}
            placeholder="Colour, weight, source URL…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text font-medium">Care instructions</span></label>
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="e.g. Machine wash cold, lay flat to dry"
            value={careInstructions}
            onChange={e => setCareInstructions(e.target.value)}
          />
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text font-medium">Grain direction</span></label>
          <select
            className="select select-bordered w-full"
            value={grainDirection}
            onChange={e => setGrainDirection(e.target.value)}
          >
            <option value="">— not specified —</option>
            <option value="straight">Straight grain</option>
            <option value="bias">Bias cut</option>
            <option value="cross">Cross grain</option>
          </select>
        </div>
        <label className="flex items-center gap-2 cursor-pointer py-1">
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            checked={!!preWash}
            onChange={e => setPreWash(e.target.checked ? 1 : 0)}
          />
          <span className="label-text">Pre-washed</span>
        </label>
        <button type="submit" className="btn btn-primary" disabled={loading || !name.trim() || !quantity.trim() || !price}>
          {loading ? <span className="loading loading-spinner loading-sm" /> : 'Add to project'}
        </button>
      </form>
    </section>
  )
}
