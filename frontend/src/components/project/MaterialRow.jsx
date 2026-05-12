import { useState } from 'react'
import { Eye, Package } from 'lucide-react'
import { API } from '../../api'
import DeleteButton from '../DeleteButton'
import ImageViewerModal from './ImageViewerModal'
import { resolveUrl } from './utils'

export default function MaterialRow({ material, projectId, onDelete, onToggle, onEdit }) {
  const urlMatch = material.notes?.match(/https?:\/\/[^\s]+/)
  const url = urlMatch?.[0]
  const isPurchased = !!material.purchased
  const [viewingImage, setViewingImage] = useState(false)

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
    <>
      {viewingImage && material.image_url && (
        <ImageViewerModal images={[resolveUrl(material.image_url)]} onClose={() => setViewingImage(false)} />
      )}
      <div className={`flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-base-300 transition-colors ${isPurchased ? 'opacity-60' : ''}`}>
        <input
          type="checkbox"
          className="checkbox checkbox-sm shrink-0"
          checked={isPurchased}
          onChange={() => onToggle(material, isPurchased ? 0 : 1)}
        />
        <div
          className="w-12 h-12 flex-none rounded overflow-hidden bg-base-200 border border-base-300 cursor-pointer"
          onClick={() => material.image_url && setViewingImage(true)}
        >
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
        <button className="btn btn-xs btn-ghost shrink-0" onClick={() => onEdit(material)} title="View">
          <Eye className="w-4 h-4" />
        </button>
        <DeleteButton onConfirm={handleDelete} />
      </div>
    </>
  )
}
