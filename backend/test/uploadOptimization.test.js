const test = require('node:test');
const assert = require('node:assert/strict');

// Stub the Cloudinary client: tests never upload or delete real assets.
const configPath = require.resolve('../src/config/cloudinary');
const uploads = [], deleted = [];
require.cache[configPath] = { id: configPath, filename: configPath, loaded: true, exports: {
  isConfigured: true,
  cloudinary: { uploader: {
    upload_stream(options, callback) {
      uploads.push(options);
      return { end() { callback(null, { public_id: `${options.folder}/${options.public_id}`, secure_url: `https://res.cloudinary.com/demo/image/upload/v2/${options.folder}/${options.public_id}.jpg` }); } };
    },
    async destroy(id) { deleted.push(id); },
  } },
} };
const service = require('../src/services/uploadService');
const { env } = require('../src/config/env');

test('replacing an avatar does not delete the same overwritten Cloudinary asset', async () => {
  await service.uploadAvatar('123', Buffer.from('test'), `https://res.cloudinary.com/demo/image/upload/v1/${env.cloudinary.folder}/avatars/123.jpg`);
  assert.deepEqual(deleted, []);
  assert.deepEqual(uploads.at(-1).transformation, [{ width: 512, height: 512, crop: 'limit' }]);
});
test('new covers and essential images store bounded originals without eager variants', async () => {
  await service.uploadDestinoCover(Buffer.from('test'), 'destination');
  await service.uploadEssentialImage('destination', Buffer.from('test'));
  for (const upload of uploads.slice(-2)) {
    assert.deepEqual(upload.transformation, [{ width: 1600, height: 1600, crop: 'limit' }]);
    assert.equal(upload.eager, undefined);
  }
});
