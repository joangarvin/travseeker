const authService = require('../services/authService');
const { asyncHandler } = require('../utils/asyncHandler');

const register = asyncHandler(async (req, res) => {
  const { email, password, nombre } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
  }
  const result = await authService.register({ email, password, nombre });
  res.status(201).json(result);
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
  }
  const result = await authService.login({ email, password });
  res.json(result);
});

const me = asyncHandler(async (req, res) => {
  res.json(await authService.getMe(req.user.id));
});

const updateMe = asyncHandler(async (req, res) => {
  const { nombre, apellidos, bio, avatarUrl, locale, preferences } = req.body;
  const user = await authService.updateProfile(req.user.id, {
    nombre,
    apellidos,
    bio,
    avatarUrl,
    locale,
    preferences,
  });
  res.json(user);
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Debes indicar la contraseña actual y la nueva' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' });
  }
  const result = await authService.changePassword(req.user.id, currentPassword, newPassword);
  res.json(result);
});

const requestVerification = asyncHandler(async (req, res) => {
  res.json(await authService.requestEmailVerification(req.user.id));
});

const confirmVerification = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Falta el token' });
  res.json(await authService.confirmEmailVerification(token));
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Indica tu email' });
  res.json(await authService.requestPasswordReset(email));
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Faltan datos' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
  }
  res.json(await authService.resetPassword(token, newPassword));
});

module.exports = {
  register,
  login,
  me,
  updateMe,
  changePassword,
  requestVerification,
  confirmVerification,
  forgotPassword,
  resetPassword,
};
