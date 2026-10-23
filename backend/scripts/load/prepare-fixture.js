// Copies content only, never account/session/trip/review tables. No source writes.
const { Client } = require("pg");
require("dotenv").config({ quiet: true });
const source = process.env.DATABASE_URL;
const target = process.env.LOAD_TEST_DATABASE_URL;
if (
  !target ||
  !/^postgresql:\/\/[^@]+@127\.0\.0\.1:55441\/load_test$/.test(target)
)
  throw new Error(
    "LOAD_TEST_DATABASE_URL must point to the dedicated local load_test database on port 55441",
  );
if (source === target) throw new Error("Source and target must differ");
const tables = [
  "Country",
  "Destino",
  "Municipio",
  "Activity",
  "TourismType",
  "Place",
  "EssentialGroup",
  "EssentialItem",
  "Experience",
  "Hotel",
  "Restaurant",
  "DestinoMunicipio",
  "DestinoActivity",
  "DestinoTourismType",
  "MunicipioExperience",
  "MunicipioHotel",
  "MunicipioRestaurant",
];
(async () => {
  const from = new Client({ connectionString: source }),
    to = new Client({ connectionString: target });
  try {
    await from.connect();
    await to.connect();
    for (const table of tables) {
      const { rows } = await to.query(
        `SELECT count(*)::int AS n FROM "${table}"`,
      );
      if (rows[0].n)
        throw new Error("Target must be empty; no truncation is performed");
    }
    await from.query("BEGIN READ ONLY");
    await to.query("BEGIN");
    // Owned disposable instance only; restores normal constraint enforcement at commit.
    await to.query("SET LOCAL session_replication_role = 'replica'");
    const counts = {};
    for (const table of tables) {
      const { rows } = await from.query(`SELECT * FROM "${table}" LIMIT 20001`);
      if (rows.length > 20000)
        throw new Error("Content snapshot exceeds safety bound");
      for (const row of rows)
        for (const key of ["createdById", "reviewedById"])
          if (key in row) row[key] = null;
      if (rows.length)
        await to.query(
          `INSERT INTO "${table}" SELECT * FROM json_populate_recordset(NULL::"${table}", $1::json)`,
          [JSON.stringify(rows)],
        );
      counts[table] = rows.length;
    }
    await from.query("COMMIT");
    await to.query("COMMIT");
    console.log(
      JSON.stringify(
        { contentRows: counts, accountsCopied: 0, privateTripsCopied: 0 },
        null,
        2,
      ),
    );
  } finally {
    await from.end();
    await to.end();
  }
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
