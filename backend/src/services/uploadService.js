const { cloudinary, isConfigured } = require('../config/cloudinary');
const { env } = require('../config/env');
const { randomUUID } = require('node:crypto');

function assertConfigured() {
  if (!isConfigured) {
    const err = new Error('Cloudinary no está configurado en el servidor');
    err.status = 503;
    throw err;
  }
}

function uploadBuffer(buffer, options) {
  assertConfigured();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder,
        public_id: options.publicId,
        overwrite: true,
        resource_type: 'image',
        invalidate: true,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );
    stream.end(buffer);
  });
}

function extractPublicId(url) {
  if (!url?.includes('res.cloudinary.com')) return null;

  const marker = '/upload/';
  const idx = url.indexOf(marker);
  if (idx === -1) return null;

  let remainder = url.slice(idx + marker.length);
  const query = remainder.indexOf('?');
  if (query !== -1) remainder = remainder.slice(0, query);

  const segments = remainder.split('/');
  let i = 0;
  if (segments[0] && !/^v\d+$/.test(segments[0])) {
    i = 1;
  }
  if (segments[i] && /^v\d+$/.test(segments[i])) {
    i += 1;
  }

  const idWithExt = segments.slice(i).join('/');
  const dot = idWithExt.lastIndexOf('.');
  return dot > -1 ? idWithExt.slice(0, dot) : idWithExt;
}

async function deleteByUrl(url) {
  const publicId = extractPublicId(url);
  if (!publicId || !isConfigured) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  } catch {
    // Best effort: old asset may already be gone.
  }
}

async function uploadAvatar(userId, buffer, previousUrl) {
  const folder = `${env.cloudinary.folder}/avatars`;
  const result = await uploadBuffer(buffer, {
    folder,
    publicId: String(userId),
  });

  if (previousUrl && previousUrl !== result.secure_url) {
    await deleteByUrl(previousUrl);
  }

  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
  };
}

async function uploadDestinoCover(buffer, destinoId) {
  const folder = `${env.cloudinary.folder}/destinos`;
  const publicId = destinoId ? String(destinoId) : `tmp-${Date.now()}`;

  const result = await uploadBuffer(buffer, {
    folder,
    publicId,
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
  };
}

async function uploadEssentialImage(destinoId, buffer) {
  const folder = `${env.cloudinary.folder}/destinos/${destinoId}/imprescindibles`;
  const result = await uploadBuffer(buffer, {
    folder,
    publicId: randomUUID(),
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
  };
}

function isEssentialImage(url) {
  const publicId = extractPublicId(url);
  const prefix = `${env.cloudinary.folder}/destinos/`;
  return Boolean(
    publicId && publicId.startsWith(prefix) && publicId.includes('/imprescindibles/'),
  );
}

async function deleteEssentialImages(urls) {
  const safeUrls = [...new Set(urls || [])].filter(isEssentialImage);
  await Promise.all(safeUrls.map(deleteByUrl));
}

module.exports = {
  uploadAvatar,
  uploadDestinoCover,
  uploadEssentialImage,
  deleteEssentialImages,
  isConfigured,
};
