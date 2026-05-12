import { useEffect, useState } from 'react'
import { API } from '../../api'

export default function GenerateSection({ projectId, onDone }) {
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
