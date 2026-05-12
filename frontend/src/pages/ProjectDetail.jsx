import { useEffect, useState, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useBreadcrumb } from '../contexts/BreadcrumbContext'
import { Trash2, Package, Pencil } from 'lucide-react'
import { API } from '../api'
import { MEASUREMENTS } from '../constants/measurements'
import ProjectFormModal from '../components/ProjectFormModal'

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
      <button className="btn btn-xs btn-ghost text-error" onClick={handleDelete} title="Delete">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}

function PurchaseModal({ material, onConfirm, onClose }) {
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
            <p className="font-medium text-sm truncate">{material.name}</p>
            {material.notes && <p className="text-xs text-base-content/50 mt-0.5 line-clamp-2">{material.notes}</p>}
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

function MaterialRow({ material, projectId, onDelete, onToggle }) {
  const urlMatch = material.notes?.match(/https?:\/\/[^\s]+/)
  const url = urlMatch?.[0]
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
      <button className="btn btn-xs btn-ghost text-error" onClick={handleDelete} title="Delete">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}

function ChecklistSection({ projectId, initialItems }) {
  const [items, setItems] = useState(initialItems)
  const [newTitle, setNewTitle] = useState('')
  const [adding, setAdding] = useState(false)

  async function handleToggle(itemId) {
    try {
      const res = await fetch(`${API}/api/projects/${projectId}/checklist/${itemId}/toggle`, { method: 'PATCH' })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const updated = await res.json()
      setItems(prev => prev.map(i => i.id === itemId ? updated : i))
    } catch (err) {
      console.error('Toggle failed:', err)
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

  return (
    <div className="flex flex-col md:flex-1 md:min-h-0">
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
          <ul className="space-y-2">
            {items.map(item => (
              <li key={item.id} className="flex items-center gap-3 group px-2 py-1 rounded-lg hover:bg-base-300 transition-colors">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm"
                  checked={!!item.checked}
                  onChange={() => handleToggle(item.id)}
                />
                <span className={`flex-1 text-sm ${item.checked ? 'line-through text-base-content/40' : ''}`}>
                  {item.title}
                </span>
                <button className="btn btn-xs text-error" onClick={() => handleDelete(item.id)} title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-base-content/40 text-sm px-2">No checklist items yet.</p>
        )}
      </div>
    </div>
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
    if (!confirm(`Delete "${project.name}"? This cannot be undone.`)) return
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
              <button className="btn btn-ghost btn-sm text-error" onClick={handleDeleteProject}>
                <Trash2 className="w-4 h-4" /> Delete project
              </button>
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
                      <MaterialRow key={m.id} material={m} projectId={id} onDelete={removeMaterial} onToggle={handleTogglePurchase} />
                    ))}
                </div>
              ) : (
                <p className="text-base-content/40 text-sm px-2">No materials added yet.</p>
              )}
            </div>
          </div>

          {/* Checklist */}
          <div className="bg-base-200 rounded-xl p-4 flex flex-col md:min-h-0 md:overflow-hidden">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <h2 className="text-lg font-medium">Checklist</h2>
            </div>
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
                      <button
                        className="btn btn-xs btn-ghost text-error shrink-0"
                        onClick={e => { e.stopPropagation(); removeGlobalMeasurementSet(ms.id) }}
                        title="Remove from project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
                      <button
                        className="btn btn-xs btn-ghost text-error shrink-0"
                        onClick={e => { e.stopPropagation(); removeMeasurementSet(ms.id) }}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-base-content/40 text-sm px-2">No measurements added yet.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
