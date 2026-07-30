const test = require('node:test');
const assert = require('node:assert/strict');
const { matchesAlert } = require('../src/domain/alertMatching');

const destino = { presupuesto: 'Medio', tipoTurismoPrincipal: 'Naturaleza', tipoTurismoSecundario: 'Senderismo', mesesJulioAgosto: 80, mesesMayJunSeptOct: 35, mesesNovAbril: 20 };

test('una alerta tranquila usa el mes seleccionado', () => {
  assert.equal(matchesAlert({ month: 9, tipos: ['Naturaleza'], presupuesto: 'Medio', avoidCrowds: true }, destino), true);
  assert.equal(matchesAlert({ month: 8, tipos: ['Naturaleza'], presupuesto: 'Medio', avoidCrowds: true }, destino), false);
});

test('presupuesto y tipo deben coincidir cuando están definidos', () => {
  assert.equal(matchesAlert({ month: 9, tipos: ['Cultural'], presupuesto: 'Medio', avoidCrowds: false }, destino), false);
  assert.equal(matchesAlert({ month: 9, tipos: [], presupuesto: 'Alto', avoidCrowds: false }, destino), false);
});
