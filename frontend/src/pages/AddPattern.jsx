import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useBreadcrumb } from '../contexts/BreadcrumbContext'

const SOURCES = ['simplicity', 'mood', 'black_snail', 'truly_victorian', 'laughing_moon']

export default function AddPattern() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { setCrumb } = useBreadcrumb()

  useEffect(() => {
    fetch(`http://localhost:8000/api/projects/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setCrumb(data.name) })
    return () => setCrumb(null)
  }, [id, setCrumb])

  async function savePattern(body) {
    const res = await fetch(`http://localhost:8000/api/projects/${id}/patterns`, {
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
        <h1 className="text-2xl font-semibold">Add Pattern</h1>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/projects/${id}`)}>
          ← Back to project
        </button>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-2 gap-6 min-h-0 flex-1">
        {/* Left: search & scrape */}
        <div className="bg-base-200 rounded-xl p-4 flex flex-col min-h-0">
          <ScrapeSection onSave={savePattern} />
        </div>

        {/* Right: manual add */}
        <div className="bg-base-200 rounded-xl p-4 overflow-y-auto space-y-10">
          <UploadSection projectId={id} onDone={() => navigate(`/projects/${id}`)} />
          <div className="divider" />
          <ManualSection onSave={savePattern} onDone={() => navigate(`/projects/${id}`)} />
        </div>
      </div>
    </div>
  )
}

// --- Scrape Section ---

function ScrapeSection({ onSave }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(new Set())
  const [savingId, setSavingId] = useState(null)

  async function handleSearch(e) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setResults([])

    const responses = await Promise.allSettled(
      SOURCES.map(source =>
        fetch('http://localhost:8000/api/patterns/search', {
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

  async function handleAdd(pattern) {
    setSavingId(pattern.url)
    try {
      await onSave({
        source: pattern.source,
        title: pattern.title,
        url: pattern.url,
        image_url: pattern.image_url ?? null,
        price: pattern.price ?? null,
      })
      setSaved(prev => new Set([...prev, pattern.url]))
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <h2 className="text-lg font-medium mb-4 shrink-0">Search & scrape</h2>

      <form onSubmit={handleSearch} className="flex gap-2 mb-4 shrink-0">
        <input
          type="text"
          placeholder="Search all sources…"
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

        {results.map(p => (
          <div key={p.url} className="card bg-base-100 border border-base-300">
            <div className="card-body py-3 flex-row items-center gap-3">
              {p.image_url && (
                <img src={p.image_url} alt={p.title} className="w-14 h-14 object-cover rounded shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium line-clamp-2 text-sm">{p.title}</p>
                <div className="flex gap-2 text-xs text-base-content/50 mt-1">
                  {p.pattern_number && <span>{p.pattern_number}</span>}
                  {p.price && <span>{p.price}</span>}
                  <span className="capitalize">{p.source.replace('_', ' ')}</span>
                </div>
              </div>
              <button
                className="btn btn-xs btn-primary shrink-0"
                disabled={saved.has(p.url) || savingId === p.url}
                onClick={() => handleAdd(p)}
              >
                {savingId === p.url
                  ? <span className="loading loading-spinner loading-xs" />
                  : saved.has(p.url) ? '✓' : 'Add'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// --- Upload Section ---

function UploadSection({ projectId, onDone }) {
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleUpload(e) {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('title', title)
      const res = await fetch(`http://localhost:8000/api/projects/${projectId}/patterns/upload`, {
        method: 'POST',
        body: form,
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || `Error ${res.status}`)
      }
      onDone()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section>
      <h2 className="text-lg font-medium mb-4">Upload PDF or image</h2>
      {error && <div className="alert alert-error mb-4"><span>{error}</span></div>}
      <form onSubmit={handleUpload} className="flex flex-col gap-4">
        <div className="form-control">
          <label className="label"><span className="label-text">File (PDF, JPG, PNG, WebP)</span></label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className="file-input file-input-bordered w-full"
            onChange={e => setFile(e.target.files?.[0] ?? null)}
            required
          />
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text">Title (optional)</span></label>
          <input
            type="text"
            className="input input-bordered"
            placeholder="Leave blank to use filename"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading || !file}>
          {loading ? <span className="loading loading-spinner loading-sm" /> : 'Upload & add to project'}
        </button>
      </form>
    </section>
  )
}

// --- Manual link Section ---

function ManualSection({ onSave, onDone }) {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await onSave({ source: 'manual', title, url, image_url: null, price: price || null })
      onDone()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section>
      <h2 className="text-lg font-medium mb-4">Add by link</h2>
      {error && <div className="alert alert-error mb-4"><span>{error}</span></div>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="form-control">
          <label className="label"><span className="label-text">URL <span className="text-error">*</span></span></label>
          <input
            type="url"
            className="input input-bordered"
            placeholder="https://…"
            value={url}
            onChange={e => setUrl(e.target.value)}
            required
          />
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text">Title</span></label>
          <input
            type="text"
            className="input input-bordered"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text">Price</span></label>
          <input
            type="text"
            className="input input-bordered"
            placeholder="e.g. $14.99"
            value={price}
            onChange={e => setPrice(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <span className="loading loading-spinner loading-sm" /> : 'Add to project'}
        </button>
      </form>
    </section>
  )
}
