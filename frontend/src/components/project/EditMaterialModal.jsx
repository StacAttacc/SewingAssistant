import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { API } from '../../api'
import { resolveUrl } from './utils'

export default function EditMaterialModal({ material, projectId, onSaved, onClose }) {
  const urlMatch = material.notes?.match(/https?:\/\/[^\s]+/)
  const isScraped = !!urlMatch?.[0]
  const isPurchased = !!material.purchased
  const [uiMode, setUiMode] = useState('view')

  const [name, setName] = useState(material.name)
  const [quantity, setQuantity] = useState(material.quantity ?? '')
  const [price, setPrice] = useState(material.price != null ? String(material.price) : '')
  const [notes, setNotes] = useState(isScraped ? '' : (material.notes ?? ''))
  const [careInstructions, setCareInstructions] = useState(material.care_instructions ?? '')
  const [grainDirection, setGrainDirection] = useState(material.grain_direction ?? '')
  const [preWash, setPreWash] = useState(material.pre_wash ?? 0)
  const [imagePreview, setImagePreview] = useState(material.image_url ? resolveUrl(material.image_url) : null)
  const [imageFile, setImageFile] = useState(null)
  const [loading, setLoading] = useState(false)

  function handleImageChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function clearImage() {
    setImageFile(null)
    if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      let image_url = imageFile ? null : (imagePreview ? material.image_url : null)
      if (imageFile) {
        const fd = new FormData()
        fd.append('file', imageFile)
        const res = await fetch(`${API}/api/projects/${projectId}/materials/upload-image`, {
          method: 'POST', body: fd,
        })
        if (res.ok) image_url = (await res.json()).url
      }
      const fabricFields = {
        care_instructions: careInstructions || null,
        grain_direction: grainDirection || null,
        pre_wash: preWash,
      }
      const body = isScraped
        ? { name: material.name, quantity, notes: material.notes ?? '', image_url: material.image_url ?? null, price: price ? parseFloat(price) : null, ...fabricFields }
        : { name, quantity, notes, image_url, price: price ? parseFloat(price) : null, ...fabricFields }
      const res = await fetch(`${API}/api/projects/${projectId}/materials/${material.id}/edit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      onSaved(await res.json())
    } catch (err) {
      console.error('Edit failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const isView = uiMode === 'view'
  const grainLabel = { straight: 'Straight grain', bias: 'Bias cut', cross: 'Cross grain' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-base-100 rounded-xl shadow-2xl w-full max-w-sm mx-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-base-300 shrink-0">
          <span className="font-semibold">{isView ? 'Material' : 'Edit material'}</span>
          <div className="flex gap-1 shrink-0">
            {isView && (
              <button className="btn btn-sm btn-ghost" onClick={() => setUiMode('edit')} title="Edit">
                <Pencil className="w-4 h-4" />
              </button>
            )}
            <button className="btn btn-sm btn-ghost text-lg leading-none" onClick={onClose}>×</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4 overflow-y-auto">
          {isScraped && urlMatch?.[0] && (
            <div className="form-control">
              <label className="label py-1"><span className="label-text font-medium">Source</span></label>
              <a href={urlMatch[0]} target="_blank" rel="noreferrer" className="text-sm px-1 truncate hover:underline text-primary">{material.name}</a>
            </div>
          )}

          {!isScraped && (
            <div className="form-control">
              <label className="label py-1"><span className="label-text font-medium">Name</span></label>
              {isView
                ? <p className="text-sm px-1">{name || '—'}</p>
                : <input type="text" className="input input-bordered input-sm w-full" value={name} onChange={e => setName(e.target.value)} required autoFocus />
              }
            </div>
          )}

          <div className="form-control">
            <label className="label py-1"><span className="label-text font-medium">Quantity</span></label>
            {isView
              ? <p className="text-sm px-1">{quantity || '—'}</p>
              : <input type="text" className="input input-bordered input-sm w-full" placeholder="e.g. 2.5 yards" value={quantity} onChange={e => setQuantity(e.target.value)} autoFocus={isScraped} />
            }
          </div>

          <div className="form-control">
            <label className="label py-1"><span className="label-text font-medium">{isPurchased ? 'Price paid' : 'Price'}</span></label>
            {isView
              ? <p className="text-sm px-1">{price ? `$${Number(price).toFixed(2)}` : '—'}</p>
              : (
                <label className="input input-bordered input-sm w-full flex items-center gap-2">
                  <span className="text-base-content/40 text-sm select-none">$</span>
                  <input type="number" className="grow" placeholder="0.00" value={price} onChange={e => setPrice(e.target.value)} min="0" step="0.01" />
                </label>
              )
            }
          </div>

          {!isScraped && (
            <>
              <div className="form-control">
                <label className="label py-1"><span className="label-text font-medium">Image</span></label>
                {isView
                  ? imagePreview
                    ? <img src={imagePreview} alt="" className="w-16 h-16 object-cover rounded" />
                    : <p className="text-sm px-1 text-base-content/40">No image.</p>
                  : imagePreview ? (
                    <div className="flex items-center gap-3">
                      <img src={imagePreview} alt="preview" className="w-16 h-16 object-cover rounded" />
                      <div className="flex flex-col gap-1">
                        <label className="btn btn-ghost btn-xs cursor-pointer">
                          Change
                          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageChange} />
                        </label>
                        <button type="button" className="btn btn-ghost btn-xs" onClick={clearImage}>Remove</button>
                      </div>
                    </div>
                  ) : (
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="file-input file-input-bordered file-input-sm w-full" onChange={handleImageChange} />
                  )
                }
              </div>
              <div className="form-control">
                <label className="label py-1"><span className="label-text font-medium">Notes</span></label>
                {isView
                  ? <p className="text-sm px-1 whitespace-pre-wrap">{notes || <span className="text-base-content/40">—</span>}</p>
                  : <textarea className="textarea textarea-bordered textarea-sm w-full" rows={3} placeholder="Colour, weight…" value={notes} onChange={e => setNotes(e.target.value)} />
                }
              </div>
            </>
          )}

          <div className="form-control">
            <label className="label py-1"><span className="label-text font-medium">Care instructions</span></label>
            {isView
              ? <p className="text-sm px-1">{careInstructions || <span className="text-base-content/40">—</span>}</p>
              : <input type="text" className="input input-bordered input-sm w-full" placeholder="e.g. Machine wash cold" value={careInstructions} onChange={e => setCareInstructions(e.target.value)} />
            }
          </div>

          <div className="form-control">
            <label className="label py-1"><span className="label-text font-medium">Grain direction</span></label>
            {isView
              ? <p className="text-sm px-1">{grainLabel[grainDirection] || <span className="text-base-content/40">Not specified</span>}</p>
              : (
                <select className="select select-bordered select-sm w-full" value={grainDirection} onChange={e => setGrainDirection(e.target.value)}>
                  <option value="">— not specified —</option>
                  <option value="straight">Straight grain</option>
                  <option value="bias">Bias cut</option>
                  <option value="cross">Cross grain</option>
                </select>
              )
            }
          </div>

          <div className="flex items-center gap-2 py-1">
            {isView
              ? <><span className="text-sm">{preWash ? '✓' : '✗'}</span><span className="label-text">Pre-washed</span></>
              : (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="checkbox checkbox-sm" checked={!!preWash} onChange={e => setPreWash(e.target.checked ? 1 : 0)} />
                  <span className="label-text">Pre-washed</span>
                </label>
              )
            }
          </div>

          {!isView && (
            <div className="flex flex-col gap-2 mt-1">
              <button type="button" className="btn btn-ghost btn-sm w-full" onClick={() => setUiMode('view')}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm w-full" disabled={loading || (!isScraped && !name.trim())}>
                {loading ? <span className="loading loading-spinner loading-xs" /> : 'Save'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
