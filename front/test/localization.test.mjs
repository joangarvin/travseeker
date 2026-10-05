import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  resolveLocale,
  translateMessage,
  translatedCatalogName,
  withLanguage,
} from '../src/i18n/core.ts';
const english = JSON.parse(fs.readFileSync(new URL('../src/i18n/en.json', import.meta.url)));

test('English messages interpolate values and Spanish remains the fallback', () => {
  assert.equal(translateMessage('Guardar cambios', 'en', english), 'Save changes');
  assert.equal(translateMessage('Guardar cambios', 'es', english), 'Guardar cambios');
  assert.equal(
    translateMessage('Untranslated editorial name', 'en', english),
    'Untranslated editorial name',
  );
  assert.equal(
    translateMessage('Ver {0} destinos', 'en', english, { 0: 3 }),
    'View 3 destinations',
  );
  assert.equal(resolveLocale('en-GB'), 'en');
  assert.equal(resolveLocale('fr'), 'es');
});

test('language URLs preserve the current route, filters and hash', () => {
  const url = new URL(
    withLanguage('https://example.com/destino/coast?q=sea&month=8#opiniones', 'en'),
  );
  assert.equal(url.pathname, '/destino/coast');
  assert.equal(url.searchParams.get('q'), 'sea');
  assert.equal(url.searchParams.get('month'), '8');
  assert.equal(url.searchParams.get('lang'), 'en');
  assert.equal(url.hash, '#opiniones');
  assert.equal(new URL(withLanguage(url.href, 'es')).searchParams.get('lang'), 'es');
});

test('every translation retains exactly the source interpolation placeholders', () => {
  const placeholders = (text) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
  for (const [source, translated] of Object.entries(english)) {
    assert.deepEqual(placeholders(translated), placeholders(source), source);
    assert.ok(translated.trim(), source);
  }
});

test('activity names prefer editorial translations and still translate canonical API fallbacks', () => {
  const activity = { name: 'Patrimonio Románico', displayName: 'Patrimonio Románico' };
  assert.equal(translatedCatalogName(activity, 'en', english), 'Romanesque heritage');
  assert.equal(
    translatedCatalogName({ ...activity, displayName: 'Romanesque heritage' }, 'es', english),
    'Patrimonio Románico',
  );
  assert.equal(
    translatedCatalogName(
      { ...activity, translations: { en: { name: 'Romanesque landmarks' } } },
      'en',
      english,
    ),
    'Romanesque landmarks',
  );
  assert.equal(
    translatedCatalogName({ ...activity, translations: { en: { name: '  ' } } }, 'en', english),
    'Romanesque heritage',
  );
  for (const [source, expected] of [
    ['Submarinismo', 'Scuba diving'],
    ['Patrimonio Modernista', 'Modernist heritage'],
    ['Termal', 'Thermal spas'],
    ['Ecoturismos', 'Ecotourism'],
  ]) {
    assert.equal(translatedCatalogName({ name: source }, 'en', english), expected);
  }
});
