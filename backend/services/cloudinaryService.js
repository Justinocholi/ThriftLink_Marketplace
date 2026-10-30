const fs = require('fs/promises');
const path = require('path');
const { v2: cloudinary } = require('cloudinary');

let configured = false;

function hasCloudinaryConfig() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

function ensureConfigured() {
  if (!hasCloudinaryConfig()) {
    return false;
  }

  if (!configured) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    configured = true;
  }

  return true;
}

function buildLocalFileUrl(file) {
  const name = file.filename || path.basename(file.path || '');
  return `/uploads/${name}`;
}

function inferMimeType(file) {
  if (file.mimetype && file.mimetype !== 'application/octet-stream') {
    return file.mimetype;
  }
  const ext = path.extname(file.originalname || file.path || '').toLowerCase();
  const map = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.jfif': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.avif': 'image/avif',
    '.bmp': 'image/bmp',
    '.pdf': 'application/pdf',
  };
  return map[ext] || 'image/jpeg';
}

async function convertFileToDataUri(file) {
  const buf = await fs.readFile(file.path);
  const mime = inferMimeType(file);
  await fs.unlink(file.path).catch(() => {});
  return {
    url: `data:${mime};base64,${buf.toString('base64')}`,
    provider: 'inline',
  };
}

async function uploadLocalFileToCloudinary(filePath, options = {}) {
  ensureConfigured();

  const result = await cloudinary.uploader.upload(filePath, {
    folder: options.folder,
    resource_type: options.resourceType || 'image',
    transformation: options.transformation,
    overwrite: true,
  });

  await fs.unlink(filePath).catch(() => {});
  return {
    url: result.secure_url,
    publicId: result.public_id,
    provider: 'cloudinary',
  };
}

async function storeUploadedFile(file, options = {}) {
  if (!file) return null;

  if (ensureConfigured()) {
    try {
      return await uploadLocalFileToCloudinary(file.path, options);
    } catch (err) {
      console.error('[cloudinary] upload failed, falling back:', err.message);
    }
  }

  // On Supabase / serverless / cross-origin deployments without Cloudinary,
  // persist as a self-contained data URI so product images never 404 across domains or container restarts.
  if (process.env.DATA_BACKEND === 'supabase' && file.path) {
    try {
      return await convertFileToDataUri(file);
    } catch (err) {
      console.error('[upload] inline data URI fallback failed:', err.message);
    }
  }

  return {
    url: buildLocalFileUrl(file),
    provider: 'local',
  };
}

async function storeUploadedFiles(files = [], optionsFactory = {}) {
  return Promise.all(
    files.map((file, index) =>
      storeUploadedFile(
        file,
        typeof optionsFactory === 'function' ? optionsFactory(file, index) : optionsFactory
      )
    )
  );
}

module.exports = {
  hasCloudinaryConfig,
  storeUploadedFile,
  storeUploadedFiles,
};
