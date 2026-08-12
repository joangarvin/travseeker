const NAMED_ENTITIES = {
  amp: '&',
  apos: "'",
  gt: '>',
  lt: '<',
  nbsp: ' ',
  quot: '"',
  euro: '€',
};

function decodeHtmlEntities(value) {
  return value.replace(/&(#(?:x[0-9a-f]+|\d+)|[a-z]+);/gi, (entity, code) => {
    if (code.startsWith('#')) {
      const hexadecimal = code[1]?.toLowerCase() === 'x';
      const numeric = Number.parseInt(code.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10);
      return Number.isInteger(numeric) && numeric >= 0 && numeric <= 0x10ffff
        ? String.fromCodePoint(numeric)
        : entity;
    }
    return NAMED_ENTITIES[code.toLowerCase()] ?? entity;
  });
}

function stripHtmlToText(input) {
  if (input == null || input === '') return '';
  const decoded = decodeHtmlEntities(decodeHtmlEntities(String(input)));
  return decoded
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--([\s\S]*?)-->/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanMunicipalityFields(municipality) {
  if (!municipality) return municipality;
  return {
    ...municipality,
    nombre: stripHtmlToText(municipality.nombre),
    precios: stripHtmlToText(municipality.precios),
    conexiones: stripHtmlToText(municipality.conexiones),
    tipoTurismo: stripHtmlToText(municipality.tipoTurismo),
  };
}

module.exports = { cleanMunicipalityFields, stripHtmlToText };
