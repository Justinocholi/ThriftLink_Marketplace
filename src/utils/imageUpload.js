/**
 * Client-side image preparation for vendor uploads.
 * Resizes large camera photos (max 1400px) and normalizes mobile formats to clean JPEG
 * so uploads succeed reliably across slow mobile connections and backend MIME checks.
 */

const MAX_DIMENSION = 1400;
const JPEG_QUALITY = 0.84;
const PASSTHROUGH_MAX_BYTES = 550 * 1024; // 550 KB
const SAFE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };
    img.src = objectUrl;
  });
}

export async function compressSingleImage(file) {
  if (!file || typeof file !== 'object') return file;

  // Skip small standard images that don't need re-encoding
  if (SAFE_TYPES.has(file.type) && file.size <= PASSTHROUGH_MAX_BYTES) {
    return file;
  }

  try {
    const img = await loadImageFromFile(file);
    let { width, height } = img;
    if (!width || !height) return file;

    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
      width = Math.max(1, Math.round(width * ratio));
      height = Math.max(1, Math.round(height * ratio));
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;

    // Fill white background for transparent PNGs converted to JPEG
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', JPEG_QUALITY)
    );
    if (!blob) return file;

    const baseName = (file.name || 'product-photo')
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_');

    return new File([blob], `${baseName}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  } catch {
    // Fallback to original file if browser cannot decode (e.g., certain raw containers)
    return file;
  }
}

export async function prepareImageFilesForUpload(files = []) {
  const list = Array.from(files).slice(0, 5);
  return Promise.all(list.map((f) => compressSingleImage(f)));
}
