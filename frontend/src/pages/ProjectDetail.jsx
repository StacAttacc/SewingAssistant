import { useEffect, useState, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useBreadcrumb } from '../contexts/BreadcrumbContext'
import { Trash2, Pencil, Eye } from 'lucide-react'
import { API } from '../api'
import ProjectFormModal from '../components/ProjectFormModal'
import DeleteButton from '../components/DeleteButton'
import PreviewModal from '../components/project/PreviewModal'
import MeasurementSetModal from '../components/project/MeasurementSetModal'
import PatternRow from '../components/project/PatternRow'
import PurchaseModal from '../components/project/PurchaseModal'
import EditMaterialModal from '../components/project/EditMaterialModal'
import MaterialRow from '../components/project/MaterialRow'
import ChecklistSection from '../components/project/ChecklistSection'
import ProgressPhotos from '../components/project/ProgressPhotos'
import { fmtMoney, fmtDate } from '../components/project/utils'

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
    updatePattern: (updated) =>
      setProject(prev => ({ ...prev, patterns: prev.patterns.map(p => p.id === updated.id ? updated : p) })),
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
          <div className="flex flex-wrap gap-x-3 gap-y-1 w-full items-center justify-between mt-2 text-sm text-base-content/50">
            {(() => {
              const matSpent = (project.materials ?? [])
                .filter(m => m.purchased && m.price != null)
                .reduce((sum, m) => sum + m.price, 0)
              const patSpent = (project.patterns ?? [])
                .filter(p => p.price_paid != null)
                .reduce((sum, p) => sum + p.price_paid, 0)
              const totalSpent = matSpent + patSpent
              if (totalSpent === 0 && project.budget == null) return null
              return (
                <span className="shrink-0">
                  ${fmtMoney(totalSpent)}
                  {project.budget != null && ` / $${fmtMoney(Number(project.budget))}`}
                </span>
              )
            })()}
            {(() => {
              const current = STATUS_OPTIONS.find(o => o.value === (project.status ?? 'to_start')) ?? STATUS_OPTIONS[0]
              return (
                <div className="dropdown dropdown-end shrink-0">
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
            {project.created_at && (
              <span className="shrink-0" title={new Date(project.created_at).toLocaleDateString()}>
                {fmtDate(project.created_at)}
              </span>
            )}
          </div>
        </div>

        {/* 2×2 grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 md:grid-rows-2 gap-4 md:flex-1 md:min-h-0">

          {/* Patterns */}
          <div className="bg-base-200 rounded-xl p-4 flex flex-col md:min-h-0 md:overflow-hidden">
            <div className="flex items-center justify-between mb-1 shrink-0">
              <div>
                <h2 className="text-lg font-medium">Patterns</h2>
                {(() => {
                  const spent = (project.patterns ?? [])
                    .filter(p => p.price_paid != null)
                    .reduce((sum, p) => sum + p.price_paid, 0)
                  if (spent === 0) return null
                  return (
                    <p className="text-xs text-base-content/50 mt-0.5">
                      Expenses: ${spent.toFixed(2)}
                    </p>
                  )
                })()}
              </div>
              <Link to={`/projects/${id}/patterns/add`} className="btn btn-primary btn-sm">+ Add</Link>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto mt-2">
              {project.patterns?.length > 0 ? (
                <div className="space-y-1">
                  {project.patterns.map(p => (
                    <PatternRow key={p.id} pattern={p} projectId={id} onDelete={patternHandlers} onSaved={patternHandlers.updatePattern} />
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
                      Expenses: ${spent.toFixed(2)}
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
                    <div key={`g-${ms.id}`} className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-base-300 transition-colors">
                      <span className="flex-1 text-sm font-medium truncate min-w-0">{ms.name}</span>
                      <span className="badge badge-ghost badge-xs shrink-0">Shared</span>
                      <button className="btn btn-xs btn-ghost shrink-0" onClick={() => setPreviewMs({ ...ms, editUrl: `/measurements/${ms.id}/edit` })} title="View">
                        <Eye className="w-4 h-4" />
                      </button>
                      <DeleteButton className="shrink-0" onConfirm={() => removeGlobalMeasurementSet(ms.id)} />
                    </div>
                  ))}
                  {project.measurement_sets?.map(ms => (
                    <div key={ms.id} className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-base-300 transition-colors">
                      <span className="flex-1 text-sm font-medium truncate min-w-0">{ms.name}</span>
                      <button className="btn btn-xs btn-ghost shrink-0" onClick={() => setPreviewMs({ ...ms, editUrl: `/projects/${id}/measurements/${ms.id}/edit` })} title="View">
                        <Eye className="w-4 h-4" />
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
