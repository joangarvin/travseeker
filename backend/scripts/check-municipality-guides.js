// Integration check: all writes happen inside a transaction that is ALWAYS rolled back.
const assert = require('node:assert/strict');
const { prisma, pool } = require('../src/config/database');
const { saveCatalogRecord } = require('../src/services/municipalityCatalogService');
const { municipalityAssociations, guideInclude, publicGuideInclude, flattenGuide } = require('../src/domain/municipalityCatalog');
const rollback = new Error('ROLLBACK_CHECK');
async function run() {
  let checked = false;
  try {
    await prisma.$transaction(async tx => {
      const municipality = await tx.municipio.create({ data: { nombre: 'Temporary integration check', precios: '', conexiones: '', descripcion: 'Preserved description', editorialStatus: 'published' } });
      const activity = await saveCatalogRecord(tx, 'actividades', { nombre: 'Temporary plan', descripcion: 'Plan detail', duration: '2 h', isPublished: true });
      const hotel = await saveCatalogRecord(tx, 'hoteles', { nombre: 'Temporary hotel', stars: '3', isPublished: true });
      const restaurant = await saveCatalogRecord(tx, 'restaurantes', { nombre: 'Temporary restaurant', cuisine: 'Local', isPublished: false });
      await assert.rejects(saveCatalogRecord(tx, 'hoteles', { nombre: 'Temporary hotel' }), { status: 409 });
      await tx.municipio.update({ where: { id: municipality.id }, data: await municipalityAssociations(tx, { actividadesIds: [activity.id, activity.id], hotelesIds: [hotel.id], restaurantesIds: [restaurant.id] }) });
      const loaded = flattenGuide(await tx.municipio.findUnique({ where: { id: municipality.id }, include: guideInclude }));
      assert.deepEqual(loaded.actividadesIds, [activity.id]); assert.equal(loaded.descripcion, 'Preserved description');
      const published = flattenGuide(await tx.municipio.findUnique({ where: { id: municipality.id }, include: publicGuideInclude }));
      assert.equal(published.restaurantes.length, 0); assert.equal(published.hoteles.length, 1);
      await tx.municipio.update({ where: { id: municipality.id }, data: await municipalityAssociations(tx, { actividadesIds: [] }) });
      const unlinked = flattenGuide(await tx.municipio.findUnique({ where: { id: municipality.id }, include: guideInclude }));
      assert.equal(unlinked.actividades.length, 0); assert.equal(unlinked.hoteles.length, 1); assert.ok(await tx.experience.findUnique({ where: { id: activity.id } }));
      const source = await tx.essentialItem.findFirst({ where: { group: { destino: { editorialStatus: 'published' } } } });
      if (source) {
        const reused = await saveCatalogRecord(tx, 'actividades', { essentialItemId: source.id });
        const reusedAgain = await saveCatalogRecord(tx, 'actividades', { essentialItemId: source.id });
        assert.equal(reused.id, reusedAgain.id);
        await saveCatalogRecord(tx, 'actividades', { ...reused, nombre: 'Updated temporary source', duration: '3 h' }, reused.id);
        const updatedSource = await tx.essentialItem.findUnique({ where: { id: source.id } });
        assert.equal(updatedSource.title, 'Updated temporary source'); assert.equal(updatedSource.duration, '3 h');
        assert.equal(updatedSource.groupId, source.groupId);
      }
      checked = true;
      throw rollback;
    }, { timeout: 30000 });
  } catch (error) { if (error !== rollback && error.message !== rollback.message) throw error; }
  assert.ok(checked);
  console.log('Verified catalog CRUD, source reuse, publication, association removal and data preservation. All writes rolled back.');
  for (const path of ['/api/admin/fichas/hoteles', '/api/admin/municipios']) {
    const response = await fetch(`http://127.0.0.1:3001${path}`);
    assert.equal(response.status, 401);
  }
  console.log('Verified anonymous requests cannot access admin catalogs.');
}
run().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); await pool.end(); });
