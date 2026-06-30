const { prisma } = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/password');
const { signToken } = require('../utils/jwt');
const { generateToken } = require('../utils/token');
const { sendMail } = require('../utils/mailer');
const { USER_PUBLIC_SELECT } = require('../constants/selects');

const APP_URL = process.env.APP_URL || 'http://localhost:5173';
const EMAIL_VERIFY = 'email_verify';
const PASSWORD_RESET = 'password_reset';

async function createToken(userId, type, ttlMs) {
  await prisma.verificationToken.deleteMany({ where: { userId, type, usedAt: null } });
  const token = generateToken();
  await prisma.verificationToken.create({
    data: { userId, type, token, expiresAt: new Date(Date.now() + ttlMs) },
  });
  return token;
}

async function sendVerificationEmail(userId, email) {
  const token = await createToken(userId, EMAIL_VERIFY, 24 * 60 * 60 * 1000);
  await sendMail({
    to: email,
    subject: 'Verifica tu email en TravSeeker',
    title: 'Confirma tu dirección de email',
    message: 'Gracias por unirte a TravSeeker. Verifica tu email para activar todas las funciones de tu cuenta.',
    ctaLabel: 'Verificar email',
    ctaUrl: `${APP_URL}/verificar-email?token=${token}`,
  });
}

function sanitizeUser(user) {
  const { passwordHash, ...publicUser } = user;
  return publicUser;
}

async function register({ email, password, nombre }) {
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    const error = new Error('Este email ya está registrado');
    error.status = 409;
    throw error;
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      nombre: nombre?.trim() || null,
      preferences: { notifications: true, theme: 'system' },
      metadata: { source: 'web', version: 1 },
    },
    select: USER_PUBLIC_SELECT,
  });

  try {
    await sendVerificationEmail(user.id, user.email);
  } catch (err) {
    console.error('No se pudo enviar el email de verificación:', err.message);
  }

  const token = signToken(user.id);
  return { user, token };
}

async function login({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user || !user.isActive) {
    const error = new Error('Email o contraseña incorrectos');
    error.status = 401;
    throw error;
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    const error = new Error('Email o contraseña incorrectos');
    error.status = 401;
    throw error;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const token = signToken(user.id);
  return { user: sanitizeUser(user), token };
}

async function getMe(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: USER_PUBLIC_SELECT,
  });
  if (!user) {
    const error = new Error('Usuario no encontrado');
    error.status = 404;
    throw error;
  }
  return user;
}

const ALLOWED_LOCALES = ['es', 'en', 'ca'];

async function updateProfile(userId, data) {
  const updateData = {};

  if (data.nombre !== undefined) updateData.nombre = data.nombre?.trim() || null;
  if (data.apellidos !== undefined) updateData.apellidos = data.apellidos?.trim() || null;
  if (data.bio !== undefined) updateData.bio = data.bio?.trim().slice(0, 280) || null;
  if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl?.trim() || null;
  if (data.locale !== undefined && ALLOWED_LOCALES.includes(data.locale)) {
    updateData.locale = data.locale;
  }

  if (data.preferences !== undefined && data.preferences && typeof data.preferences === 'object') {
    const current = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });
    updateData.preferences = { ...(current?.preferences || {}), ...data.preferences };
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: USER_PUBLIC_SELECT,
  });
  return user;
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const error = new Error('Usuario no encontrado');
    error.status = 404;
    throw error;
  }

  const valid = await comparePassword(currentPassword, user.passwordHash);
  if (!valid) {
    const error = new Error('La contraseña actual no es correcta');
    error.status = 400;
    throw error;
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  return { success: true };
}

async function requestEmailVerification(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, emailVerified: true },
  });
  if (!user) {
    const error = new Error('Usuario no encontrado');
    error.status = 404;
    throw error;
  }
  if (user.emailVerified) {
    const error = new Error('Tu email ya está verificado');
    error.status = 400;
    throw error;
  }
  await sendVerificationEmail(user.id, user.email);
  return { sent: true };
}

async function confirmEmailVerification(tokenStr) {
  const record = await prisma.verificationToken.findUnique({ where: { token: tokenStr } });
  if (!record || record.type !== EMAIL_VERIFY || record.usedAt || record.expiresAt < new Date()) {
    const error = new Error('El enlace de verificación no es válido o ha caducado');
    error.status = 400;
    throw error;
  }
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { emailVerified: true } }),
    prisma.verificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);
  return { verified: true };
}

async function requestPasswordReset(email) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, email: true, isActive: true },
  });

  if (user && user.isActive) {
    const token = await createToken(user.id, PASSWORD_RESET, 60 * 60 * 1000);
    await sendMail({
      to: user.email,
      subject: 'Restablece tu contraseña en TravSeeker',
      title: 'Restablecer contraseña',
      message: 'Recibimos una solicitud para restablecer tu contraseña. Este enlace caduca en 1 hora. Si no fuiste tú, ignora este email.',
      ctaLabel: 'Crear nueva contraseña',
      ctaUrl: `${APP_URL}/recuperar?token=${token}`,
    });
  }

  return { sent: true };
}

async function resetPassword(tokenStr, newPassword) {
  const record = await prisma.verificationToken.findUnique({ where: { token: tokenStr } });
  if (!record || record.type !== PASSWORD_RESET || record.usedAt || record.expiresAt < new Date()) {
    const error = new Error('El enlace de recuperación no es válido o ha caducado');
    error.status = 400;
    throw error;
  }
  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.verificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);
  return { reset: true };
}

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  requestEmailVerification,
  confirmEmailVerification,
  requestPasswordReset,
  resetPassword,
};
