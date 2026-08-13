// Centralized environment configuration for deployment, scripts and local dev.
// Loading here prevents direct service/worker executions from silently using fallbacks.
require('dotenv').config({ quiet: true });

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
  climate: {
    baseUrl: process.env.CLIMATE_BASE_URL || 'https://archive-api.open-meteo.com/v1/archive',
    apiKey: process.env.CLIMATE_API_KEY || '',
    provider: process.env.CLIMATE_PROVIDER || 'open-meteo',
    model: process.env.CLIMATE_MODEL || 'era5',
    years: Number(process.env.CLIMATE_YEARS) || 5,
    ttlDays: Number(process.env.CLIMATE_CACHE_TTL_DAYS) || 180,
    timeoutMs: Number(process.env.CLIMATE_TIMEOUT_MS) || 8000,
  },
};

module.exports = { env };
