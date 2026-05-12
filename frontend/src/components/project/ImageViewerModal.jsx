import { useState } from 'react'

export default function ImageViewerModal({ images, startIndex = 0, onClose }) {
  const [idx, setIdx] = useState(startIndex)
  const total = images.length
  function prev(e) { e.stopPropagation(); setIdx(i => (i - 1 + total) % total) }
  function next(e) { e.stopPropagation(); setIdx(i => (i + 1) % total) }
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      <div className="relative flex items-center justify-center max-w-[90vw] max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <img
          src={images[idx]}
          alt=""
          className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
        />
        {total > 1 && (
          <>
            <button
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full mr-2 btn btn-circle btn-sm btn-ghost text-white"
              onClick={prev}
            >‹</button>
            <button
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full ml-2 btn btn-circle btn-sm btn-ghost text-white"
              onClick={next}
            >›</button>
            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white/60 text-xs">{idx + 1} / {total}</span>
          </>
        )}
        <button
          className="absolute -top-2 -right-2 btn btn-circle btn-xs btn-ghost bg-base-100/80 text-base-content"
          onClick={onClose}
        >×</button>
      </div>
    </div>
  )
}
