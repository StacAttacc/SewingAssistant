import { useRef } from 'react'
import { API } from '../../api'

export default function PreviewModal({ pattern, onClose }) {
  const iframeRef = useRef(null)
  const isPDF = pattern.url?.endsWith('.pdf')
  const isSVG = pattern.url?.endsWith('.svg')
  const src = `${API}${pattern.url}`

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
            <button className="btn btn-sm btn-ghost" onClick={() => window.open(src, '_blank', 'noopener')}>Print</button>
            <button className="btn btn-sm btn-ghost text-lg leading-none" onClick={onClose}>×</button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden flex items-center justify-center p-4">
          {isPDF || isSVG ? (
            <iframe ref={iframeRef} src={src} className="w-full h-full rounded" title="Pattern preview" />
          ) : (
            <img src={src} alt={pattern.title ?? 'Pattern'} className="max-w-full max-h-full object-contain rounded" />
          )}
        </div>
      </div>
    </div>
  )
}
