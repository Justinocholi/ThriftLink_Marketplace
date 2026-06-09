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

async function uploadLocalFileToCloudinary(filePath, options = {}) {
  ensureConfigured();

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: options.folder,
      resource_type: options.resourceType || 'image',
      transformation: options.transformation,
      overwrite: true,
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      provider: 'cloudinary',
    };
  } finally {
    await fs.unlink(filePath).catch(() => {});
  }
}

async function storeUploadedFile(file, options = {}) {
  if (!file) return null;

  if (!ensureConfigured()) {
    return {
      url: buildLocalFileUrl(file),
      provider: 'local',
    };
  }

  return uploadLocalFileToCloudinary(file.path, options);
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
