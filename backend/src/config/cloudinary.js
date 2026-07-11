const cloudinary = require('cloudinary').v2;
const { env } = require('./env');

function configureCloudinary() {
  const { cloudName, apiKey, apiSecret } = env.cloudinary;
  if (!cloudName || !apiKey || !apiSecret) {
    return false;
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  return true;
}

const isConfigured = configureCloudinary();

module.exports = { cloudinary, isConfigured };
