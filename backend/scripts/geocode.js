/**
 * Geocodifica los destinos (rellena latitud/longitud) usando Nominatim (OpenStreetMap).
 * Nominatim es gratuito pero exige: User-Agent identificable y máx. 1 petición/segundo.
 *
 * Uso:
 *   node scripts/geocode.js          // solo destinos sin coordenadas
 *   node scripts/geocode.js --force  // todos los destinos
 */
require('dotenv').config();
const { prisma } = require('../src/config/database');

const FORCE = process.argv.includes('--force');
const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
const UA = 'TravSeeker/1.0 (geocoding script; contacto@travseeker.com)';
const DELAY_MS = 1100;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function geocode(nombre) {
  const query = `${nombre.trim()}, España`;
  const url = `${NOMINATIM}?q=${encodeURIComponent(query)}&format=jsonv2&limit=1&countrycodes=es`;
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'es' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
}

async function main() {
  const where = FORCE ? {} : { OR: [{ latitud: null }, { longitud: null }] };
  const destinos = await prisma.destino.findMany({
    where,
    select: { id: true, nombre: true },
  });

  console.log(`Geocodificando ${destinos.length} destinos${FORCE ? ' (forzado)' : ''}...\n`);

  let ok = 0;
  let fail = 0;

  for (let i = 0; i < destinos.length; i++) {
    const d = destinos[i];
    const prefix = `[${i + 1}/${destinos.length}] ${d.nombre.trim()}`;
    try {
      const coords = await geocode(d.nombre);
      if (coords) {
        await prisma.destino.update({
          where: { id: d.id },
          data: { latitud: coords.lat, longitud: coords.lon },
        });
        ok++;
        console.log(`${prefix} -> ${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`);
      } else {
        fail++;
        console.log(`${prefix} -> SIN RESULTADO`);
      }
    } catch (err) {
      fail++;
      console.log(`${prefix} -> ERROR: ${err.message}`);
    }
    await sleep(DELAY_MS);
  }

  console.log(`\nHecho. ${ok} geocodificados, ${fail} sin resultado.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
