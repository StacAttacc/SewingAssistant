import { API } from '../../api'

export function resolveUrl(url) {
  if (!url) return null
  return url.startsWith('/') ? `${API}${url}` : url
}

export const PDF_THUMB_SIZE = 48
export const PDF_THUMB_SCALE = PDF_THUMB_SIZE / 816

export function fmtMoney(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return n.toFixed(2)
}

export function fmtDate(isoStr) {
  const d = new Date(isoStr)
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric', year: '2-digit' })
}
