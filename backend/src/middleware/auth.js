const { verifyToken } = require('../utils/jwt');
const { prisma } = require('../config/database');

async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Debes iniciar sesión' });
  }

  try {
    const payload = verifyToken(header.slice(7));
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, isActive: true, role: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Usuario no válido' });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Sesión expirada o inválida' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Debes iniciar sesión' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso solo para administradores' });
  }
  return next();
}

module.exports = { requireAuth, requireAdmin };
