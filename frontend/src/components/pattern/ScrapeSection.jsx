import { useState } from 'react'
import { API } from '../../api'

const SOURCES = ['simplicity', 'mood', 'black_snail', 'truly_victorian', 'laughing_moon']

export default function ScrapeSection({ projectId, onSave }) {
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
        <button type="button" className="btn border-orange-500 text-orange-500 hover:bg-orange-500 hover:border-orange-500 hover:text-white" disabled={suggesting || loading} onClick={handleSuggest}>
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
