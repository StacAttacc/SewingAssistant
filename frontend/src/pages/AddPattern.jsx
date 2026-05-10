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
          ← Back to project
        </button>
      </div>

      {/* Tabs */}
      <div role="tablist" className="tabs tabs-border shrink-0">
        <button role="tab" className={`tab ${activeTab === 'search' ? 'tab-active' : ''}`} onClick={() => setActiveTab('search')}>Search</button>
        <button role="tab" className={`tab ${activeTab === 'manual' ? 'tab-active' : ''}`} onClick={() => setActiveTab('manual')}>Upload & Manual</button>
        <button role="tab" className={`tab ${activeTab === 'generate' ? 'tab-active' : ''}`} onClick={() => setActiveTab('generate')}>Generate</button>
      </div>

      {/* Tab content */}
      {activeTab === 'search' && (
        <div className="bg-base-200 rounded-xl p-4 flex flex-col md:flex-1 md:min-h-0">
          <ScrapeSection projectId={id} onSave={savePattern} />
        </div>
      )}

      {activeTab === 'manual' && (
        <div className="bg-base-200 rounded-xl p-4 overflow-y-auto md:flex-1 space-y-10">
          <UploadSection projectId={id} onDone={() => navigate(`/projects/${id}`)} />
          <div className="divider" />
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
        <button type="submit" className="btn btn-primary" disabled={loading}>
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

// --- Generate Section ---

function GenerateSection({ projectId, onDone }) {
  const [measurements, setMeasurements] = useState({ waist: '', hips: '', height: '', bust: '' })
  const [styleParams, setStyleParams] = useState({ length: 60, flare: 0.3, num_panels: 4, waistband_width: 4 })
  const [saveMeasurements, setSaveMeasurements] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [generated, setGenerated] = useState(null) // { pdf_url, panel_svgs, title }

  // Pre-load project measurements
  useEffect(() => {
    fetch(`${API}/api/projects/${projectId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.measurements) {
          setMeasurements(prev => ({ ...prev, ...data.measurements }))
        }
      })
  }, [projectId])

  function setM(key, val) { setMeasurements(prev => ({ ...prev, [key]: val })) }
  function setS(key, val) { setStyleParams(prev => ({ ...prev, [key]: val })) }

  async function handleGenerate(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setGenerated(null)
    try {
      if (saveMeasurements) {
        await fetch(`${API}/api/projects/${projectId}/measurements`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(measurements),
        })
      }
      const res = await fetch(`${API}/api/projects/${projectId}/patterns/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          garment_type: 'skirt',
          measurements: Object.fromEntries(
            Object.entries(measurements).filter(([, v]) => v !== '' && v != null).map(([k, v]) => [k, Number(v)])
          ),
          style_params: styleParams,
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.detail || `Error ${res.status}`)
      }
      const patterns = await res.json()
      // The backend returns the saved pattern; build a preview from style params
      setGenerated({
        patterns,
        title: patterns[0]?.title ?? 'Generated pattern',
        pdf_url: patterns[0]?.url,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const flareLabel = styleParams.flare === 0 ? 'Straight' : styleParams.flare < 0.4 ? 'Slight' : styleParams.flare < 0.75 ? 'Full' : 'Circle'

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:flex-1 md:min-h-0">
      {/* Left: form */}
      <div className="bg-base-200 rounded-xl p-4 overflow-y-auto">
        <form onSubmit={handleGenerate} className="space-y-6">

          {/* Measurements */}
          <div>
            <h2 className="text-lg font-medium mb-3">Measurements (cm)</h2>
            <div className="grid grid-cols-2 gap-3">
              {[['waist', 'Waist'], ['hips', 'Hips'], ['height', 'Height'], ['bust', 'Bust']].map(([key, label]) => (
                <div key={key} className="form-control">
                  <label className="label py-1"><span className="label-text text-xs">{label}</span></label>
                  <input
                    type="number" min="1" step="0.5"
                    className="input input-bordered input-sm"
                    placeholder="cm"
                    value={measurements[key]}
                    onChange={e => setM(key, e.target.value)}
                  />
                </div>
              ))}
            </div>
            <label className="flex items-center gap-2 mt-2 cursor-pointer">
              <input type="checkbox" className="checkbox checkbox-sm"
                checked={saveMeasurements} onChange={e => setSaveMeasurements(e.target.checked)} />
              <span className="text-sm">Save measurements to project</span>
            </label>
          </div>

          <div className="divider my-0" />

          {/* Style params — Skirt */}
          <div>
            <h2 className="text-lg font-medium mb-3">Skirt style</h2>
            <div className="space-y-4">

              <div className="form-control">
                <label className="label py-1"><span className="label-text text-xs">Length (cm)</span></label>
                <input type="number" min="20" max="150" step="1"
                  className="input input-bordered input-sm"
                  value={styleParams.length}
                  onChange={e => setS('length', Number(e.target.value))} />
              </div>

              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs">Flare</span>
                  <span className="label-text-alt text-xs">{flareLabel} ({styleParams.flare})</span>
                </label>
                <input type="range" min="0" max="1" step="0.05"
                  className="range range-sm"
                  value={styleParams.flare}
                  onChange={e => setS('flare', Number(e.target.value))} />
                <div className="flex justify-between text-xs text-base-content/40 px-1">
                  <span>Straight</span><span>Circle</span>
                </div>
              </div>

              <div className="form-control">
                <label className="label py-1"><span className="label-text text-xs">Number of panels</span></label>
                <select className="select select-bordered select-sm"
                  value={styleParams.num_panels}
                  onChange={e => setS('num_panels', Number(e.target.value))}>
                  {[2, 4, 6, 8].map(n => <option key={n} value={n}>{n} panels</option>)}
                </select>
              </div>

              <div className="form-control">
                <label className="label py-1"><span className="label-text text-xs">Waistband width (cm)</span></label>
                <input type="number" min="1" max="20" step="0.5"
                  className="input input-bordered input-sm"
                  value={styleParams.waistband_width}
                  onChange={e => setS('waistband_width', Number(e.target.value))} />
              </div>

            </div>
          </div>

          {error && <div className="alert alert-error text-sm"><span>{error}</span></div>}

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? <><span className="loading loading-spinner loading-sm" /> Generating…</> : 'Generate pattern'}
          </button>
        </form>
      </div>

      {/* Right: preview */}
      <div className="bg-base-200 rounded-xl p-4 flex flex-col gap-3">
        {!generated ? (
          <p className="text-base-content/40 text-sm m-auto">Fill in the form and click Generate to see your pattern panels here.</p>
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
