import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { API } from '../../api'

export default function PatternModal({ pattern, projectId, onSaved, onClose }) {
  const [uiMode, setUiMode] = useState('view')
  const [title, setTitle] = useState(pattern.title ?? '')
  const [notes, setNotes] = useState(pattern.notes ?? '')
  const [pricePaid, setPricePaid] = useState(pattern.price_paid != null ? String(pattern.price_paid) : '')
  const [loading, setLoading] = useState(false)

  const isUpload = pattern.source === 'upload' || pattern.source === 'generated'
  const isManual = pattern.source === 'manual'
  const sourceLabel = isUpload ? 'Upload' : isManual ? 'Manual link' : pattern.source?.replace(/_/g, ' ')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/projects/${projectId}/patterns/${pattern.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() || pattern.title, notes: notes || null, price_paid: pricePaid ? parseFloat(pricePaid) : null }),
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      onSaved(await res.json())
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="relative bg-base-100 rounded-xl shadow-2xl w-full max-w-sm mx-4 flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-base-300 shrink-0">
          <span className="font-semibold">{uiMode === 'view' ? 'Pattern' : 'Edit pattern'}</span>
          <div className="flex gap-1 shrink-0">
            {uiMode === 'view' && (
              <button className="btn btn-sm btn-ghost" onClick={() => setUiMode('edit')} title="Edit">
                <Pencil className="w-4 h-4" />
              </button>
            )}
            <button className="btn btn-sm btn-ghost text-lg leading-none" onClick={onClose}>×</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4 overflow-y-auto">
          <div className="form-control">
            <label className="label py-1"><span className="label-text font-medium">Title</span></label>
            {uiMode === 'view'
              ? <p className="text-sm px-1">{pattern.title || '—'}</p>
              : <input type="text" className="input input-bordered input-sm w-full" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
            }
          </div>

          {(pattern.source || sourceLabel) && (
            <div className="form-control">
              <label className="label py-1"><span className="label-text font-medium">Source</span></label>
              <p className="text-sm px-1 capitalize">{sourceLabel || '—'}</p>
            </div>
          )}

          {pattern.price && (
            <div className="form-control">
              <label className="label py-1"><span className="label-text font-medium">Listed price</span></label>
              <p className="text-sm px-1">{pattern.price}</p>
            </div>
          )}

          <div className="form-control">
            <label className="label py-1"><span className="label-text font-medium">Price paid</span></label>
            {uiMode === 'view'
              ? <p className="text-sm px-1">{pricePaid ? `$${Number(pricePaid).toFixed(2)}` : <span className="text-base-content/40">—</span>}</p>
              : (
                <label className="input input-bordered input-sm w-full flex items-center gap-2">
                  <span className="text-base-content/40 text-sm select-none">$</span>
                  <input type="number" className="grow" placeholder="0.00" value={pricePaid} onChange={e => setPricePaid(e.target.value)} min="0" step="0.01" />
                </label>
              )
            }
          </div>

          {pattern.url && (
            <div className="form-control">
              <label className="label py-1"><span className="label-text font-medium">Link</span></label>
              <a href={isUpload ? `${API}${pattern.url}` : pattern.url} target="_blank" rel="noreferrer"
                className="text-sm px-1 truncate hover:underline text-primary">
                {isUpload ? 'View file' : pattern.url}
              </a>
            </div>
          )}

          <div className="form-control">
            <label className="label py-1"><span className="label-text font-medium">Notes</span></label>
            {uiMode === 'view'
              ? <p className="text-sm px-1 whitespace-pre-wrap">{pattern.notes || <span className="text-base-content/40">No notes.</span>}</p>
              : <textarea className="textarea textarea-bordered textarea-sm w-full" rows={4}
                  placeholder="Size range, modifications, difficulty…"
                  value={notes} onChange={e => setNotes(e.target.value)} />
            }
          </div>

          {uiMode === 'edit' && (
            <div className="flex flex-col gap-2 mt-1">
              <button type="button" className="btn btn-ghost btn-sm w-full" onClick={() => setUiMode('view')}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm w-full" disabled={loading}>
                {loading ? <span className="loading loading-spinner loading-xs" /> : 'Save'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
