const test = require("node:test");
const assert = require("node:assert/strict");
const {
  cleanCollectionText,
  optionalDate,
  optionalTravelerCount,
  validateTripRange,
  normalizeCollectionItem,
} = require("../src/domain/collectionPayload");

const badRequest = (message) => (error) =>
  error.status === 400 && message.test(error.message);

test("las fechas distinguen omitir, borrar y guardar; rechazan fechas inexistentes", () => {
  assert.equal(optionalDate(undefined, "Fecha"), undefined);
  assert.equal(optionalDate(null, "Fecha"), null);
  assert.equal(optionalDate("", "Fecha"), null);
  assert.equal(
    optionalDate("2024-02-29", "Fecha").toISOString(),
    "2024-02-29T00:00:00.000Z",
  );
  for (const value of ["2025-02-29", "2026-04-31", "2026-13-01"]) {
    assert.throws(
      () => optionalDate(value, "Fecha"),
      badRequest(/no es válida/),
    );
  }
  for (const value of ["16/10/2026", "2026-1-01", 2026]) {
    assert.throws(() => optionalDate(value, "Fecha"), badRequest(/AAAA-MM-DD/));
  }
});

test("el viaje permite fechas abiertas y hasta 366 días inclusivos", () => {
  const start = new Date("2024-01-01");
  assert.doesNotThrow(() => validateTripRange(start, undefined));
  assert.doesNotThrow(() => validateTripRange(start, start));
  assert.doesNotThrow(() => validateTripRange(start, new Date("2024-12-31")));
  assert.throws(
    () => validateTripRange(start, new Date("2023-12-31")),
    badRequest(/anterior/),
  );
  assert.throws(
    () => validateTripRange(start, new Date("2025-01-01")),
    badRequest(/366/),
  );
});

test("los viajeros admiten números del formulario y conservan los límites", () => {
  assert.equal(optionalTravelerCount(undefined), undefined);
  assert.equal(optionalTravelerCount("1"), 1);
  assert.equal(optionalTravelerCount(50), 50);
  for (const value of [0, 51, 1.5, "", null, "varios"]) {
    assert.throws(
      () => optionalTravelerCount(value),
      badRequest(/entre 1 y 50/),
    );
  }
});

test("los cambios de una parada son parciales y no permiten campos ajenos", () => {
  assert.deepEqual(normalizeCollectionItem({}), {});
  assert.deepEqual(normalizeCollectionItem({ notas: "   ", dayIndex: "" }), {
    notas: null,
    dayIndex: null,
  });
  assert.deepEqual(
    normalizeCollectionItem({
      notas: "  Reserva confirmada  ",
      dayIndex: "365",
      status: "booked",
      sortOrder: "9999",
      userId: "otro",
    }),
    {
      notas: "Reserva confirmada",
      dayIndex: 365,
      status: "booked",
      sortOrder: 9999,
    },
  );
  assert.equal(cleanCollectionText("  abcdef  ", 4), "abcd");
  assert.equal(cleanCollectionText(42, 500), null);
  assert.equal(
    normalizeCollectionItem({ notas: "x".repeat(600) }).notas.length,
    500,
  );
});

test("los cambios de una parada rechazan días, estados y posiciones inválidos", () => {
  for (const dayIndex of [0, 366, 1.5, "mañana"]) {
    assert.throws(
      () => normalizeCollectionItem({ dayIndex }),
      badRequest(/entre 1 y 365/),
    );
  }
  assert.throws(
    () => normalizeCollectionItem({ status: "published" }),
    badRequest(/Estado/),
  );
  for (const sortOrder of [-1, 10000, 0.5, "primero"]) {
    assert.throws(
      () => normalizeCollectionItem({ sortOrder }),
      badRequest(/Posición/),
    );
  }
});
