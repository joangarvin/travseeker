const { stripHtmlToText } = require('../utils/sanitizeContent');

// Spelling variants confirmed against the destination links in the catalog.
const aliases = new Map([
  ['mondoñero', 'mondoñedo'],
  ['santillana de mar', 'santillana del mar'],
]);

function municipalityKey(value) {
  const name = stripHtmlToText(value).toLowerCase().replace(/[’‘]/g, "'");
  return (aliases.get(name) || name).normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

function hasValue(value) {
  return value != null && (typeof value !== 'string' || value.trim() !== '');
}

function mergeMissing(target, source) {
  const result = structuredClone(target || {});
  for (const [key, value] of Object.entries(source || {})) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = mergeMissing(result[key], value);
    } else if (!hasValue(result[key])) result[key] = value;
  }
  return result;
}

function buildMunicipalityMerges(municipalities) {
  const groups = new Map();
  for (const row of municipalities) {
    const key = municipalityKey(row.nombre);
    if (!key) continue;
    groups.set(key, [...(groups.get(key) || []), row]);
  }
  const plans = [];
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    // Same names may denote different places. Do not merge conflicting locations.
    const located = group.filter(m => m.latitud != null && m.longitud != null);
    if (located.some(a => located.some(b =>
      Math.abs(a.latitud - b.latitud) > 0.05 || Math.abs(a.longitud - b.longitud) > 0.05))) {
      throw new Error(`Revisión geográfica necesaria: ${group[0].nombre}`);
    }
    const fields = ['precios', 'conexiones', 'tipoTurismo', 'descripcion', 'imagen', 'imagenAlt', 'ubicacion', 'website', 'mejorEpoca', 'consejos'];
    const score = m => fields.filter(f => hasValue(m[f])).length;
    const sorted = [...group].sort((a, b) =>
      Number(b.editorialStatus === 'published') - Number(a.editorialStatus === 'published') ||
      score(b) - score(a) || (b.conexiones || '').length - (a.conexiones || '').length ||
      a.id.localeCompare(b.id));
    const [canonical, ...duplicates] = sorted;
    const data = Object.fromEntries(['nombre', ...fields, 'latitud', 'longitud'].map(f => [f, canonical[f]]));
    data.translations = structuredClone(canonical.translations || {});
    for (const donor of duplicates) {
      for (const field of fields) {
        if (!hasValue(data[field]) && hasValue(donor[field])) {
          data[field] = donor[field];
          for (const [locale, translation] of Object.entries(donor.translations || {})) {
            data.translations[locale] ||= {};
            if (hasValue(translation[field])) data.translations[locale][field] = translation[field];
          }
        }
      }
      if (data.latitud == null && donor.latitud != null && donor.longitud != null) {
        data.latitud = donor.latitud;
        data.longitud = donor.longitud;
      }
      data.translations = mergeMissing(data.translations, donor.translations);
    }
    const correctedNames = { 'mondonedo': 'MONDOÑEDO', 'santillana del mar': 'SANTILLANA DEL MAR',
      'trevelez': 'TREVÉLEZ', 'vilafames': 'VILAFAMÉS' };
    data.nombre = correctedNames[municipalityKey(data.nombre)] || data.nombre;
    for (const translation of Object.values(data.translations)) {
      // Municipality proper names are not translated in this catalog.
      if (group.some(m => translation.nombre === m.nombre)) translation.nombre = data.nombre;
      if (translation.precios && data.precios) translation.precios = data.precios;
    }
    plans.push({ canonicalId: canonical.id, duplicateIds: duplicates.map(m => m.id), data });
  }
  return plans;
}

function remapItinerary(itinerary, mapping) {
  if (!Array.isArray(itinerary)) return itinerary;
  return itinerary.map(day => day && mapping.has(day.baseMunicipioId)
    ? { ...day, baseMunicipioId: mapping.get(day.baseMunicipioId) } : day);
}

module.exports = { municipalityKey, buildMunicipalityMerges, remapItinerary };
