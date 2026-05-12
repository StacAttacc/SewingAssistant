import { useState } from 'react'
import { Package } from 'lucide-react'
import { resolveUrl } from './utils'

export default function PurchaseModal({ material, onConfirm, onClose }) {
  const urlMatch = material.notes?.match(/https?:\/\/[^\s]+/)
  const url = urlMatch?.[0]
  const [qty, setQty] = useState(material.quantity ?? '')
  const [price, setPrice] = useState(material.price != null ? String(material.price) : '')

  function handleSubmit(e) {
    e.preventDefault()
    onConfirm({ price: parseFloat(price), quantity: qty })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-base-100 rounded-xl shadow-2xl w-full max-w-sm mx-4 p-5" onClick={e => e.stopPropagation()}>
        <h3 className="font-bold text-lg mb-4">Mark as Purchased</h3>

        <div className="flex items-start gap-3 mb-5">
          <div className="w-12 h-12 flex-none rounded overflow-hidden bg-base-200 border border-base-300 shrink-0">
            {material.image_url
              ? <img src={resolveUrl(material.image_url)} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-base-content/30"><Package className="w-5 h-5" /></div>
            }
          </div>
          <div className="min-w-0">
            {url
              ? <a href={url} target="_blank" rel="noreferrer" className="font-medium text-sm truncate block hover:underline">{material.name}</a>
              : <p className="font-medium text-sm truncate">{material.name}</p>
            }
            {material.notes && !url && <p className="text-xs text-base-content/50 mt-0.5 line-clamp-2">{material.notes}</p>}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="form-control">
            <label className="label py-1"><span className="label-text font-medium">Quantity <span className="text-error">*</span></span></label>
            <input
              type="text"
              className="input input-bordered input-sm w-full"
              placeholder="e.g. 2.5 yards"
              value={qty}
              onChange={e => setQty(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="form-control">
            <label className="label py-1"><span className="label-text font-medium">Price paid <span className="text-error">*</span></span></label>
            <label className="input input-bordered input-sm w-full flex items-center gap-2">
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
          <div className="flex justify-end gap-2 mt-1">
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={!qty.trim() || !price}>Confirm</button>
          </div>
        </form>
      </div>
    </div>
  )
}
