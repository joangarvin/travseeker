const test = require('node:test');
const assert = require('node:assert/strict');
const { crowdForMonth, normalizeMonth, rankForSeason } = require('../src/domain/season');

const quiet = {
  nombre: 'Calma',
  mesesJulioAgosto: 35,
  mesesMayJunSeptOct: 20,
  mesesNovAbril: 10,
};

test('normaliza únicamente meses válidos', () => {
  assert.equal(normalizeMonth('7'), 7);
  assert.equal(normalizeMonth(0), null);
  assert.equal(normalizeMonth('diciembre'), null);
});

test('asigna cada mes a su banda editorial actual', () => {
  assert.equal(crowdForMonth(quiet, 8), 35);
  assert.equal(crowdForMonth(quiet, 10), 20);
  assert.equal(crowdForMonth(quiet, 1), 10);
});

test('prioriza menor afluencia y explica el resultado si se solicita', () => {
  const busy = { ...quiet, nombre: 'Concurrido', mesesJulioAgosto: 90 };
  const ranked = rankForSeason([busy, quiet], { month: 7, avoidCrowds: true });

  assert.deepEqual(ranked.map((item) => item.nombre), ['Calma', 'Concurrido']);
  assert.equal(ranked[0].seasonCrowd, 35);
  assert.match(ranked[0].matchReason, /Julio/);
});

test('prioriza la afluencia media si se evita gente sin seleccionar mes', () => {
  const busy = { ...quiet, nombre: 'Concurrido', mesesJulioAgosto: 90, mesesMayJunSeptOct: 80, mesesNovAbril: 70 };
  const ranked = rankForSeason([busy, quiet], { month: null, avoidCrowds: true });
  assert.deepEqual(ranked.map((item) => item.nombre), ['Calma', 'Concurrido']);
});
