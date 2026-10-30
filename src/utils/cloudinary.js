// Resolves relative backend `/uploads/...` paths against VITE_API_URL in production,
// and applies Cloudinary auto-format, auto-quality, and width transforms when applicable.
const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export function resolveMediaUrl(url) {
  if (!url || typeof url !== 'string') return url;
  if (url.startsWith('/uploads/') && API_ORIGIN) {
    return `${API_ORIGIN}${url}`;
  }
  return url;
}

export function cldUrl(url, width = 400) {
  if (!url || typeof url !== 'string') return url;
  const resolved = resolveMediaUrl(url);
  if (!resolved.includes('res.cloudinary.com') || !resolved.includes('/upload/')) return resolved;
  // Don't double-transform
  if (resolved.match(/\/upload\/[^/]*[wq]_/)) return resolved;
  return resolved.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
}
