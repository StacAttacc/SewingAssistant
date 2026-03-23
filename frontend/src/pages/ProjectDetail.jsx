import { useEffect, useState, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useBreadcrumb } from '../contexts/BreadcrumbContext'
import { Eye, ExternalLink, Trash2, Package } from 'lucide-react'

const PDF_THUMB_SIZE = 48
const PDF_THUMB_SCALE = PDF_THUMB_SIZE / 816

function PreviewModal({ pattern, onClose }) {
  const iframeRef = useRef(null)
  const isPDF = pattern.url?.endsWith('.pdf')
  const src = `http://localhost:8000${pattern.url}`

  function handlePrint() {
    if (isPDF) {
      iframeRef.current?.contentWindow?.print()
    } else {
      window.open(src, '_blank', 'noopener')
    }
  }

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
            <button className="btn btn-sm btn-ghost" onClick={handlePrint}>Print</button>
            <button className="btn btn-sm btn-ghost text-lg leading-none" onClick={onClose}>×</button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden flex items-center justify-center p-4">
          {isPDF ? (
            <iframe
              ref={iframeRef}
              src={src}
              className="w-full h-full rounded"
              title="Pattern preview"
            />
          ) : (
            <img
              src={src}
              alt={pattern.title ?? 'Pattern'}
              className="max-w-full max-h-full object-contain rounded"
            />
          )}
        </div>
      </div>
    </div>
  )
}

