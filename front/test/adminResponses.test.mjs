import test from 'node:test';
import assert from 'node:assert/strict';
import { readCatalogPage, readEditorialPage } from '../src/features/admin/adminResponses.ts';

test('old backend arrays and malformed responses fail before corrupting admin state', () => {
  for (const response of [
    [],
    [{ id: 'old-record' }],
    null,
    {},
    { items: [] },
    { items: [], total: NaN },
  ]) {
    assert.throws(() => readCatalogPage(response), /Reinicia el servidor backend/);
    assert.throws(() => readEditorialPage(response), /Reinicia el servidor backend/);
  }
});
test('current admin envelopes preserve rows, totals, and cursors', () => {
  const catalog = { items: [{ id: 'example' }], total: 45 };
  assert.deepEqual(readCatalogPage(catalog), catalog);
  const editorial = {
    items: catalog.items,
    counts: { all: 45, draft: 0, pending: 45, published: 0, archived: 0 },
    nextCursor: 'next-page',
  };
  assert.deepEqual(readEditorialPage(editorial), editorial);
  assert.throws(() => readEditorialPage({ ...editorial, counts: { all: 45 } }), /Reinicia/);
});
