import { useState } from 'react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { API } from '../../api'
import ChecklistItemModal from './ChecklistItemModal'
import SortableChecklistItem from './SortableChecklistItem'

export default function ChecklistSection({ projectId, initialItems }) {
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
          mode={completingItem ? 'complete' : 'view'}
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
                      onCheckChange={handleCheckChange}
                      onEdit={item => setEditingItem(item)}
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
