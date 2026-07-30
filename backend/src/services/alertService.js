const { prisma } = require('../config/database');

function normalize(input) {
  const month = input.month == null || input.month === '' ? null : Number(input.month);
  if (month !== null && (!Number.isInteger(month) || month < 1 || month > 12)) {
    const error = new Error('El mes de alerta no es válido'); error.status = 400; throw error;
  }
  const tipos = Array.isArray(input.tipos) ? [...new Set(input.tipos.filter((value) => typeof value === 'string' && value.trim()).map((value) => value.trim()))].slice(0, 6) : [];
  return { month, tipos: tipos.length ? tipos : null, presupuesto: typeof input.presupuesto === 'string' && input.presupuesto.trim() ? input.presupuesto.trim().slice(0, 30) : null, avoidCrowds: input.avoidCrowds !== false };
}

async function list(userId) { return prisma.alertSubscription.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }); }
async function create(userId, input) { return prisma.alertSubscription.create({ data: { userId, ...normalize(input) } }); }
async function remove(userId, id) { await prisma.alertSubscription.deleteMany({ where: { id, userId } }); return { removed: true }; }

module.exports = { list, create, remove };
