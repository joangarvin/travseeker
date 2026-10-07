const { catalogRecord } = require('../domain/municipalityCatalog');
const SOURCE_PREFIX = 'source_';
const unlinkedSources = { catalogActivityId: null, municipalityExperience: null };
async function listUnifiedActivities(db, { q = '', offset = 0 } = {}) {
  // Page the two legacy sources together before loading records, so linked
  // essentials appear once and renamed source activities retain a stable order.
  const pattern = '%' + q.replace(/[\\%_]/g, '\\$&') + '%';
  const keys = await db.$queryRaw`
    SELECT * FROM (
      SELECT x.id, 'activity' AS kind, COALESCE(e.title, x.nombre) AS name
      FROM "Experience" x LEFT JOIN "EssentialItem" e ON e.id = x."essentialItemId"
      WHERE COALESCE(e.title, x.nombre) ILIKE ${pattern} OR x.address ILIKE ${pattern}
      UNION ALL
      SELECT e.id, 'source' AS kind, e.title AS name
      FROM "EssentialItem" e
      WHERE e."catalogActivityId" IS NULL
        AND NOT EXISTS (SELECT 1 FROM "Experience" x WHERE x."essentialItemId" = e.id)
        AND e.title ILIKE ${pattern}
    ) catalog ORDER BY lower(name) COLLATE "C", id LIMIT 100 OFFSET ${offset}
  `;
  const activities = await db.experience.findMany({ where: { id: { in: keys.filter(key => key.kind === 'activity').map(key => key.id) } }, include: { essentialItem: true } });
  const sources = await db.essentialItem.findMany({ where: { id: { in: keys.filter(key => key.kind === 'source').map(key => key.id) } }, include: { group: { select: { title: true, destino: { select: { editorialStatus: true } } } } } });
  const records = new Map(activities.map(row => [row.id, catalogRecord(row)]));
  for (const source of sources) records.set(source.id, catalogRecord({ id: SOURCE_PREFIX + source.id, essentialItemId: source.id, essentialItem: source, category: source.group.title, isPublished: source.group.destino.editorialStatus === 'published', address: '', price: '', phone: '', bookingUrl: '', latitud: null, longitud: null }));
  return keys.map(key => records.get(key.id)).filter(Boolean);
}
module.exports = { SOURCE_PREFIX, unlinkedSources, listUnifiedActivities };
