import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { API } from '../../api'
import { resolveUrl } from './utils'

export default function ChecklistItemModal({ item, projectId, mode: initialMode, onSaved, onClose }) {
  const [uiMode, setUiMode] = useState(initialMode)
  const [title, setTitle] = useState(item.title)
  const [notes, setNotes] = useState(item.notes ?? '')
  const [existingUrls, setExistingUrls] = useState(item.image_urls ?? [])
  const [newFiles, setNewFiles] = useState([])
  const [loading, setLoading] = useState(false)

  function handleFileChange(e) {
    const files = Array.from(e.target.files)
    const entries = files.map(f => ({ file: f, preview: URL.createObjectURL(f) }))
    setNewFiles(prev => [...prev, ...entries])
    e.target.value = ''
  }

  function removeExisting(url) {
    setExistingUrls(prev => prev.filter(u => u !== url))
  }

  function removeNew(idx) {
    setNewFiles(prev => {
      URL.revokeObjectURL(prev[idx].preview)
      return prev.filter((_, i) => i !== idx)
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const uploadedUrls = await Promise.all(
        newFiles.map(async ({ file }) => {
          const fd = new FormData()
          fd.append('file', file)
          const res = await fetch(`${API}/api/projects/${projectId}/checklist/${item.id}/upload-image`, {
            method: 'POST', body: fd,
          })
          const data = await res.json()
          return data.url
        })
      )
      const image_urls = [...existingUrls, ...uploadedUrls]
      const patchRes = await fetch(`${API}/api/projects/${projectId}/checklist/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() || item.title, notes, image_urls }),
      })
      const patched = await patchRes.json()
      if (uiMode === 'complete') {
        const toggleRes = await fetch(
          `${API}/api/projects/${projectId}/checklist/${item.id}/toggle`, { method: 'PATCH' }
        )
        const toggled = await toggleRes.json()
        onSaved({ ...patched, ...toggled })
      } else {
        onSaved(patched)
      }
    } finally {
      setLoading(false)
    }
  }

  const allImages = [
    ...existingUrls.map(url => ({ src: resolveUrl(url), onRemove: () => removeExisting(url) })),
    ...newFiles.map(({ preview }, idx) => ({ src: preview, onRemove: () => removeNew(idx) })),
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="relative bg-base-100 rounded-xl shadow-2xl w-full max-w-sm mx-4 flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-base-300 shrink-0">
          <span className="font-semibold">
            {uiMode === 'view' ? 'Step' : uiMode === 'complete' ? 'Complete step' : 'Edit step'}
          </span>
          <div className="flex gap-1 shrink-0">
            {(uiMode === 'view' || uiMode === 'complete') && (
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
            {uiMode === 'edit'
              ? <input type="text" className="input input-bordered input-sm w-full" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
              : <p className="text-sm font-medium px-1">{item.title}</p>
            }
          </div>

          <div className="form-control">
            <label className="label py-1"><span className="label-text font-medium">Photos</span></label>
            {uiMode === 'view' ? (
              existingUrls.length > 0
                ? <div className="flex flex-wrap gap-2">
                    {existingUrls.map((url, i) => (
                      <img key={i} src={resolveUrl(url)} alt="" className="w-16 h-16 object-cover rounded" />
                    ))}
                  </div>
                : <p className="text-sm px-1 text-base-content/40">No photos.</p>
            ) : (
              <>
                {allImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {allImages.map(({ src, onRemove }, i) => (
                      <div key={i} className="relative w-16 h-16 shrink-0">
                        <img src={src} alt="" className="w-full h-full object-cover rounded" />
                        <button
                          type="button"
                          className="absolute -top-1 -right-1 bg-base-100 rounded-full w-4 h-4 flex items-center justify-center text-xs shadow leading-none"
                          onClick={onRemove}
                        >×</button>
                      </div>
                    ))}
                  </div>
                )}
                <label className="btn btn-ghost btn-sm w-full border border-dashed border-base-300 cursor-pointer">
                  + Add photo
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleFileChange} />
                </label>
              </>
            )}
          </div>

          <div className="form-control">
            <label className="label py-1"><span className="label-text font-medium">Notes</span></label>
            {uiMode === 'view'
              ? <p className="text-sm px-1 whitespace-pre-wrap">{notes || <span className="text-base-content/40">No notes.</span>}</p>
              : <textarea
                  className="textarea textarea-bordered textarea-sm w-full"
                  rows={3}
                  placeholder="How did it go?"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  autoFocus={uiMode === 'complete'}
                />
            }
          </div>

          {uiMode !== 'view' && (
            <div className="flex flex-col gap-2 mt-1">
              <button type="button" className="btn btn-ghost btn-sm w-full" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm w-full" disabled={loading}>
                {loading
                  ? <span className="loading loading-spinner loading-xs" />
                  : uiMode === 'complete' ? 'Mark done' : 'Save'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
