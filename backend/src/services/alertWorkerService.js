const { createHash } = require('crypto');
const { prisma } = require('../config/database');
const { env } = require('../config/env');
const { matchesAlert } = require('../domain/alertMatching');
const { sendMail } = require('../utils/mailer');

function fingerprint(destinos) {
  return createHash('sha256').update(destinos.map((item) => `${item.id}:${item.updatedAt.toISOString()}`).sort().join('|')).digest('hex');
}

async function processAlerts({ dryRun = false } = {}) {
  const alerts = await prisma.alertSubscription.findMany({
    where: { isActive: true, user: { isActive: true, emailVerified: true } },
    include: { user: { select: { email: true, nombre: true, preferences: true } } },
  });
  const report = { checked: alerts.length, matched: 0, sent: 0, skipped: 0, failed: 0 };

  for (const alert of alerts) {
    if (alert.user.preferences?.notifications === false) { report.skipped += 1; continue; }
    const since = alert.lastCheckedAt || alert.createdAt;
    const changed = await prisma.destino.findMany({
      where: { updatedAt: { gt: since }, editorialStatus: 'published' },
      select: { id: true, nombre: true, presupuesto: true, tipoTurismoPrincipal: true, tipoTurismoSecundario: true, mesesJulioAgosto: true, mesesMayJunSeptOct: true, mesesNovAbril: true, updatedAt: true },
    });
    const candidates = changed.filter((destino) => matchesAlert(alert, destino)).slice(0, 5);
    if (!candidates.length) {
      if (!dryRun) await prisma.alertSubscription.update({ where: { id: alert.id }, data: { lastCheckedAt: new Date() } });
      continue;
    }
    report.matched += 1;
    if (dryRun) continue;

    const digest = fingerprint(candidates);
    const existing = await prisma.alertDelivery.findUnique({ where: { alertId_fingerprint: { alertId: alert.id, fingerprint: digest } } });
    if (existing?.status === 'sent') { report.skipped += 1; continue; }
    const delivery = existing || await prisma.alertDelivery.create({ data: { alertId: alert.id, fingerprint: digest } });
    try {
      const params = new URLSearchParams();
      if (alert.month) params.set('month', String(alert.month));
      if (alert.avoidCrowds) params.set('avoidCrowds', 'true');
      if (alert.presupuesto) params.set('presupuesto', alert.presupuesto);
      const result = await sendMail({
        to: alert.user.email,
        subject: 'Nuevos destinos que encajan contigo',
        title: `Hola${alert.user.nombre ? `, ${alert.user.nombre}` : ''}: hay novedades`,
        message: `Hemos encontrado ${candidates.length} destino${candidates.length === 1 ? '' : 's'} que encajan con tu alerta: ${candidates.map((item) => item.nombre).join(', ')}.`,
        ctaLabel: 'Ver destinos',
        ctaUrl: `${env.appUrl}/?${params.toString()}`,
      });
      if (!result.delivered) throw new Error('SMTP no configurado');
      const now = new Date();
      await prisma.$transaction([
        prisma.alertDelivery.update({ where: { id: delivery.id }, data: { status: 'sent', sentAt: now, error: null } }),
        prisma.alertSubscription.update({ where: { id: alert.id }, data: { lastCheckedAt: now, lastNotifiedAt: now } }),
      ]);
      report.sent += 1;
    } catch (error) {
      await prisma.alertDelivery.update({ where: { id: delivery.id }, data: { status: 'failed', error: String(error.message || error).slice(0, 500) } });
      report.failed += 1;
    }
  }
  return report;
}

module.exports = { processAlerts };
