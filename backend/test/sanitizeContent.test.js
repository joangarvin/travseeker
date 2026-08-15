const test = require('node:test');
const assert = require('node:assert/strict');
const { cleanMunicipalityFields, stripHtmlToText } = require('../src/utils/sanitizeContent');

test('elimina HTML heredado y decodifica entidades', () => {
  assert.equal(
    stripHtmlToText('<p class="font_8">30-100&nbsp;€ &amp; desayuno</p>'),
    '30-100 € & desayuno',
  );
  assert.equal(
    stripHtmlToText('&lt;p class=&quot;font_8&quot;&gt;40-90€&lt;/p&gt;'),
    '40-90€',
  );
  assert.equal(stripHtmlToText('<script>alert(1)</script><strong>Seguro</strong>'), 'Seguro');
});

test('limpia todos los campos textuales de un municipio sin mutar el original', () => {
  const original = {
    nombre: 'Villa',
    precios: '<p>30€</p>',
    conexiones: '<span>Tren</span>',
    tipoTurismo: '<b>Rural</b>',
  };
  assert.deepEqual(cleanMunicipalityFields(original), {
    nombre: 'Villa',
    precios: '30€',
    conexiones: 'Tren',
    tipoTurismo: 'Rural',
  });
  assert.equal(original.precios, '<p>30€</p>');
});