function PatternRow({ pattern, projectId, onDelete }) {
  const isUpload = pattern.source === 'upload'
  const isPDF = pattern.url?.endsWith('.pdf')

  function renderThumbnail() {
    if (isUpload && !isPDF && pattern.url) {
      return (
        <img
          src={`http://localhost:8000${pattern.url}`}
          alt=""
          className="w-full h-full object-cover"
        />
      )
    }
    if (isUpload && isPDF && pattern.url) {
      return (
        <div className="relative w-full h-full overflow-hidden">
          <iframe
            src={`http://localhost:8000${pattern.url}`}
            style={{
              width: 816,
              height: 816,
              transform: `scale(${PDF_THUMB_SCALE})`,
              transformOrigin: 'top left',
              pointerEvents: 'none',
              position: 'absolute',
              top: 0,
              left: 0,
            }}
            title=""
          />
        </div>
      )
    }
    if (!isUpload && pattern.image_url) {
      return (
        <img
          src={pattern.image_url}
          alt=""
          className="w-full h-full object-cover"
        />
      )
    }
    return (
      <div className="w-full h-full flex items-center justify-center text-base-content/30">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 4h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z" />
        </svg>
      </div>
    )
  }

  function handleAction() {
    if (isUpload) {
      onDelete.openPreview(pattern)
    } else {
      window.open(pattern.url, '_blank', 'noopener')
    }
  }

  async function handleDelete() {
    try {
      const res = await fetch(
        `http://localhost:8000/api/projects/${projectId}/patterns/${pattern.id}`,
        { method: 'DELETE' }
      )
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
      <span className="flex-1 text-sm font-medium truncate min-w-0">
        {pattern.title ?? pattern.pattern_number ?? 'Untitled'}
      </span>
      <button
        className="btn btn-xs btn-ghost"
        onClick={handleAction}
        title={isUpload ? 'Preview' : 'Open'}
      >
        {isUpload
          ? <Eye className="w-4 h-4" />
          : <ExternalLink className="w-4 h-4" />
        }
      </button>
      <button
        className="btn btn-xs btn-ghost text-error"
        onClick={handleDelete}
        title="Delete"
      >
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
      const res = await fetch(
        `http://localhost:8000/api/projects/${projectId}/materials/${material.id}`,
        { method: 'DELETE' }
      )
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
        <p className="text-sm font-medium truncate">{material.name}</p>
        {material.quantity && (
          <p className="text-xs text-base-content/50 truncate">{material.quantity}{material.unit ? ` ${material.unit}` : ''}</p>
        )}
      </div>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-xs btn-ghost"
          title="Open"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      ) : (
        <span className="w-7" />
      )}
      <button
        className="btn btn-xs btn-ghost text-error"
        onClick={handleDelete}
        title="Delete"
      >
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
      const res = await fetch(
        `http://localhost:8000/api/projects/${projectId}/checklist/${itemId}/toggle`,
        { method: 'PATCH' }
      )
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const updated = await res.json()
      setItems(prev => prev.map(i => i.id === itemId ? updated : i))
    } catch (err) {
      console.error('Toggle failed:', err)
    }
  }

  async function handleDelete(itemId) {
    try {
      const res = await fetch(
        `http://localhost:8000/api/projects/${projectId}/checklist/${itemId}`,
        { method: 'DELETE' }
      )
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
      const res = await fetch(
        `http://localhost:8000/api/projects/${projectId}/checklist`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: newTitle.trim(), notes: '' }),
        }
      )
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const listRes = await fetch(`http://localhost:8000/api/projects/${projectId}/checklist`)
      if (listRes.ok) setItems(await listRes.json())
      setNewTitle('')
    } catch (err) {
      console.error('Add failed:', err)
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <form onSubmit={handleAdd} className="flex gap-2 mb-3">
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
      <div className="flex-1 min-h-0 overflow-y-auto">
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
                <button
                  className="btn btn-xs btn-ghost text-error opacity-0 group-hover:opacity-100"
                  onClick={() => handleDelete(item.id)}
                  title="Delete"
                >
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

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch(`http://localhost:8000/api/projects/${id}`)
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
    return (
      <div className="alert alert-error max-w-lg mx-auto mt-8">
        <span>{error}</span>
      </div>
    )
  }

  if (!project) return null

  const patternHandlers = {
    openPreview: setPreviewPattern,
    removePattern: (patternId) =>
      setProject(prev => ({ ...prev, patterns: prev.patterns.filter(p => p.id !== patternId) })),
  }

  const removeMaterial = (materialId) =>
    setProject(prev => ({ ...prev, materials: prev.materials.filter(m => m.id !== materialId) }))

  async function handleDeleteProject() {
    if (!confirm(`Delete "${project.name}"? This cannot be undone.`)) return
    await fetch(`http://localhost:8000/api/projects/${id}`, { method: 'DELETE' })
    navigate('/projects')
  }

  return (
    <>
      {previewPattern && (
        <PreviewModal pattern={previewPattern} onClose={() => setPreviewPattern(null)} />
      )}
      <div className="flex flex-col h-full gap-6">
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
          <div className="flex gap-4 mt-3 text-sm text-base-content/50">
            {project.budget != null && <span>Budget: ${Number(project.budget).toFixed(2)}</span>}
            {project.created_at && (
              <span>Created: {new Date(project.created_at).toLocaleDateString()}</span>
            )}
          </div>
        </div>

        {/* 3-column content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0">

          {/* Patterns */}
          <div className="bg-base-200 rounded-xl p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <h2 className="text-lg font-medium">Patterns</h2>
              <Link to={`/projects/${id}/patterns/add`} className="btn btn-primary btn-sm">+ Add</Link>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              {project.patterns?.length > 0 ? (
                <div className="space-y-1">
                  {project.patterns.map(p => (
                    <PatternRow
                      key={p.id}
                      pattern={p}
                      projectId={id}
                      onDelete={patternHandlers}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-base-content/40 text-sm px-2">No patterns added yet.</p>
              )}
            </div>
          </div>

          {/* Materials */}
          <div className="bg-base-200 rounded-xl p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <h2 className="text-lg font-medium">Materials</h2>
              <Link to={`/projects/${id}/materials/add`} className="btn btn-primary btn-sm">+ Add</Link>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              {project.materials?.length > 0 ? (
                <div className="space-y-1">
                  {project.materials.map(m => (
                    <MaterialRow
                      key={m.id}
                      material={m}
                      projectId={id}
                      onDelete={removeMaterial}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-base-content/40 text-sm px-2">No materials added yet.</p>
              )}
            </div>
          </div>

          {/* Checklist */}
          <div className="bg-base-200 rounded-xl p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <h2 className="text-lg font-medium">Checklist</h2>
            </div>
            <ChecklistSection projectId={id} initialItems={project.checklist ?? []} />
          </div>

        </div>
      </div>
    </>
  )
}
