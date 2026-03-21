import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useBreadcrumb } from '../contexts/BreadcrumbContext'

export default function ProjectDetail() {
  const { id } = useParams()
  const { setCrumb } = useBreadcrumb()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          {project.status && (
            <span className="badge">{project.status}</span>
          )}
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
        <h2 className="text-lg font-medium mb-3">Patterns</h2>
        {project.patterns?.length > 0 ? (
          <div className="grid gap-3">
            {project.patterns.map(p => (
              <div key={p.id} className="card bg-base-100 border border-base-300">
                <div className="card-body py-3">
                  <p className="font-medium">{p.title ?? p.pattern_number}</p>
                  {p.brand && <p className="text-sm text-base-content/60">{p.brand}</p>}
                  {p.notes && <p className="text-sm">{p.notes}</p>}
                </div>
              </div>
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
  )
}
