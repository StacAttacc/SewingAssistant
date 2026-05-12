import { useEffect, useState, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useBreadcrumb } from '../contexts/BreadcrumbContext'
import { Trash2, Package, Pencil, GripVertical } from 'lucide-react'
import { API } from '../api'
import { MEASUREMENTS } from '../constants/measurements'
import ProjectFormModal from '../components/ProjectFormModal'
import DeleteButton from '../components/DeleteButton'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

function resolveUrl(url) {
  if (!url) return null
  return url.startsWith('/') ? `${API}${url}` : url
}

const PDF_THUMB_SIZE = 48
const PDF_THUMB_SCALE = PDF_THUMB_SIZE / 816

function PreviewModal({ pattern, onClose }) {
  const iframeRef = useRef(null)
  const isPDF = pattern.url?.endsWith('.pdf')
  const isSVG = pattern.url?.endsWith('.svg')
  const src = `${API}${pattern.url}`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="relative bg-base-100 rounded-xl shadow-2xl flex flex-col"
        style={{ width: '80vw', maxWidth: 900, height: '85vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-2 border-b border-base-300">
          <span className="font-medium truncate">{pattern.title ?? pattern.pattern_number ?? 'Pattern'}</span>
          <div className="flex gap-2">
            <button className="btn btn-sm btn-ghost" onClick={() => window.open(src, '_blank', 'noopener')}>Print</button>
            <button className="btn btn-sm btn-ghost text-lg leading-none" onClick={onClose}>×</button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden flex items-center justify-center p-4">
          {isPDF || isSVG ? (
            <iframe ref={iframeRef} src={src} className="w-full h-full rounded" title="Pattern preview" />
          ) : (
            <img src={src} alt={pattern.title ?? 'Pattern'} className="max-w-full max-h-full object-contain rounded" />
          )}
        </div>
      </div>
    </div>
  )
}

function MeasurementSetModal({ ms, onClose }) {
  const navigate = useNavigate()
  const filled = MEASUREMENTS.filter(([key]) => ms.measurements[key] != null)
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="relative bg-base-100 rounded-xl shadow-2xl flex flex-col"
        style={{ width: '80vw', maxWidth: 500, maxHeight: '80vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-base-300">
          <span className="font-semibold truncate">{ms.name}</span>
          <div className="flex gap-1 shrink-0">
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => { onClose(); navigate(ms.editUrl) }}
              title="Edit"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button className="btn btn-sm btn-ghost text-lg leading-none" onClick={onClose}>×</button>
          </div>
        </div>
        <div className="overflow-y-auto p-4">
          {filled.length > 0 ? (
            <ul className="space-y-2">
              {filled.map(([key, label]) => (
                <li key={key} className="flex items-center justify-between text-sm">
                  <span className="text-base-content/70">{label}</span>
                  <span className="font-medium ml-4 shrink-0">{ms.measurements[key]} cm</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-base-content/40 text-sm">No measurements recorded.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function PatternRow({ pattern, projectId, onDelete }) {
  const isUpload = pattern.source === 'upload' || pattern.source === 'generated'
  const isPDF = pattern.url?.endsWith('.pdf')
  const isSVG = pattern.url?.endsWith('.svg')

  function renderThumbnail() {
    if (isUpload && !isPDF && !isSVG && pattern.url) {
      return <img src={`${API}${pattern.url}`} alt="" className="w-full h-full object-cover" />
    }
    if (isUpload && (isPDF || isSVG) && pattern.url) {
      return (
        <div className="relative w-full h-full overflow-hidden">
          <iframe
            src={`${API}${pattern.url}`}
            style={{ width: 816, height: 816, transform: `scale(${PDF_THUMB_SCALE})`, transformOrigin: 'top left', pointerEvents: 'none', position: 'absolute', top: 0, left: 0 }}
            title=""
          />
        </div>
      )
    }
    if (!isUpload && pattern.image_url) {
      return <img src={pattern.image_url} alt="" className="w-full h-full object-cover" />
    }
    return (
      <div className="w-full h-full flex items-center justify-center text-base-content/30">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 4h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z" />
        </svg>
      </div>
    )
  }

  async function handleDelete() {
    try {
      const res = await fetch(`${API}/api/projects/${projectId}/patterns/${pattern.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      onDelete.removePattern(pattern.id)
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  return (
    <div className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-base-300 transition-colors">
      <div className="w-12 h-12 flex-none rounded overflow-hidden bg-base-200 border border-base-300">
        {renderThumbnail()}
      </div>
      {isUpload ? (
        <button className="flex-1 text-sm font-medium truncate min-w-0 text-left hover:underline cursor-pointer" onClick={() => onDelete.openPreview(pattern)}>
          {pattern.title ?? pattern.pattern_number ?? 'Untitled'}
        </button>
      ) : (
        <a href={pattern.url} target="_blank" rel="noreferrer" className="flex-1 text-sm font-medium truncate min-w-0 hover:underline">
          {pattern.title ?? pattern.pattern_number ?? 'Untitled'}
        </a>
      )}
      <DeleteButton onConfirm={handleDelete} />
    </div>
  )
}

function PurchaseModal({ material, onConfirm, onClose }) {
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

function EditMaterialModal({ material, projectId, onSaved, onClose }) {
  const urlMatch = material.notes?.match(/https?:\/\/[^\s]+/)
  const isScraped = !!urlMatch?.[0]
  const isPurchased = !!material.purchased

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-base-100 rounded-xl shadow-2xl w-full max-w-sm mx-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-base-300 shrink-0">
          <span className="font-semibold">Edit material</span>
          <button className="btn btn-sm btn-ghost text-lg leading-none" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4 overflow-y-auto">
          {!isScraped && (
            <div className="form-control">
              <label className="label py-1"><span className="label-text font-medium">Name <span className="text-error">*</span></span></label>
              <input type="text" className="input input-bordered input-sm w-full" value={name} onChange={e => setName(e.target.value)} required autoFocus />
            </div>
          )}

          <div className="form-control">
            <label className="label py-1"><span className="label-text font-medium">Quantity</span></label>
            <input type="text" className="input input-bordered input-sm w-full" placeholder="e.g. 2.5 yards" value={quantity} onChange={e => setQuantity(e.target.value)} autoFocus={isScraped} />
          </div>

          <div className="form-control">
            <label className="label py-1"><span className="label-text font-medium">{isPurchased ? 'Price paid' : 'Price'}</span></label>
            <label className="input input-bordered input-sm w-full flex items-center gap-2">
              <span className="text-base-content/40 text-sm select-none">$</span>
              <input type="number" className="grow" placeholder="0.00" value={price} onChange={e => setPrice(e.target.value)} min="0" step="0.01" />
            </label>
          </div>

          {!isScraped && (
            <>
              <div className="form-control">
                <label className="label py-1"><span className="label-text font-medium">Image</span></label>
                {imagePreview ? (
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
                )}
              </div>
              <div className="form-control">
                <label className="label py-1"><span className="label-text font-medium">Notes</span></label>
                <textarea className="textarea textarea-bordered textarea-sm w-full" rows={3} placeholder="Colour, weight…" value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            </>
          )}

          <div className="form-control">
            <label className="label py-1"><span className="label-text font-medium">Care instructions</span></label>
            <input
              type="text"
              className="input input-bordered input-sm w-full"
              placeholder="e.g. Machine wash cold, lay flat to dry"
              value={careInstructions}
              onChange={e => setCareInstructions(e.target.value)}
            />
          </div>

          <div className="form-control">
            <label className="label py-1"><span className="label-text font-medium">Grain direction</span></label>
            <select
              className="select select-bordered select-sm w-full"
              value={grainDirection}
              onChange={e => setGrainDirection(e.target.value)}
            >
              <option value="">— not specified —</option>
              <option value="straight">Straight grain</option>
              <option value="bias">Bias cut</option>
              <option value="cross">Cross grain</option>
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer py-1">
            <input
              type="checkbox"
              className="checkbox checkbox-sm"
              checked={!!preWash}
              onChange={e => setPreWash(e.target.checked ? 1 : 0)}
            />
            <span className="label-text">Pre-washed</span>
          </label>

          <div className="flex flex-col gap-2 mt-1">
            <button type="button" className="btn btn-ghost btn-sm w-full" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm w-full" disabled={loading || (!isScraped && !name.trim())}>
              {loading ? <span className="loading loading-spinner loading-xs" /> : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ChecklistItemModal({ item, projectId, mode: initialMode, onSaved, onClose }) {
  const [uiMode, setUiMode] = useState(initialMode)
  const [title, setTitle] = useState(item.title)
  const [notes, setNotes] = useState(item.notes ?? '')
  const [existingUrls, setExistingUrls] = useState(item.image_urls ?? [])
  const [newFiles, setNewFiles] = useState([]) // [{file, preview}]
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
          <span className="font-semibold">{uiMode === 'complete' ? 'Complete step' : 'Edit step'}</span>
          <div className="flex gap-1 shrink-0">
            {uiMode === 'complete' && (
              <button className="btn btn-sm btn-ghost" onClick={() => setUiMode('edit')} title="Edit">
                <Pencil className="w-4 h-4" />
              </button>
            )}
            <button className="btn btn-sm btn-ghost text-lg leading-none" onClick={onClose}>×</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4 overflow-y-auto">
          {uiMode === 'edit' ? (
            <div className="form-control">
              <label className="label py-1"><span className="label-text font-medium">Title</span></label>
              <input
                type="text"
                className="input input-bordered input-sm w-full"
                value={title}
                onChange={e => setTitle(e.target.value)}
                autoFocus
              />
            </div>
          ) : (
            <p className="text-sm font-medium">{item.title}</p>
          )}

          <div className="form-control">
            <label className="label py-1"><span className="label-text font-medium">Photos</span></label>
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
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>

          <div className="form-control">
            <label className="label py-1"><span className="label-text font-medium">Notes</span></label>
            <textarea
              className="textarea textarea-bordered textarea-sm w-full"
              rows={3}
              placeholder="How did it go?"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              autoFocus={uiMode === 'complete'}
            />
          </div>

          <div className="flex flex-col gap-2 mt-1">
            <button type="button" className="btn btn-ghost btn-sm w-full" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm w-full" disabled={loading}>
              {loading
                ? <span className="loading loading-spinner loading-xs" />
                : uiMode === 'complete' ? 'Mark done' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function MaterialRow({ material, projectId, onDelete, onToggle, onEdit }) {
  const urlMatch = material.notes?.match(/https?:\/\/[^\s]+/)
  const url = urlMatch?.[0]
  const isScraped = !!url
  const isPurchased = !!material.purchased

  async function handleDelete() {
    try {
      const res = await fetch(`${API}/api/projects/${projectId}/materials/${material.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      onDelete(material.id)
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  return (
    <div className={`flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-base-300 transition-colors ${isPurchased ? 'opacity-60' : ''}`}>
      <input
        type="checkbox"
        className="checkbox checkbox-sm shrink-0"
        checked={isPurchased}
        onChange={() => onToggle(material, isPurchased ? 0 : 1)}
      />
      <div className="w-12 h-12 flex-none rounded overflow-hidden bg-base-200 border border-base-300">
        {material.image_url
          ? <img src={resolveUrl(material.image_url)} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-base-content/30"><Package className="w-5 h-5" /></div>
        }
      </div>
      <div className="flex-1 min-w-0">
        {url
          ? <a href={url} target="_blank" rel="noreferrer" className={`text-sm font-medium truncate block hover:underline ${isPurchased ? 'line-through' : ''}`}>{material.name}</a>
          : <p className={`text-sm font-medium truncate ${isPurchased ? 'line-through' : ''}`}>{material.name}</p>
        }
        {material.quantity && (
          <p className="text-xs text-base-content/50 truncate">{material.quantity}</p>
        )}
      </div>
      {material.price != null && (
        <span className="text-xs text-base-content/60 shrink-0">${Number(material.price).toFixed(2)}</span>
      )}
      <button className="btn btn-xs btn-ghost shrink-0" onClick={() => onEdit(material)} title="Edit">
        <Pencil className="w-4 h-4" />
      </button>
      <DeleteButton onConfirm={handleDelete} />
    </div>
  )
}

function SortableChecklistItem({ item, projectId, onCheckChange, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 group px-2 py-1 rounded-lg hover:bg-base-300 transition-colors"
    >
      <button
        type="button"
        className="btn btn-xs btn-ghost px-0 shrink-0 cursor-grab active:cursor-grabbing touch-none"
        {...attributes}
        {...listeners}
        tabIndex={-1}
      >
        <GripVertical className="w-4 h-4 text-base-content/30" />
      </button>
      <input
        type="checkbox"
        className="checkbox checkbox-sm shrink-0"
        checked={!!item.checked}
        onChange={() => onCheckChange(item)}
      />
      {item.image_urls?.[0] && (
        <img src={resolveUrl(item.image_urls[0])} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
      )}
      <span className={`flex-1 text-sm min-w-0 truncate ${item.checked ? 'line-through text-base-content/40' : ''}`}>
        {item.title}
      </span>
      <button className="btn btn-xs btn-ghost shrink-0" onClick={() => onEdit(item)} title="Edit">
        <Pencil className="w-4 h-4" />
      </button>
      <DeleteButton onConfirm={() => onDelete(item.id)} />
    </li>
  )
}

function ChecklistSection({ projectId, initialItems }) {
  const [items, setItems] = useState(initialItems)
  const [newTitle, setNewTitle] = useState('')
  const [adding, setAdding] = useState(false)
  const [completingItem, setCompletingItem] = useState(null)
  const [editingItem, setEditingItem] = useState(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const checkedCount = items.filter(i => !!i.checked).length

  function handleSaved(updated) {
    setItems(prev => prev.map(i => i.id === updated.id ? updated : i))
    setCompletingItem(null)
    setEditingItem(null)
  }

  function handleCheckChange(item) {
    if (!item.checked) {
      setCompletingItem(item)
    } else {
      fetch(`${API}/api/projects/${projectId}/checklist/${item.id}/toggle`, { method: 'PATCH' })
        .then(r => r.json())
        .then(updated => setItems(prev => prev.map(i => i.id === item.id ? updated : i)))
        .catch(err => console.error('Uncheck failed:', err))
    }
  }

  async function handleDelete(itemId) {
    try {
      const res = await fetch(`${API}/api/projects/${projectId}/checklist/${itemId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      setItems(prev => prev.filter(i => i.id !== itemId))
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex(i => i.id === active.id)
    const newIndex = items.findIndex(i => i.id === over.id)
    const reordered = arrayMove(items, oldIndex, newIndex)
    setItems(reordered)
    fetch(`${API}/api/projects/${projectId}/checklist/reorder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: reordered.map(i => i.id) }),
    }).catch(err => console.error('Reorder failed:', err))
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!newTitle.trim()) return
    setAdding(true)
    try {
      const res = await fetch(`${API}/api/projects/${projectId}/checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim(), notes: '' }),
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const listRes = await fetch(`${API}/api/projects/${projectId}/checklist`)
      if (listRes.ok) setItems(await listRes.json())
      setNewTitle('')
    } catch (err) {
      console.error('Add failed:', err)
    } finally {
      setAdding(false)
    }
  }

  const activeModal = completingItem || editingItem

  return (
    <>
      {activeModal && (
        <ChecklistItemModal
          item={activeModal}
          projectId={projectId}
          mode={completingItem ? 'complete' : 'edit'}
          onSaved={handleSaved}
          onClose={() => { setCompletingItem(null); setEditingItem(null) }}
        />
      )}
      <div className="flex flex-col md:flex-1 md:min-h-0">
        <div className="flex items-center justify-between mb-3 shrink-0">
          <h2 className="text-lg font-medium">Checklist</h2>
          {items.length > 0 && (
            <span className="text-sm text-base-content/50">{checkedCount} / {items.length} done</span>
          )}
        </div>
        <form onSubmit={handleAdd} className="flex gap-2 mb-3 shrink-0">
          <input
            type="text"
            className="input input-bordered input-sm flex-1"
            placeholder="Add item…"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
          />
          <button type="submit" className="btn btn-sm btn-primary" disabled={adding || !newTitle.trim()}>
            {adding ? <span className="loading loading-spinner loading-xs" /> : 'Add'}
          </button>
        </form>
        <div className="md:flex-1 md:min-h-0 overflow-y-auto">
          {items.length > 0 ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                <ul className="space-y-2">
                  {items.map(item => (
                    <SortableChecklistItem
                      key={item.id}
                      item={item}
                      projectId={projectId}
                      onCheckChange={handleCheckChange}
                      onEdit={setEditingItem}
                      onDelete={handleDelete}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          ) : (
            <p className="text-base-content/40 text-sm px-2">No checklist items yet.</p>
          )}
        </div>
      </div>
    </>
  )
}

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { setCrumb } = useBreadcrumb()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [previewPattern, setPreviewPattern] = useState(null)
  const [previewMs, setPreviewMs] = useState(null)
  const [purchasingMaterial, setPurchasingMaterial] = useState(null)
  const [editingMaterial, setEditingMaterial] = useState(null)
  const editDialogRef = useRef(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editBudget, setEditBudget] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch(`${API}/api/projects/${id}`)
        if (!res.ok) throw new Error(`Error ${res.status}`)
        const data = await res.json()
        if (!cancelled) {
          setProject(data)
          setCrumb(data.name)
        }
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
      setCrumb(null)
    }
  }, [id, setCrumb])

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <span className="loading loading-spinner loading-lg" />
      </div>
    )
  }

  if (error) {
    return <div className="alert alert-error max-w-lg mx-auto mt-8"><span>{error}</span></div>
  }

  if (!project) return null

  const patternHandlers = {
    openPreview: setPreviewPattern,
    removePattern: (patternId) =>
      setProject(prev => ({ ...prev, patterns: prev.patterns.filter(p => p.id !== patternId) })),
  }

  const removeMaterial = (materialId) =>
    setProject(prev => ({ ...prev, materials: prev.materials.filter(m => m.id !== materialId) }))

  function handleSaveMaterial(updated) {
    setProject(prev => ({ ...prev, materials: prev.materials.map(m => m.id === updated.id ? updated : m) }))
    setEditingMaterial(null)
  }

  async function handleTogglePurchase(material, newPurchased) {
    if (newPurchased === 1) {
      setPurchasingMaterial(material)
    } else {
      try {
        const res = await fetch(`${API}/api/projects/${id}/materials/${material.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ purchased: 0, price: null, quantity: null }),
        })
        if (!res.ok) throw new Error(`Error ${res.status}`)
        const updated = await res.json()
        setProject(prev => ({ ...prev, materials: prev.materials.map(m => m.id === updated.id ? updated : m) }))
      } catch (err) {
        console.error('Toggle failed:', err)
      }
    }
  }

  async function handleConfirmPurchase({ price, quantity }) {
    try {
      const res = await fetch(`${API}/api/projects/${id}/materials/${purchasingMaterial.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchased: 1, price, quantity }),
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const updated = await res.json()
      setProject(prev => ({ ...prev, materials: prev.materials.map(m => m.id === updated.id ? updated : m) }))
      setPurchasingMaterial(null)
    } catch (err) {
      console.error('Confirm purchase failed:', err)
    }
  }

  async function removeMeasurementSet(msId) {
    try {
      const res = await fetch(`${API}/api/projects/${id}/measurement-sets/${msId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      setProject(prev => ({ ...prev, measurement_sets: prev.measurement_sets.filter(m => m.id !== msId) }))
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  async function removeGlobalMeasurementSet(globalMsId) {
    try {
      const res = await fetch(`${API}/api/projects/${id}/global-measurement-sets/${globalMsId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      setProject(prev => ({ ...prev, global_measurement_sets: prev.global_measurement_sets.filter(m => m.id !== globalMsId) }))
    } catch (err) {
      console.error('Unlink failed:', err)
    }
  }

  const STATUS_OPTIONS = [
    { value: 'to_start',    label: 'To Start',     cls: 'badge-ghost text-base-content/50' },
    { value: 'in_progress', label: 'In Progress',  cls: 'badge-success' },
    { value: 'on_hold',     label: 'On Hold',      cls: 'badge-warning' },
    { value: 'completed',   label: 'Completed',    cls: 'badge-info' },
  ]

  async function handleStatusChange(status) {
    try {
      const res = await fetch(`${API}/api/projects/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      setProject(prev => ({ ...prev, status }))
    } catch (err) {
      console.error('Status update failed:', err)
    }
  }

  function openEdit() {
    setEditName(project.name)
    setEditDesc(project.description)
    setEditBudget(project.budget != null ? String(project.budget) : '')
    setEditError(null)
    editDialogRef.current?.showModal()
  }

  async function handleUpdate(e) {
    e.preventDefault()
    setEditLoading(true)
    setEditError(null)
    try {
      const res = await fetch(`${API}/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          description: editDesc,
          budget: editBudget !== '' ? parseFloat(editBudget) : null,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || `Error ${res.status}`)
      }
      const updated = await res.json()
      setProject(prev => ({ ...prev, name: updated.name, description: updated.description, budget: updated.budget }))
      setCrumb(updated.name)
      editDialogRef.current?.close()
    } catch (err) {
      setEditError(err.message)
    } finally {
      setEditLoading(false)
    }
  }

  async function handleDeleteProject() {
    const res = await fetch(`${API}/api/projects/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      setError('Failed to delete project. Please try again.')
      return
    }
    navigate('/projects')
  }

  return (
    <>
      {previewPattern && (
        <PreviewModal pattern={previewPattern} onClose={() => setPreviewPattern(null)} />
      )}
      {previewMs && (
        <MeasurementSetModal ms={previewMs} onClose={() => setPreviewMs(null)} />
      )}
      {purchasingMaterial && (
        <PurchaseModal
          material={purchasingMaterial}
          onConfirm={handleConfirmPurchase}
          onClose={() => setPurchasingMaterial(null)}
        />
      )}
      {editingMaterial && (
        <EditMaterialModal
          material={editingMaterial}
          projectId={id}
          onSaved={handleSaveMaterial}
          onClose={() => setEditingMaterial(null)}
        />
      )}
      <ProjectFormModal
        dialogRef={editDialogRef}
        mode="edit"
        name={editName} setName={setEditName}
        desc={editDesc} setDesc={setEditDesc}
        budget={editBudget} setBudget={setEditBudget}
        loading={editLoading}
        error={editError}
        onSubmit={handleUpdate}
      />

      <div className="flex flex-col md:h-full gap-4 w-full">

        {/* Header */}
        <div className="shrink-0 w-full">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-semibold">{project.name}</h1>
            <div className="flex gap-2">
              <button className="btn btn-ghost btn-sm" onClick={openEdit}>
                <Pencil className="w-4 h-4" /> Edit project
              </button>
              <DeleteButton size="btn-sm" onConfirm={handleDeleteProject}>
                <Trash2 className="w-4 h-4" /> Delete project
              </DeleteButton>
              <Link to="/projects" className="btn btn-ghost btn-sm">← Back</Link>
            </div>
          </div>
          {project.description && (
            <p className="text-base-content/70">{project.description}</p>
          )}
          <div className="flex w-full items-center justify-between mt-2 text-sm text-base-content/50">
            <div className="flex gap-4 w-full items-center justify-between">
              {project.budget != null && <span>Budget: ${Number(project.budget).toFixed(2)}</span>}
              {(() => {
                const current = STATUS_OPTIONS.find(o => o.value === (project.status ?? 'to_start')) ?? STATUS_OPTIONS[0]
                return (
                  <div className="dropdown dropdown-end">
                    <div tabIndex={0} role="button" className={`badge cursor-pointer select-none ${current.cls}`}>
                      {current.label} ▾
                    </div>
                    <ul className="dropdown-content menu bg-base-100 border border-base-300 rounded-box shadow z-10 p-1 w-36 mt-1">
                      {STATUS_OPTIONS.map(opt => (
                        <li key={opt.value}>
                          <button
                            className={`text-sm ${opt.value === current.value ? 'font-semibold' : ''}`}
                            onClick={() => handleStatusChange(opt.value)}
                          >
                            <span className={`badge badge-xs ${opt.cls}`} />
                            {opt.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })()}
              {project.created_at && <span>Created: {new Date(project.created_at).toLocaleDateString()}</span>}
            </div>
          </div>
        </div>

        {/* 2×2 grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 md:grid-rows-2 gap-4 md:flex-1 md:min-h-0">

          {/* Patterns */}
          <div className="bg-base-200 rounded-xl p-4 flex flex-col md:min-h-0 md:overflow-hidden">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <h2 className="text-lg font-medium">Patterns</h2>
              <Link to={`/projects/${id}/patterns/add`} className="btn btn-primary btn-sm">+ Add</Link>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              {project.patterns?.length > 0 ? (
                <div className="space-y-1">
                  {project.patterns.map(p => (
                    <PatternRow key={p.id} pattern={p} projectId={id} onDelete={patternHandlers} />
                  ))}
                </div>
              ) : (
                <p className="text-base-content/40 text-sm px-2">No patterns added yet.</p>
              )}
            </div>
          </div>

          {/* Materials */}
          <div className="bg-base-200 rounded-xl p-4 flex flex-col md:min-h-0 md:overflow-hidden">
            <div className="flex items-center justify-between mb-1 shrink-0">
              <div>
                <h2 className="text-lg font-medium">Materials</h2>
                {(() => {
                  const spent = (project.materials ?? [])
                    .filter(m => m.purchased && m.price != null)
                    .reduce((sum, m) => sum + m.price, 0)
                  if (spent === 0) return null
                  return (
                    <p className="text-xs text-base-content/50 mt-0.5">
                      Expenses: ${spent.toFixed(2)}{project.budget != null ? ` / $${Number(project.budget).toFixed(2)}` : ''}
                    </p>
                  )
                })()}
              </div>
              <Link to={`/projects/${id}/materials/add`} className="btn btn-primary btn-sm">+ Add</Link>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto mt-2">
              {project.materials?.length > 0 ? (
                <div className="space-y-1">
                  {[...project.materials]
                    .sort((a, b) => (b.purchased || 0) - (a.purchased || 0))
                    .map(m => (
                      <MaterialRow key={m.id} material={m} projectId={id} onDelete={removeMaterial} onToggle={handleTogglePurchase} onEdit={setEditingMaterial} />
                    ))}
                </div>
              ) : (
                <p className="text-base-content/40 text-sm px-2">No materials added yet.</p>
              )}
            </div>
          </div>

          {/* Checklist */}
          <div className="bg-base-200 rounded-xl p-4 flex flex-col md:min-h-0 md:overflow-hidden">
            <ChecklistSection projectId={id} initialItems={project.checklist ?? []} />
          </div>

          {/* Measurements */}
          <div className="bg-base-200 rounded-xl p-4 flex flex-col md:min-h-0 md:overflow-hidden">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <h2 className="text-lg font-medium">Measurements</h2>
              <Link to={`/projects/${id}/measurements/add`} className="btn btn-primary btn-sm">+ Add</Link>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              {(project.global_measurement_sets?.length > 0 || project.measurement_sets?.length > 0) ? (
                <div className="space-y-1">
                  {project.global_measurement_sets?.map(ms => (
                    <div
                      key={`g-${ms.id}`}
                      className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-base-300 transition-colors cursor-pointer"
                      onClick={() => setPreviewMs({ ...ms, editUrl: `/measurements/${ms.id}/edit` })}
                    >
                      <span className="flex-1 text-sm font-medium truncate min-w-0">{ms.name}</span>
                      <span className="badge badge-ghost badge-xs shrink-0">Shared</span>
                      <button
                        className="btn btn-xs btn-ghost shrink-0"
                        onClick={e => { e.stopPropagation(); navigate(`/measurements/${ms.id}/edit`) }}
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <DeleteButton className="shrink-0" onConfirm={() => removeGlobalMeasurementSet(ms.id)} />
                    </div>
                  ))}
                  {project.measurement_sets?.map(ms => (
                    <div
                      key={ms.id}
                      className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-base-300 transition-colors cursor-pointer"
                      onClick={() => setPreviewMs({ ...ms, editUrl: `/projects/${id}/measurements/${ms.id}/edit` })}
                    >
                      <span className="flex-1 text-sm font-medium truncate min-w-0">{ms.name}</span>
                      <button
                        className="btn btn-xs btn-ghost shrink-0"
                        onClick={e => { e.stopPropagation(); navigate(`/projects/${id}/measurements/${ms.id}/edit`) }}
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <DeleteButton className="shrink-0" onConfirm={() => removeMeasurementSet(ms.id)} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-base-content/40 text-sm px-2">No measurements added yet.</p>
              )}
            </div>
          </div>

        </div>

        {/* Progress photos */}
        <div className="bg-base-200 rounded-xl p-4 flex flex-col shrink-0 md:h-52">
          <ProgressPhotos projectId={id} initialImages={project.progress_images ?? []} />
        </div>

      </div>
    </>
  )
}

function ProgressPhotos({ projectId, initialImages }) {
  const [images, setImages] = useState(initialImages)
  const [uploading, setUploading] = useState(false)

  async function handleFiles(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploading(true)
    try {
      const uploaded = await Promise.all(
        files.map(async file => {
          const fd = new FormData()
          fd.append('file', file)
          const res = await fetch(`${API}/api/projects/${projectId}/progress-images`, {
            method: 'POST', body: fd,
          })
          if (!res.ok) throw new Error(`Upload failed ${res.status}`)
          return res.json()
        })
      )
      setImages(prev => [...prev, ...uploaded])
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleDelete(imageId) {
    await fetch(`${API}/api/projects/${projectId}/progress-images/${imageId}`, { method: 'DELETE' })
    setImages(prev => prev.filter(i => i.id !== imageId))
  }

  return (
    <>
      <div className="flex items-center justify-between mb-3 shrink-0">
        <h2 className="text-lg font-medium">Progress photos</h2>
        <label className={`btn btn-primary btn-sm ${uploading ? 'btn-disabled' : ''}`}>
          {uploading ? <span className="loading loading-spinner loading-xs" /> : '+ Add'}
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleFiles} />
        </label>
      </div>
      <div className="flex-1 min-h-0 flex items-stretch overflow-x-auto gap-3 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        {images.length === 0 && !uploading && (
          <p className="text-base-content/40 text-sm self-center">No progress photos yet.</p>
        )}
        {images.map(img => (
          <div key={img.id} className="relative shrink-0 h-full aspect-square rounded-lg overflow-hidden group">
            <img src={resolveUrl(img.url)} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            <DeleteButton
              onConfirm={() => handleDelete(img.id)}
              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </div>
        ))}
      </div>
    </>
  )
}
