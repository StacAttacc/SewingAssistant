import { useState } from 'react'

export default function ManualSection({ onSave, onDone }) {
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
          <label className="input input-bordered w-full flex items-center gap-2">
            <span className="text-base-content/40 text-sm select-none">$</span>
            <input type="number" className="grow" placeholder="0.00" value={price} onChange={e => setPrice(e.target.value)} min="0" step="0.01" />
          </label>
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
