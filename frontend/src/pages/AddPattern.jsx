import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useBreadcrumb } from '../contexts/BreadcrumbContext'
import { API } from '../api'

const SOURCES = ['simplicity', 'mood', 'black_snail', 'truly_victorian', 'laughing_moon']

export default function AddPattern() {
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

  async function savePattern(body) {
    const res = await fetch(`${API}/api/projects/${id}/patterns`, {
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
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <h1 className="text-2xl font-semibold">Add Pattern</h1>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/projects/${id}`)}>
          ← Back
        </button>
      </div>

      {/* Tabs */}
      <div role="tablist" className="tabs tabs-border shrink-0">
        <button role="tab" className={`tab ${activeTab === 'search' ? 'tab-active' : ''}`} onClick={() => setActiveTab('search')}>Search</button>
        <button role="tab" className={`tab ${activeTab === 'upload' ? 'tab-active' : ''}`} onClick={() => setActiveTab('upload')}>Upload</button>
        <button role="tab" className={`tab ${activeTab === 'url' ? 'tab-active' : ''}`} onClick={() => setActiveTab('url')}>URL</button>
        <button role="tab" className={`tab ${activeTab === 'generate' ? 'tab-active' : ''}`} onClick={() => setActiveTab('generate')}>Generate</button>
      </div>

      {/* Tab content */}
      {activeTab === 'search' && (
        <div className="bg-base-200 rounded-xl p-4 flex flex-col md:flex-1 md:min-h-0">
          <ScrapeSection projectId={id} onSave={savePattern} />
        </div>
      )}

      {activeTab === 'upload' && (
        <div className="bg-base-200 rounded-xl p-4 overflow-y-auto md:flex-1">
          <UploadSection projectId={id} onDone={() => navigate(`/projects/${id}`)} />
        </div>
      )}

      {activeTab === 'url' && (
        <div className="bg-base-200 rounded-xl p-4 overflow-y-auto md:flex-1">
          <ManualSection onSave={savePattern} onDone={() => navigate(`/projects/${id}`)} />
        </div>
      )}

      {activeTab === 'generate' && (
        <GenerateSection projectId={id} onDone={() => navigate(`/projects/${id}`)} />
      )}
    </div>
  )
}

// --- Scrape Section ---

function ScrapeSection({ projectId, onSave }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(new Set())
  const [savingId, setSavingId] = useState(null)
  const [suggesting, setSuggesting] = useState(false)

  async function handleSuggest() {
    setSuggesting(true)
    try {
      const res = await fetch(`${API}/api/llm/suggest-patterns`, {
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
        fetch(`${API}/api/patterns/search`, {
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
  }

  async function handleSearch(e) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setResults([])

    doSearch(query)
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
    <div className="flex flex-col md:flex-1 md:min-h-0">
      <h2 className="text-lg font-medium mb-4 shrink-0">Search & scrape</h2>

      <form onSubmit={handleSearch} className="flex gap-2 mb-4 shrink-0">
        <input
          type="text"
          placeholder="Search all sources…"
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

        {results.map(p => (
          <div key={`${p.source}-${p.url}`} className="card bg-base-100 border border-base-300">
            <div className="card-body py-3 flex-row items-center gap-3">
              {p.image_url && (
                <img src={p.image_url} alt={p.title} className="w-14 h-14 object-cover rounded shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <a href={p.url} target="_blank" rel="noreferrer" className="font-medium line-clamp-2 text-sm hover:underline">{p.title}</a>
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
  const [notes, setNotes] = useState('')
  const [pricePaid, setPricePaid] = useState('')
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
      form.append('notes', notes)
      if (pricePaid) form.append('price_paid', pricePaid)
      const res = await fetch(`${API}/api/projects/${projectId}/patterns/upload`, {
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
          <label className="label"><span className="label-text font-medium">File (PDF, JPG, PNG, WebP) <span className="text-error">*</span></span></label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className="file-input file-input-bordered w-full"
            onChange={e => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text font-medium">Title</span></label>
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="Leave blank to use filename"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text font-medium">Notes</span></label>
          <textarea
            className="textarea textarea-bordered w-full"
            rows={3}
            placeholder="Size range, modifications, difficulty…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text font-medium">Price paid</span></label>
          <label className="input input-bordered w-full flex items-center gap-2">
            <span className="text-base-content/40 text-sm select-none">$</span>
            <input type="number" className="grow" placeholder="0.00" value={pricePaid} onChange={e => setPricePaid(e.target.value)} min="0" step="0.01" />
          </label>
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
  const [pricePaid, setPricePaid] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await onSave({ source: 'manual', title, url, image_url: null, price: price || null, price_paid: pricePaid ? parseFloat(pricePaid) : null, notes: notes || null })
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
          <label className="label"><span className="label-text font-medium">URL <span className="text-error">*</span></span></label>
          <input
            type="url"
            className="input input-bordered w-full"
            placeholder="https://…"
            value={url}
            onChange={e => setUrl(e.target.value)}
          />
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text font-medium">Title</span></label>
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="Leave blank to auto-detect"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text font-medium">Price</span></label>
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="e.g. $14.99"
            value={price}
            onChange={e => setPrice(e.target.value)}
          />
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text font-medium">Price paid</span></label>
          <label className="input input-bordered w-full flex items-center gap-2">
            <span className="text-base-content/40 text-sm select-none">$</span>
            <input type="number" className="grow" placeholder="0.00" value={pricePaid} onChange={e => setPricePaid(e.target.value)} min="0" step="0.01" />
          </label>
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text font-medium">Notes</span></label>
          <textarea
            className="textarea textarea-bordered w-full"
            rows={3}
            placeholder="Size range, modifications, difficulty…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading || !url.trim()}>
          {loading ? <span className="loading loading-spinner loading-sm" /> : 'Add to project'}
        </button>
      </form>
    </section>
  )
}

// --- Generate Section (AI-powered) ---

function GenerateSection({ projectId, onDone }) {
  const [sets, setSets] = useState([])
  const [selectedSetId, setSelectedSetId] = useState('')
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [generated, setGenerated] = useState(null)

  useEffect(() => {
    fetch(`${API}/api/projects/${projectId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return
        const project = (data.measurement_sets ?? []).map(s => ({ ...s, _source: 'project' }))
        const global = (data.global_measurement_sets ?? []).map(s => ({ ...s, name: `Shared: ${s.name}`, _source: 'global' }))
        const all = [...project, ...global]
        setSets(all)
        if (all.length > 0) setSelectedSetId(String(all[0].id))
      })
  }, [projectId])

  async function handleGenerate(e) {
    e.preventDefault()
    const ms = sets.find(s => s.id === Number(selectedSetId))
    if (!ms) return
    setLoading(true)
    setError(null)
    setGenerated(null)
    try {
      const res = await fetch(`${API}/api/projects/${projectId}/patterns/generate-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, measurements: ms.measurements }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.detail || `Error ${res.status}`)
      }
      const patterns = await res.json()
      setGenerated({
        title: patterns[0]?.title ?? 'Generated pattern',
        pdf_url: patterns[0]?.url,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:flex-1 md:min-h-0">
      {/* Left: form */}
      <div className="bg-base-200 rounded-xl p-4 overflow-y-auto">
        <form onSubmit={handleGenerate} className="space-y-5">
          <div>
            <h2 className="text-lg font-medium mb-1">AI Pattern Generator</h2>
            <p className="text-sm text-base-content/50">Describe a garment and Haiku will draft a printable pattern from your measurements.</p>
          </div>

          <div className="form-control">
            <label className="label py-1"><span className="label-text font-medium">Measurement set <span className="text-error">*</span></span></label>
            {sets.length === 0 ? (
              <p className="text-sm text-base-content/50 italic">No measurement sets found. Add one to your project first.</p>
            ) : (
              <select
                className="select select-bordered select-sm w-full"
                value={selectedSetId}
                onChange={e => setSelectedSetId(e.target.value)}
              >
                {sets.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}
          </div>

          <div className="form-control">
            <label className="label py-1"><span className="label-text font-medium">Garment description <span className="text-error">*</span></span></label>
            <textarea
              className="textarea textarea-bordered w-full"
              rows={4}
              placeholder="e.g. wide-leg palazzo pants with elastic waist and side seam pockets"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
            />
          </div>

          {error && <div className="alert alert-error text-sm"><span>{error}</span></div>}

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading || !selectedSetId || !prompt.trim()}
          >
            {loading
              ? <><span className="loading loading-spinner loading-sm" /> Generating…</>
              : 'Generate with AI'}
          </button>
        </form>
      </div>

      {/* Right: preview */}
      <div className="bg-base-200 rounded-xl p-4 flex flex-col gap-3">
        {!generated ? (
          <p className="text-base-content/40 text-sm m-auto text-center px-4">
            Select a measurement set, describe your garment, and click Generate.
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between shrink-0">
              <p className="font-medium">{generated.title}</p>
              <button className="btn btn-primary btn-sm" onClick={onDone}>
                Done — go to project
              </button>
            </div>
            <p className="text-sm text-base-content/60 shrink-0">
              Pattern saved to your project. Preview the PDF below.
            </p>
            <div className="h-64 md:flex-1 md:min-h-0 rounded overflow-hidden border border-base-300">
              <iframe
                src={`${API}${generated.pdf_url}`}
                className="w-full h-full"
                title="Generated pattern preview"
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
