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

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only image or PDF files are allowed'), false);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

const ALLOWED_IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const ALLOWED_DOC_MIMES = new Set(['application/pdf', 'image/jpeg', 'image/png']);

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
