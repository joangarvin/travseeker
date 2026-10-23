import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalize,
  catalogue,
  insight,
  value,
  byId,
  changePair,
  search,
  priorities,
} from './model.js';
import { render as cara } from './cara.js';
import { render as criterios } from './criterios.js';
import { render as duelo } from './duelo.js';

test('deduplicates and validates catalogue and wishes without contaminating the app', () => {
  const s = normalize({
    ids: ['garraf', 'garraf', 'unknown', 'lisboa', 'essaouira', 'niza'],
    chosen: 'unknown',
    wishes: ['Cultura', 'Cultura', 'invalid'],
    season: 99,
    priority: 'unknown',
  });
  assert.deepEqual(s.ids, ['garraf', 'lisboa', 'essaouira', 'niza']);
  assert.equal(s.chosen, null);
  assert.deepEqual(s.wishes, ['Cultura']);
  assert.equal(s.season, 0);
  assert.equal(s.priority, 'quiet');
});
test('same destination cannot appear on both sides; changing to opponent swaps', () => {
  const s = normalize();
  assert.deepEqual(changePair(s, 0, 'lisboa').pair, ['lisboa', 'garraf']);
  assert.deepEqual(normalize({ ...s, pair: ['garraf', 'garraf'] }).pair, ['garraf', 'lisboa']);
  assert.deepEqual(normalize({ ...s, ids: ['essaouira'] }).pair, ['essaouira']);
});
test('removal invalidates chosen destination and repairs the pair', () => {
  const s = normalize({ ids: ['lisboa', 'essaouira'], chosen: 'garraf', pair: ['garraf', 'niza'] });
  assert.equal(s.chosen, null);
  assert.deepEqual(s.pair, ['lisboa', 'essaouira']);
});
test('missing crowd is null, never zero; comparison abstains', () => {
  const s = normalize({ missing: true });
  assert.equal(value(byId('essaouira'), 'quiet', s), null);
  assert.match(insight(s).title, /Falta información/);
  const pair = normalize({ ...s, pair: ['garraf', 'lisboa'] });
  assert.doesNotMatch(insight(pair, true).title, /Falta información/);
});
test('season changes the comparison values', () => {
  const d = byId('garraf');
  assert.equal(value(d, 'quiet', normalize({ season: 0 })), 65);
  assert.equal(value(d, 'quiet', normalize({ season: 1 })), 85);
});
test('no invented cross-currency price ranking', () => {
  const s = normalize({ priority: 'budget' });
  assert.match(insight(s).body, /sin conversiones ni un ganador/);
  assert.doesNotMatch(insight(s).title, /barat|gana/);
});
test('activity wishes count matches, and empty wishes ask for a preference', () => {
  const s = normalize({ priority: 'activities', wishes: ['Cultura', 'Naturaleza'] });
  assert.equal(value(byId('lisboa'), 'activities', s), 1);
  assert.equal(value(byId('garraf'), 'activities', s), 2);
  assert.match(insight(s).title, /Costa del Garraf/);
  assert.match(insight(normalize({ ...s, wishes: [] })).title, /Qué te apetece/);
});
test('country is a secondary practical field; currency difference is explicit', () => {
  const s = normalize({ priority: 'practical' });
  assert.equal(insight(s).title, 'Aquí cambia la moneda');
  assert.match(insight(normalize({ ...s, ids: ['garraf', 'lisboa'] })).title, /Comparten moneda/);
});
test('search matches destination/country and folds accents', () => {
  assert.equal(search('espana')[0].id, 'garraf');
  assert.equal(search('NIZA')[0].code, 'FR');
  assert.equal(search('zzz').length, 0);
});
test('all variants render all priorities, seasons, missing and selection cases', () => {
  for (const render of [cara, criterios, duelo])
    for (const priority of Object.keys(priorities))
      for (const season of [0, 1, 2])
        for (const missing of [true, false]) {
          const s = normalize({
            ids: catalogue.map((d) => d.id),
            priority,
            season,
            missing,
            chosen: 'lisboa',
          });
          const html = render(s);
          assert.doesNotMatch(html, /undefined|NaN/);
          assert.match(html, /data-choose/);
          assert.match(html, /Lisboa/);
        }
});
test('empty/one destination offer a real add action in every variant', () => {
  for (const render of [cara, criterios, duelo])
    for (const ids of [[], ['garraf']]) {
      assert.match(render(normalize({ ids })), /data-manage/);
      assert.doesNotMatch(render(normalize({ ids })), /data-choose/);
    }
});
test('only-differences handles equal editorial budgets', () => {
  const html = criterios(
    normalize({ ids: ['garraf', 'lisboa'], differences: true, priority: 'budget' }),
  );
  assert.doesNotMatch(html, /<span>Presupuesto<\/span>/);
  assert.match(html, /Lo práctico/);
});
