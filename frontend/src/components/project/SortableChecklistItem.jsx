import { useState } from 'react'
import { GripVertical, Eye } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import DeleteButton from '../DeleteButton'
import ImageViewerModal from './ImageViewerModal'
import { resolveUrl } from './utils'

export default function SortableChecklistItem({ item, onCheckChange, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const [viewingImages, setViewingImages] = useState(false)
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  const resolvedImages = (item.image_urls ?? []).map(resolveUrl)
  return (
    <>
      {viewingImages && resolvedImages.length > 0 && (
        <ImageViewerModal images={resolvedImages} onClose={() => setViewingImages(false)} />
      )}
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
        {resolvedImages[0] && (
          <img
            src={resolvedImages[0]}
            alt=""
            className="w-8 h-8 rounded object-cover shrink-0 cursor-pointer"
            onClick={() => setViewingImages(true)}
          />
        )}
        <span className={`flex-1 text-sm min-w-0 truncate ${item.checked ? 'line-through text-base-content/40' : ''}`}>
          {item.title}
        </span>
        <button className="btn btn-xs btn-ghost shrink-0" onClick={() => onEdit(item)} title="View">
          <Eye className="w-4 h-4" />
        </button>
        <DeleteButton onConfirm={() => onDelete(item.id)} />
      </li>
    </>
  )
}
