import { useState } from 'react'
import { API } from '../../api'
import DeleteButton from '../DeleteButton'
import ImageViewerModal from './ImageViewerModal'
import { resolveUrl } from './utils'

export default function ProgressPhotos({ projectId, initialImages }) {
  const [images, setImages] = useState(initialImages)
  const [uploading, setUploading] = useState(false)
  const [viewingIndex, setViewingIndex] = useState(null)

  async function handleFiles(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploading(true)
    try {
      const uploaded = await Promise.all(
        files.map(async file => {
          const fd = new FormData()
          fd.append('file', file)
          const res = await fetch(`${API}/api/projects/${projectId}/progress-images`, {
            method: 'POST', body: fd,
          })
          if (!res.ok) throw new Error(`Upload failed ${res.status}`)
          return res.json()
        })
      )
      setImages(prev => [...prev, ...uploaded])
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleDelete(imageId) {
    await fetch(`${API}/api/projects/${projectId}/progress-images/${imageId}`, { method: 'DELETE' })
    setImages(prev => prev.filter(i => i.id !== imageId))
  }

  const resolvedUrls = images.map(img => resolveUrl(img.url))

  return (
    <>
      {viewingIndex !== null && (
        <ImageViewerModal images={resolvedUrls} startIndex={viewingIndex} onClose={() => setViewingIndex(null)} />
      )}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <h2 className="text-lg font-medium">Progress photos</h2>
        <label className={`btn btn-primary btn-sm ${uploading ? 'btn-disabled' : ''}`}>
          {uploading ? <span className="loading loading-spinner loading-xs" /> : '+ Add'}
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleFiles} />
        </label>
      </div>
      <div className="flex-1 min-h-0 flex items-stretch overflow-x-auto gap-3 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        {images.length === 0 && !uploading && (
          <p className="text-base-content/40 text-sm self-center">No progress photos yet.</p>
        )}
        {images.map((img, i) => (
          <div
            key={img.id}
            className="relative shrink-0 h-full aspect-square rounded-lg overflow-hidden group cursor-pointer"
            onClick={() => setViewingIndex(i)}
          >
            <img src={resolvedUrls[i]} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            <DeleteButton
              onConfirm={() => handleDelete(img.id)}
              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </div>
        ))}
      </div>
    </>
  )
}
