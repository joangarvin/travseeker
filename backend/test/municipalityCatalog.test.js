const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeCatalog, guideFields, associationIds, municipalityAssociations, flattenGuide, catalogConfig, catalogRecord } = require('../src/domain/municipalityCatalog');

test('catalog validates names, safe links, coordinates and hotel stars', () => {
  const data = normalizeCatalog({ nombre: '<b>Hostal</b>', latitud: '41.2', longitud: '1.7', stars: '3', isPublished: true, website: 'https://example.com' }, 'hoteles');
  assert.equal(data.nombre, 'Hostal'); assert.equal(data.latitud, 41.2); assert.equal(data.isPublished, true);
  for (const website of ['javascript:alert(1)', 'data:text/html,hello', 'https://user:pass@example.com']) assert.throws(() => normalizeCatalog({ nombre: 'Lugar', website }, 'restaurantes'), { status: 400 });
  assert.throws(() => normalizeCatalog({ nombre: 'Lugar', latitud: 40 }, 'actividades'), { status: 400 });
  assert.throws(() => normalizeCatalog({ nombre: 'Lugar', latitud: Infinity, longitud: 4 }, 'actividades'), { status: 400 });
  assert.throws(() => normalizeCatalog({ nombre: 'Lugar', stars: '6' }, 'hoteles'), { status: 400 });
  assert.throws(() => normalizeCatalog({ nombre: 'Lugar', isPublished: 'false' }, 'hoteles'), { status: 400 });
  assert.throws(() => catalogConfig('__proto__'), { status: 400 });
});
test('omitted guide fields preserve existing content, explicit blanks clear it', () => {
  assert.deepEqual(guideFields({ nombre: 'Sitges' }), {});
  assert.deepEqual(guideFields({ descripcion: '', imagen: '' }), { descripcion: '', imagen: '' });
  assert.throws(() => guideFields({ website: 'javascript:alert(1)' }), { status: 400 });
});
test('associations deduplicate IDs and preserve omitted relations', async () => {
  assert.deepEqual(associationIds(['a', 'a', 'b']), ['a', 'b']);
  assert.throws(() => associationIds('a'), { status: 400 });
  const calls = [];
  const tx = { experience: { count: async args => { calls.push(args); return args.where.id.in.length; } } };
  const links = await municipalityAssociations(tx, { actividadesIds: ['b', 'a', 'b'] });
  assert.deepEqual(links, { activityLinks: { deleteMany: {}, create: [{ recordId: 'b', sortOrder: 0 }, { recordId: 'a', sortOrder: 1 }] } });
  assert.equal(calls.length, 1);
  assert.deepEqual(await municipalityAssociations(tx, {}), {});
  assert.deepEqual(await municipalityAssociations(tx, { actividadesIds: [] }), { activityLinks: { deleteMany: {}, create: [] } });
});
test('missing references reject the whole municipality update', async () => {
  await assert.rejects(municipalityAssociations({ hotel: { count: async () => 0 } }, { hotelesIds: ['missing'] }), { status: 400 });
});
test('linked essential activities always use the original record content', () => {
  const record = catalogRecord({ id: 'record', nombre: 'Old', essentialItem: { title: 'Current', description: '<p>New description</p>', translations: { en: { title: 'Current EN' } } } });
  assert.equal(record.nombre, 'Current'); assert.equal(record.descripcion, 'New description'); assert.equal(record.translations.en.nombre, 'Current EN'); assert.equal(record.essentialItem, undefined);
  const guide = flattenGuide({ nombre: 'Sitges', activityLinks: [{ record: { id: 'record', nombre: 'Plan' } }], hotelLinks: [] });
  assert.deepEqual(guide.actividadesIds, ['record']); assert.deepEqual(guide.hoteles, []); assert.equal(guide.activityLinks, undefined);
});
