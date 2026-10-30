const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

let fileType = null;
try {
  // file-type@16 is CommonJS. Optional — if not installed we skip the sniff.
  fileType = require('file-type');
} catch (e) {
  console.warn('[upload] file-type not installed; skipping MIME sniff');
}

const UPLOAD_DIR = path.join(__dirname, '../uploads');
try {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
} catch {}

const MIME_TO_EXT = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/pjpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/avif': '.avif',
  'image/heic': '.heic',
  'image/heif': '.heif',
  'image/bmp': '.bmp',
  'application/pdf': '.pdf',
};

const storage = multer.diskStorage({
  destination(req, file, cb) {
    try {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    } catch {}
    cb(null, UPLOAD_DIR);
  },
  filename(req, file, cb) {
    let ext = path.extname(file.originalname || '').toLowerCase();
    if (!ext && file.mimetype && MIME_TO_EXT[file.mimetype.toLowerCase()]) {
      ext = MIME_TO_EXT[file.mimetype.toLowerCase()];
    }
    if (!ext) ext = '.jpg';
    cb(null, `${uuidv4()}${ext}`);
  },
});

const ALLOWED_EXTS = new Set([
  '.jpg', '.jpeg', '.jfif', '.png', '.webp', '.gif', '.avif', '.heic', '.heif', '.bmp', '.pdf',
]);

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  const mime = (file.mimetype || '').toLowerCase();
  if (ALLOWED_EXTS.has(ext) || mime.startsWith('image/') || mime === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only image or PDF files are allowed'), false);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 15 * 1024 * 1024 } });

const ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg', 'image/jpg', 'image/pjpeg', 'image/png', 'image/webp',
  'image/gif', 'image/avif', 'image/heic', 'image/heif', 'image/bmp',
]);
const ALLOWED_DOC_MIMES = new Set([
  'application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
]);

async function sniffOne(file, allowed) {
  if (!file || !fileType || typeof fileType.fromFile !== 'function') return true;
  try {
    const detected = await fileType.fromFile(file.path);
    if (!detected || !allowed.has(detected.mime)) {
      fs.promises.unlink(file.path).catch(() => {});
      return false;
    }
    return true;
  } catch {
    // If sniff itself fails, don't block the request — best-effort hardening.
    return true;
  }
}

/**
 * Express middleware factory. Sniffs the saved upload(s) and 400s on mismatch.
 * Use after upload.single/array. `kind` selects the allowed MIME set.
 */
function verifyUploadMime(kind = 'image') {
  const allowed = kind === 'document' ? ALLOWED_DOC_MIMES : ALLOWED_IMAGE_MIMES;
  return async (req, res, next) => {
    try {
      if (req.file) {
        const ok = await sniffOne(req.file, allowed);
        if (!ok) return res.status(400).json({ error: 'Uploaded file type is not allowed' });
      }
      if (Array.isArray(req.files) && req.files.length) {
        for (const f of req.files) {
          const ok = await sniffOne(f, allowed);
          if (!ok) return res.status(400).json({ error: 'Uploaded file type is not allowed' });
        }
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

upload.verifyMime = verifyUploadMime;
module.exports = upload;
