import { API } from '../../api'

export function resolveUrl(url) {
  if (!url) return null
  return url.startsWith('/') ? `${API}${url}` : url
}

export const PDF_THUMB_SIZE = 48
export const PDF_THUMB_SCALE = PDF_THUMB_SIZE / 816
