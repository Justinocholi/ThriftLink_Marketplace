// Returns a Cloudinary URL with auto-format, auto-quality, and width transforms.
// If the URL isn't a Cloudinary URL, returns it unchanged.
export function cldUrl(url, width = 400) {
  if (!url || typeof url !== 'string') return url;
  if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;
  // Don't double-transform
  if (url.match(/\/upload\/[^/]*[wq]_/)) return url;
  return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
}
