import { useEffect, useState, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useBreadcrumb } from '../contexts/BreadcrumbContext'
import { Trash2, Package, Pencil } from 'lucide-react'
import { API } from '../api'
import { MEASUREMENTS } from '../constants/measurements'

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

function MaterialRow({ material, projectId, onDelete }) {
  const urlMatch = material.notes?.match(/https?:\/\/[^\s]+/)
  const url = urlMatch?.[0]

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
    <div className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-base-300 transition-colors">
      <div className="w-12 h-12 flex-none rounded overflow-hidden bg-base-200 border border-base-300">
        {material.image_url
          ? <img src={material.image_url} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-base-content/30"><Package className="w-5 h-5" /></div>
        }
      </div>
      <div className="flex-1 min-w-0">
        {url
          ? <a href={url} target="_blank" rel="noreferrer" className="text-sm font-medium truncate block hover:underline">{material.name}</a>
          : <p className="text-sm font-medium truncate">{material.name}</p>
        }
        {material.quantity && (
          <p className="text-xs text-base-content/50 truncate">{material.quantity}{material.unit ? ` ${material.unit}` : ''}</p>
        )}
      </div>
      <span className="w-7" />
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

      <div className="flex flex-col md:h-full gap-4">

        {/* Header */}
        <div className="shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-semibold">{project.name}</h1>
            <div className="flex gap-2">
              <button className="btn btn-ghost btn-sm text-error" onClick={handleDeleteProject}>
                <Trash2 className="w-4 h-4" /> Delete project
              </button>
              <Link to="/projects" className="btn btn-ghost btn-sm">← Projects</Link>
            </div>
          </div>
          {project.description && (
            <p className="text-base-content/70">{project.description}</p>
          )}
          <div className="flex gap-4 mt-2 text-sm text-base-content/50">
            {project.budget != null && <span>Budget: ${Number(project.budget).toFixed(2)}</span>}
            {project.created_at && <span>Created: {new Date(project.created_at).toLocaleDateString()}</span>}
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
            <div className="flex items-center justify-between mb-3 shrink-0">
              <h2 className="text-lg font-medium">Materials</h2>
              <Link to={`/projects/${id}/materials/add`} className="btn btn-primary btn-sm">+ Add</Link>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              {project.materials?.length > 0 ? (
                <div className="space-y-1">
                  {project.materials.map(m => (
                    <MaterialRow key={m.id} material={m} projectId={id} onDelete={removeMaterial} />
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
