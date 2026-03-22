import { useEffect, useState, useRef } from 'react'

const PDF_SCALE = 160 / 816  // card width / standard PDF width
import { useParams, Link } from 'react-router-dom'
import { useBreadcrumb } from '../contexts/BreadcrumbContext'


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

function PatternCard({ pattern, projectId, onDelete }) {
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
      const iframeSize = 816
      return (
        <div className="relative w-full h-full overflow-hidden">
          <iframe
            src={`http://localhost:8000${pattern.url}`}
            style={{
              width: iframeSize,
              height: iframeSize,
              transform: `scale(${PDF_SCALE})`,
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
        <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 4h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z" />
        </svg>
      </div>
    )
  }

  function handleCardClick() {
    if (isUpload) {
      onDelete.openPreview(pattern)
    } else {
      window.open(pattern.url, '_blank', 'noopener')
    }
  }

  async function handleDelete(e) {
    e.stopPropagation()
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
    <div className="flex-none flex flex-col gap-1" style={{ width: 160 }}>
      <div
        className="relative w-40 h-40 rounded-xl overflow-hidden bg-base-200 border border-base-300 cursor-pointer hover:opacity-90 transition-opacity"
        onClick={handleCardClick}
      >
        {renderThumbnail()}
        <button
          className="absolute top-1 right-1 btn btn-xs btn-circle btn-error opacity-80 hover:opacity-100"
          onClick={handleDelete}
          title="Delete"
        >
          ×
        </button>
      </div>
      <p className="text-xs font-medium truncate w-40 text-center">
        {pattern.title ?? pattern.pattern_number ?? 'Untitled'}
      </p>
    </div>
  )
}

export default function ProjectDetail() {
  const { id } = useParams()
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

  return (
    <>
      {previewPattern && (
        <PreviewModal pattern={previewPattern} onClose={() => setPreviewPattern(null)} />
      )}
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-semibold">{project.name}</h1>
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

        {/* Patterns */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-medium">Patterns</h2>
            <Link to={`/projects/${id}/patterns/add`} className="btn btn-primary btn-sm">
              + Add Pattern
            </Link>
          </div>
          {project.patterns?.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {project.patterns.map(p => (
                <PatternCard
                  key={p.id}
                  pattern={p}
                  projectId={id}
                  onDelete={patternHandlers}
                />
              ))}
            </div>
          ) : (
            <p className="text-base-content/40 text-sm">No patterns added yet.</p>
          )}
        </section>

        {/* Materials */}
        <section>
          <h2 className="text-lg font-medium mb-3">Materials</h2>
          {project.materials?.length > 0 ? (
            <div className="grid gap-3">
              {project.materials.map(m => (
                <div key={m.id} className="card bg-base-100 border border-base-300">
                  <div className="card-body py-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{m.name}</p>
                      {m.purchased && <span className="badge badge-success badge-sm">Purchased</span>}
                    </div>
                    {m.quantity && (
                      <p className="text-sm text-base-content/60">{m.quantity} {m.unit}</p>
                    )}
                    {m.notes && <p className="text-sm">{m.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-base-content/40 text-sm">No materials added yet.</p>
          )}
        </section>

        {/* Checklist */}
        <section>
          <h2 className="text-lg font-medium mb-3">Checklist</h2>
          {project.checklist?.length > 0 ? (
            <ul className="space-y-2">
              {project.checklist.map(item => (
                <li key={item.id} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    defaultChecked={item.checked}
                    readOnly
                  />
                  <span className={item.checked ? 'line-through text-base-content/40' : ''}>
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-base-content/40 text-sm">No checklist items yet.</p>
          )}
        </section>
      </div>
    </>
  )
}
