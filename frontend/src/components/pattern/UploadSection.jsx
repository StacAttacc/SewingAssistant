import { useState } from 'react'
import { API } from '../../api'

export default function UploadSection({ projectId, onDone }) {
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
