export const catalogue = [
  {
    id: 'garraf',
    name: 'Costa del Garraf',
    country: 'España',
    code: 'ES',
    currency: 'EUR',
    languages: 'Español y catalán',
    budget: 'Medio',
    crowd: [65, 85, 35],
    types: ['Cultura', 'Naturaleza', 'Playa', 'Gastronomía'],
    note: 'Mar, pueblos y patrimonio en una misma escapada.',
    image:
      'https://res.cloudinary.com/dq5npqrdd/image/upload/f_auto,q_auto,c_limit,w_640/v1784293418/travseeker/destinos/e544b90a-8cc4-4020-bd2f-4bb032f88c32.jpg',
    source: '/destino/e544b90a-8cc4-4020-bd2f-4bb032f88c32?lang=es',
    author: 'Catálogo TravSeeker',
    license: 'Imagen del catálogo',
    licenseUrl: null,
  },
  {
    id: 'lisboa',
    name: 'Lisboa',
    country: 'Portugal',
    code: 'PT',
    currency: 'EUR',
    languages: 'Portugués',
    budget: 'Medio',
    crowd: [60, 90, 45],
    types: ['Cultura', 'Gastronomía'],
    note: 'Barrios para perderse, miradores y vida junto al río.',
    image:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f2/Lisboa_-_Portugal_%2852597836992%29.jpg/960px-Lisboa_-_Portugal_%2852597836992%29.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Lisboa_-_Portugal_(52597836992).jpg',
    author: 'Vitor Oliveira',
    license: 'CC BY-SA 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
  },
  {
    id: 'essaouira',
    name: 'Essaouira',
    country: 'Marruecos',
    code: 'MA',
    currency: 'MAD',
    languages: 'Árabe y amazig',
    budget: 'Bajo',
    crowd: [40, 65, 30],
    types: ['Cultura', 'Playa', 'Gastronomía'],
    note: 'Una medina junto al Atlántico, playa y tradición marinera.',
    image:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ae/Essaouira_beach.jpg/960px-Essaouira_beach.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Essaouira_beach.jpg',
    author: 'Uploadmo',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
  },
  {
    id: 'niza',
    name: 'Niza',
    country: 'Francia',
    code: 'FR',
    currency: 'EUR',
    languages: 'Francés',
    budget: 'Alto',
    crowd: [70, 92, 40],
    types: ['Cultura', 'Playa', 'Gastronomía'],
    note: 'Paseos mediterráneos y calles de la Riviera.',
    image:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/ba/Promenade_des_Anglais_Nice_IMG_1255.jpg/960px-Promenade_des_Anglais_Nice_IMG_1255.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Promenade_des_Anglais_Nice_IMG_1255.jpg',
    author: 'Alexander Migl',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
  },
];
export const priorities = {
  quiet: 'Tranquilidad',
  activities: 'Qué hacer',
  budget: 'Presupuesto',
  practical: 'Lo práctico',
};
export const seasons = ['Mayo–junio · septiembre–octubre', 'Julio–agosto', 'Noviembre–abril'];
export const types = ['Cultura', 'Naturaleza', 'Playa', 'Gastronomía'];
export const byId = (id) => catalogue.find((d) => d.id === id);
export function normalize(s = {}) {
  const ids = [...new Set(s.ids ?? ['garraf', 'lisboa', 'essaouira'])].filter(byId).slice(0, 4);
  const pair = [...new Set((s.pair ?? []).filter((id) => ids.includes(id)))];
  ids.forEach((id) => {
    if (pair.length < 2 && !pair.includes(id)) pair.push(id);
  });
  return {
    ids,
    pair: pair.slice(0, 2),
    priority: priorities[s.priority] ? s.priority : 'quiet',
    season: [0, 1, 2].includes(Number(s.season)) ? Number(s.season) : 0,
    wishes: [...new Set(s.wishes ?? ['Cultura', 'Playa'])].filter((t) => types.includes(t)),
    chosen: ids.includes(s.chosen) ? s.chosen : null,
    missing: !!s.missing,
    differences: !!s.differences,
  };
}
export function destinations(s, pair = false) {
  return (pair ? s.pair : s.ids).map(byId).filter(Boolean);
}
export function value(d, key, s) {
  if (key === 'quiet') return s.missing && d.id === 'essaouira' ? null : d.crowd[s.season];
  if (key === 'activities') return s.wishes.filter((t) => d.types.includes(t)).length;
  if (key === 'budget') return d.budget;
  if (key === 'practical') return d.currency;
  return d[key];
}
export function insight(s, pair = false) {
  const ds = destinations(s, pair);
  if (ds.length < 2)
    return {
      title: 'Añade otro destino para comparar',
      body: 'Puedes elegir hasta cuatro. Conservaremos tu selección mientras exploras.',
    };
  if (s.priority === 'budget')
    return {
      title: 'El nivel de gasto necesita contexto',
      body: 'Los niveles describen cada guía; no equivalen a precios comparables entre países. Mostramos la moneda original, sin conversiones ni un ganador automático.',
    };
  if (s.priority === 'practical')
    return {
      title:
        new Set(ds.map((d) => d.currency)).size > 1
          ? 'Aquí cambia la moneda'
          : 'Comparten moneda, cada lugar tiene su idioma',
      body: 'Revisa moneda e idiomas antes de elegir. Estos datos complementan la comparación del destino.',
    };
  if (s.priority === 'quiet' && ds.some((d) => value(d, 'quiet', s) === null))
    return {
      title: 'Falta información para comparar la afluencia',
      body: 'Un dato pendiente no significa menos gente. No destacamos una opción hasta tener todas las estimaciones.',
    };
  if (s.priority === 'activities' && !s.wishes.length)
    return {
      title: '¿Qué te apetece hacer?',
      body: 'Selecciona tus planes para ver qué destinos encajan. No hace falta elegirlos todos.',
    };
  const scores = ds.map((d) => ({ d, n: value(d, s.priority, s) }));
  const best =
    s.priority === 'quiet'
      ? Math.min(...scores.map((x) => x.n))
      : Math.max(...scores.map((x) => x.n));
  const names = scores.filter((x) => x.n === best).map((x) => x.d.name);
  return {
    title:
      names.length === ds.length
        ? 'Las opciones empatan en este criterio'
        : `${names.join(' y ')} ${names.length > 1 ? 'destacan' : 'destaca'} ${s.priority === 'quiet' ? 'en tranquilidad' : 'en tus planes'}`,
    body:
      s.priority === 'quiet'
        ? 'Según los valores de afluencia del ejemplo para la época seleccionada. Es una estimación de demostración, no una medición en directo.'
        : 'Coincidencias con los tipos de actividad que has seleccionado. Puedes revisar las diferencias antes de marcar tu opción.',
  };
}
export function changePair(s, side, id) {
  const pair = [...s.pair];
  const other = side === 0 ? 1 : 0;
  if (pair[other] === id) pair[other] = pair[side];
  pair[side] = id;
  return normalize({ ...s, pair });
}
export const search = (q) => {
  const fold = (x) =>
    x
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  return catalogue.filter((d) => fold(d.name + ' ' + d.country).includes(fold(q)));
};
