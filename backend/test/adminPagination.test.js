const test = require("node:test");
const assert = require("node:assert/strict");
const {
  pagination,
  catalogWhere,
  encodeEditorialCursor,
  editorialCursorWhere,
} = require("../src/domain/pagination");

test("admin catalog pagination bounds query size and filters before paging", () => {
  assert.deepEqual(pagination({ limit: "99999", offset: "-5" }), {
    take: 100,
    skip: 0,
  });
  assert.deepEqual(pagination({ limit: "invalid", offset: "invalid" }), {
    take: 40,
    skip: 0,
  });
  assert.deepEqual(
    catalogWhere({ q: "  beach ", status: "pending" }, ["nombre"]),
    {
      editorialStatus: "pending",
      OR: [{ nombre: { contains: "beach", mode: "insensitive" } }],
    },
  );
});

test("editorial cursor preserves ties across resources and rejects invalid input", () => {
  const date = "2026-10-04T12:00:00.000Z";
  const cursor = encodeEditorialCursor({
    id: "b",
    resource: "destinos",
    submittedAt: date,
  });
  assert.deepEqual(editorialCursorWhere(cursor, "activities").OR, [
    { submittedAt: { lt: new Date(date) } },
    { submittedAt: new Date(date), id: { lt: "b" } },
  ]);
  assert.equal(editorialCursorWhere(cursor, "places").OR.length, 3);
  for (const value of [
    "bad",
    Buffer.from('{"id":"b"}').toString("base64url"),
  ]) {
    assert.throws(
      () => editorialCursorWhere(value, "destinos"),
      (error) => error.status === 400,
    );
  }
});

// Stub the database module: verify full traversal without contacting Neon.
const databasePath = require.resolve("../src/config/database");
const records = Array.from({ length: 287 }, (_, i) => ({
  id: String(1000 - i),
  nombre: `Destination ${i}`,
  editorialStatus: "pending",
  submittedAt: new Date("2026-10-04T12:00:00Z"),
}));
require.cache[databasePath] = {
  id: databasePath,
  filename: databasePath,
  loaded: true,
  exports: {
    prisma: {
      destino: {
        findMany: async (query) => {
          assert.equal(query.where.AND[0].editorialStatus, "pending");
          const cursor = query.where.AND[1].OR?.[1]?.id.lt;
          return records
            .filter((row) => !cursor || row.id < cursor)
            .slice(0, query.take);
        },
        groupBy: async () => [
          { editorialStatus: "pending", _count: { _all: 287 } },
        ],
      },
    },
  },
};
const { listEditorial } = require("../src/services/editorialService");
test("editorial queue reaches records beyond the former 250-item cap without duplicates", async () => {
  let cursor;
  const ids = [];
  do {
    const page = await listEditorial({
      resource: "destinos",
      status: "pending",
      limit: 40,
      cursor,
    });
    assert.equal(page.counts.pending, 287);
    ids.push(...page.items.map((row) => row.id));
    cursor = page.nextCursor;
  } while (cursor);
  assert.equal(ids.length, 287);
  assert.equal(new Set(ids).size, 287);
});
