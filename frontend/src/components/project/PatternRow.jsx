import { useState } from 'react'
import { Eye } from 'lucide-react'
import { API } from '../../api'
import DeleteButton from '../DeleteButton'
import PatternModal from './PatternModal'
import { PDF_THUMB_SCALE } from './utils'

export default function PatternRow({ pattern, projectId, onDelete, onSaved }) {
  const [viewing, setViewing] = useState(false)
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
    <>
      {viewing && (
        <PatternModal
          pattern={pattern}
          projectId={projectId}
          onSaved={updated => { onSaved(updated); setViewing(false) }}
          onClose={() => setViewing(false)}
        />
      )}
      <div className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-base-300 transition-colors">
        <div
          className="w-12 h-12 flex-none rounded overflow-hidden bg-base-200 border border-base-300 cursor-pointer"
          onClick={() => isUpload ? onDelete.openPreview(pattern) : setViewing(true)}
        >
          {renderThumbnail()}
        </div>
        <span className="flex-1 text-sm font-medium truncate min-w-0">{pattern.title ?? pattern.pattern_number ?? 'Untitled'}</span>
        <button className="btn btn-xs btn-ghost shrink-0" onClick={() => setViewing(true)} title="View">
          <Eye className="w-4 h-4" />
        </button>
        <DeleteButton onConfirm={handleDelete} />
      </div>
    </>
  )
}
