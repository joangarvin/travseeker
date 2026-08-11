const { env } = require('../config/env');

const SESSION_COOKIE_NAME = 'trav_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60;

function cookieValue(value) {
  return encodeURIComponent(value);
}

function cookieAttributes(maxAge) {
  const attributes = [
    'Path=/',
    'HttpOnly',
    `SameSite=${env.isProd ? 'None' : 'Lax'}`,
    `Max-Age=${maxAge}`,
  ];
  if (env.isProd) attributes.push('Secure');
  return attributes.join('; ');
}

function setSessionCookie(res, token) {
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=${cookieValue(token)}; ${cookieAttributes(SESSION_MAX_AGE_SECONDS)}`,
  );
}

function clearSessionCookie(res) {
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=; ${cookieAttributes(0)}`,
  );
}

function getSessionCookie(req) {
  const header = req.headers.cookie || '';
  const entry = header
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE_NAME}=`));
  if (!entry) return null;
  const value = entry.slice(SESSION_COOKIE_NAME.length + 1);
  try {
    return decodeURIComponent(value) || null;
  } catch {
    return null;
  }
}

module.exports = {
  SESSION_COOKIE_NAME,
  setSessionCookie,
  clearSessionCookie,
  getSessionCookie,
};
