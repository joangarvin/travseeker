// Centralized environment configuration for deployment and local dev.
const isProd = process.env.NODE_ENV === 'production';

function required(name) {
  const value = process.env[name];
  if (!value && isProd) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value || '';
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd,
  port: Number(process.env.PORT) || 3001,
  databaseUrl: required('DATABASE_URL') || 'postgresql://postgres@localhost:5432/travseeker?schema=public',
  jwtSecret: required('JWT_SECRET') || 'travseeker-dev-secret-change-in-production',
  appUrl: process.env.APP_URL || 'http://localhost:5173',
  frontendUrl: process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5173',
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.MAIL_FROM || 'TravSeeker <no-reply@travseeker.com>',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    folder: process.env.CLOUDINARY_FOLDER || 'travseeker',
  },
};

module.exports = { env };
