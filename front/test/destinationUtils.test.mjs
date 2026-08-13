import assert from 'node:assert/strict';
import test from 'node:test';
import {
  distanceLabel,
  excerptAtWord,
  haversineDistanceKm,
  safeExternalUrl,
  serializeJsonLd,
  validCoordinates,
} from '../src/utils/destination.ts';

test('validCoordinates rejects incomplete and out-of-range coordinates', () => {
  assert.equal(validCoordinates(undefined, -3.7), null);
  assert.equal(validCoordinates(91, -3.7), null);
  assert.deepEqual(validCoordinates(40.4168, -3.7038), {
    latitude: 40.4168,
    longitude: -3.7038,
  });
});

test('haversineDistanceKm calculates a known route within a useful tolerance', () => {
  const madridToBarcelona = haversineDistanceKm(
    { latitude: 40.4168, longitude: -3.7038 },
    { latitude: 41.3874, longitude: 2.1686 },
  );
  assert.ok(madridToBarcelona > 500 && madridToBarcelona < 510);
  assert.equal(distanceLabel(3.26), '3,3 km');
});

test('safeExternalUrl only accepts absolute web URLs', () => {
  assert.equal(safeExternalUrl('javascript:alert(1)'), null);
  assert.equal(safeExternalUrl('/ruta/relativa'), null);
  assert.equal(safeExternalUrl('https://example.com/info'), 'https://example.com/info');
});

test('excerptAtWord keeps whole words when shortening copy', () => {
  assert.equal(excerptAtWord('Una frase breve.', 40), 'Una frase breve.');
  assert.equal(excerptAtWord('Uno dos tres cuatro cinco', 16), 'Uno dos tres…');
});

test('serializeJsonLd cannot close its script element', () => {
  const serialized = serializeJsonLd({ description: '</script><script>alert(1)</script>' });
  assert.equal(serialized.includes('</script>'), false);
  assert.equal(
    serialized,
    '{"description":"\\u003c/script>\\u003cscript>alert(1)\\u003c/script>"}',
  );
});
