const test = require("node:test");
const assert = require("node:assert/strict");
const {
  mapCollectionSummary,
  mapPrivateCollection,
  mapPublicCollection,
} = require("../src/domain/collectionResponses");

function trip() {
  return {
    id: "trip",
    userId: "owner",
    nombre: "Asturias",
    visibility: "shared",
    shareToken: "secret",
    itinerary: [{ dayNumber: 1 }],
    user: { id: "owner", nombre: "Ana" },
    members: [{ id: "member", role: "editor", user: { nombre: "Luis" } }],
    _count: { items: 1, members: 1 },
    items: [
      {
        id: "stop",
        destinoId: "destination",
        notas: "Private reservation",
        dayIndex: 1,
        status: "booked",
        sortOrder: 0,
        destino: {
          id: "destination",
          imagen: "cover.jpg",
          activityLinks: [{ activity: { id: "walk", name: "Paseo" } }],
        },
      },
    ],
  };
}

test("public trips omit internal identifiers, sharing tokens and private stop notes", () => {
  const collection = trip();
  const original = structuredClone(collection);
  const result = mapPublicCollection(collection);
  for (const field of ["id", "userId", "shareToken", "visibility", "_count"])
    assert.equal(Object.hasOwn(result, field), false);
  for (const field of ["notas", "destinoId", "createdAt"])
    assert.equal(Object.hasOwn(result.items[0], field), false);
  assert.deepEqual(result.items[0].destino.activityIds, ["walk"]);
  assert.deepEqual(result.items[0].destino.municipios, []);
  assert.equal(Object.hasOwn(result.items[0].destino, "activityLinks"), false);
  assert.deepEqual(collection, original);
});

test("private trips preserve notes, collaboration role and sharing controls", () => {
  const result = mapPrivateCollection(trip(), "editor");
  assert.equal(result.items[0].notas, "Private reservation");
  assert.equal(result.items[0].destinoId, "destination");
  assert.equal(result.role, "editor");
  assert.equal(result.shareToken, "secret");
});

test("trip summaries preserve owner/member roles and tolerate legacy empty itineraries", () => {
  const collection = trip();
  const owner = mapCollectionSummary(collection, "owner");
  assert.equal(owner.role, "owner");
  assert.equal(owner.itineraryDays, 1);
  assert.equal(owner.count, 1);
  assert.equal(owner.memberCount, 1);
  assert.deepEqual(owner.covers, ["cover.jpg"]);
  assert.equal(mapCollectionSummary(collection, "member").role, "editor");
  collection.itinerary = null;
  assert.equal(mapCollectionSummary(collection, "owner").itineraryDays, 0);
  assert.deepEqual(mapPrivateCollection(collection, "owner").itinerary, []);
  assert.deepEqual(mapPublicCollection(collection).itinerary, []);
});
