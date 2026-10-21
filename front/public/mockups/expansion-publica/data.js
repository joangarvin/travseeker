const spanish = [
  {
    id: '9742def1-10cf-46ad-acb3-0d65714881ef',
    name: 'Costa Blanca',
    image:
      'https://res.cloudinary.com/dq5npqrdd/image/upload/v1784291543/travseeker/destinos/9742def1-10cf-46ad-acb3-0d65714881ef.jpg',
  },
  {
    id: '018daea6-c567-4d64-9afc-fd3e7209568e',
    name: 'Pinares de Soria y Burgos',
    image:
      'https://res.cloudinary.com/dq5npqrdd/image/upload/v1784379448/travseeker/destinos/018daea6-c567-4d64-9afc-fd3e7209568e.jpg',
  },
  {
    id: '048ea539-3bb2-43cb-b2fb-c0ddc67aeac0',
    name: 'Costa de la Luz',
    image:
      'https://res.cloudinary.com/dq5npqrdd/image/upload/v1784293255/travseeker/destinos/048ea539-3bb2-43cb-b2fb-c0ddc67aeac0.jpg',
  },
  {
    id: '04cda3f6-a7f0-4e88-8174-2bb7347d49e4',
    name: 'Cuenca de Pamplona',
    image:
      'https://res.cloudinary.com/dq5npqrdd/image/upload/v1784293660/travseeker/destinos/04cda3f6-a7f0-4e88-8174-2bb7347d49e4.jpg',
  },
  {
    id: '147d1bb9-5edb-48b5-810e-03d3c0ada0e1',
    name: 'Campiña Sur Extremeña',
    image:
      'https://res.cloudinary.com/dq5npqrdd/image/upload/v1784291148/travseeker/destinos/147d1bb9-5edb-48b5-810e-03d3c0ada0e1.jpg',
  },
  {
    id: '1dcac407-5288-4626-b58f-6407ab89142c',
    name: 'Costa del Sol',
    image:
      'https://res.cloudinary.com/dq5npqrdd/image/upload/v1784293598/travseeker/destinos/1dcac407-5288-4626-b58f-6407ab89142c.jpg',
  },
  {
    id: '1e852923-8681-48ee-95af-d3111839125a',
    name: 'Gran Canaria',
    image:
      'https://res.cloudinary.com/dq5npqrdd/image/upload/v1784297486/travseeker/destinos/1e852923-8681-48ee-95af-d3111839125a.jpg',
  },
  {
    id: '2047d57b-ac9f-46e5-8fb4-c8b6b687d94f',
    name: 'Valencia',
    image:
      'https://res.cloudinary.com/dq5npqrdd/image/upload/v1784557527/travseeker/destinos/2047d57b-ac9f-46e5-8fb4-c8b6b687d94f.jpg',
  },
  {
    id: '2121d5b2-1ea3-4aaa-8a89-b5b11151c4b4',
    name: 'Campo de Calatrava',
    image:
      'https://res.cloudinary.com/dq5npqrdd/image/upload/v1784291202/travseeker/destinos/2121d5b2-1ea3-4aaa-8a89-b5b11151c4b4.jpg',
  },
  {
    id: '23736d72-bf4f-4a2e-97ca-72829739a05a',
    name: 'Pirineo Aragonés',
    image:
      'https://res.cloudinary.com/dq5npqrdd/image/upload/v1784379673/travseeker/destinos/23736d72-bf4f-4a2e-97ca-72829739a05a.jpg',
  },
  {
    id: '2877712c-8603-4e82-a881-c1a17661e0c6',
    name: 'Desierto de Tabernas',
    image:
      'https://res.cloudinary.com/dq5npqrdd/image/upload/v1784296758/travseeker/destinos/2877712c-8603-4e82-a881-c1a17661e0c6.jpg',
  },
  {
    id: '2b04d728-79e1-4686-8b48-7d5705522861',
    name: 'Bajo Aragón',
    image:
      'https://res.cloudinary.com/dq5npqrdd/image/upload/v1784290785/travseeker/destinos/2b04d728-79e1-4686-8b48-7d5705522861.jpg',
  },
];
const media = {
  Lisbon: {
    image:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f2/Lisboa_-_Portugal_%2852597836992%29.jpg/960px-Lisboa_-_Portugal_%2852597836992%29.jpg',
    source: 'https://en.wikipedia.org/wiki/Lisbon',
  },
  Porto: {
    image:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e5/Puente_Don_Luis_I%2C_Oporto%2C_Portugal%2C_2012-05-09%2C_DD_13.JPG/960px-Puente_Don_Luis_I%2C_Oporto%2C_Portugal%2C_2012-05-09%2C_DD_13.JPG',
    source: 'https://en.wikipedia.org/wiki/Porto',
  },
  Paris: {
    image:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4b/La_Tour_Eiffel_vue_de_la_Tour_Saint-Jacques%2C_Paris_ao%C3%BBt_2014_%282%29.jpg/960px-La_Tour_Eiffel_vue_de_la_Tour_Saint-Jacques%2C_Paris_ao%C3%BBt_2014_%282%29.jpg',
    source: 'https://en.wikipedia.org/wiki/Paris',
  },
  Nice: {
    image:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/ba/Promenade_des_Anglais_Nice_IMG_1255.jpg/960px-Promenade_des_Anglais_Nice_IMG_1255.jpg',
    source: 'https://en.wikipedia.org/wiki/Nice',
  },
  Marrakesh: {
    image:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9c/Pavillon_Menarag%C3%A4rten.jpg/960px-Pavillon_Menarag%C3%A4rten.jpg',
    source: 'https://en.wikipedia.org/wiki/Marrakesh',
  },
  Essaouira: {
    image:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/65/%22Ein_bemerkenswertes_historisches_Denkmal%22._16.jpg/960px-%22Ein_bemerkenswertes_historisches_Denkmal%22._16.jpg',
    source: 'https://en.wikipedia.org/wiki/Essaouira',
  },
};
const photo = (city) => media[city]?.image || '/brand/travseeker-logo.svg';
export const countries = [
  {
    code: 'ES',
    name: 'España',
    adjective: 'España',
    eyebrow: 'CERCA, PERO POR DESCUBRIR',
    headline: 'Siempre hay otra España.',
    description:
      'Costa, pueblos, ciudades y montaña. Encuentra un lugar que encaje con tu forma de viajar y recórrelo a tu ritmo.',
    image: spanish[0].image,
    alt: 'Litoral y paisaje urbano de la Costa Blanca',
    themes: ['Costa', 'Naturaleza', 'Cultura'],
    regions: ['Comunidad Valenciana', 'Castilla y León', 'Andalucía', 'Navarra'],
    currency: 'Euro',
    language: 'Español y lenguas cooficiales',
    caption: 'Fotografía del catálogo actual de TravSeeker',
  },
  {
    code: 'PT',
    name: 'Portugal',
    eyebrow: 'OTRO RITMO, MUY CERCA',
    headline: 'Un viaje con acento atlántico.',
    description:
      'De las calles de Oporto a los miradores de Lisboa. Descubre ciudades para caminar, patrimonio y una costa que invita a parar.',
    image: photo('Porto'),
    alt: 'Puente de Don Luis I y río Duero en Oporto',
    themes: ['Cultura', 'Gastronomía', 'Costa'],
    regions: ['Norte', 'Lisboa'],
    currency: 'Euro',
    language: 'Portugués',
    caption: 'Oporto · fotografía de Wikimedia Commons',
  },
  {
    code: 'FR',
    name: 'Francia',
    eyebrow: 'MUCHAS FORMAS DE ESCAPARSE',
    headline: 'Mucho más allá de una postal.',
    description:
      'Arte en París y paseos junto al Mediterráneo en Niza. Elige una región y descubre destinos con personalidad propia.',
    image: photo('Nice'),
    alt: 'Panorámica de Niza y la costa mediterránea',
    themes: ['Cultura', 'Costa', 'Gastronomía'],
    regions: ['Île-de-France', 'Provenza-Alpes-Costa Azul'],
    currency: 'Euro',
    language: 'Francés',
    caption: 'Niza · fotografía de Wikimedia Commons',
  },
  {
    code: 'MA',
    name: 'Marruecos',
    eyebrow: 'CAMBIA DE ORILLA',
    headline: 'Un viaje que despierta los sentidos.',
    description:
      'Patios y jardines en Marrakech, calles blancas y brisa atlántica en Essaouira. Dos puertas de entrada para empezar a conocer Marruecos.',
    image: photo('Marrakesh'),
    alt: 'Pabellón y estanque de los jardines de la Menara en Marrakech',
    themes: ['Cultura', 'Gastronomía', 'Costa'],
    regions: ['Marrakech-Safí'],
    currency: 'Dírham marroquí',
    language: 'Árabe y amazig',
    caption: 'Marrakech · fotografía de Wikimedia Commons',
  },
];
const es = [
  {
    idx: 0,
    region: 'Comunidad Valenciana',
    theme: 'Costa',
    description: 'Luz mediterránea, pueblos junto al mar y tiempo para una cala.',
    budget: 'Alto',
  },
  {
    idx: 1,
    region: 'Castilla y León',
    theme: 'Naturaleza',
    description: 'Bosques, lagunas y senderos para cambiar el ritmo.',
    budget: 'Medio',
  },
  {
    idx: 2,
    region: 'Andalucía',
    theme: 'Costa',
    description: 'Playas abiertas y pueblos con sabor atlántico.',
    budget: 'Medio',
  },
  {
    idx: 3,
    region: 'Navarra',
    theme: 'Cultura',
    description: 'Calles históricas y paisajes verdes alrededor de la ciudad.',
    budget: 'Bajo',
  },
].map((x) => ({ ...x, ...spanish[x.idx], country: 'ES', sample: false }));
export const destinations = [
  ...es,
  {
    id: 'demo-porto',
    name: 'Oporto',
    country: 'PT',
    region: 'Norte',
    theme: 'Cultura',
    budget: 'Medio',
    description: 'La ribera del Duero, arquitectura y paseos sin prisa.',
    image: photo('Porto'),
    sample: true,
  },
  {
    id: 'demo-lisboa',
    name: 'Lisboa',
    country: 'PT',
    region: 'Lisboa',
    theme: 'Gastronomía',
    budget: 'Medio',
    description: 'Miradores, barrios con vida y una mesa para quedarse.',
    image: photo('Lisbon'),
    sample: true,
  },
  {
    id: 'demo-paris',
    name: 'París',
    country: 'FR',
    region: 'Île-de-France',
    theme: 'Cultura',
    budget: 'Alto',
    description: 'Museos, paseos junto al Sena y barrios para perderse.',
    image: photo('Paris'),
    sample: true,
  },
  {
    id: 'demo-nice',
    name: 'Niza',
    country: 'FR',
    region: 'Provenza-Alpes-Costa Azul',
    theme: 'Costa',
    budget: 'Alto',
    description: 'Casco antiguo y paseos abiertos al Mediterráneo.',
    image: photo('Nice'),
    sample: true,
  },
  {
    id: 'demo-marrakech',
    name: 'Marrakech',
    country: 'MA',
    region: 'Marrakech-Safí',
    theme: 'Cultura',
    budget: 'Medio',
    description: 'Jardines, patios y arquitectura para explorar a pie.',
    image: photo('Marrakesh'),
    sample: true,
  },
  {
    id: 'demo-essaouira',
    name: 'Essaouira',
    country: 'MA',
    region: 'Marrakech-Safí',
    theme: 'Costa',
    budget: 'Medio',
    description: 'Una medina junto al Atlántico y un paseo por el puerto.',
    image: photo('Essaouira'),
    sample: true,
  },
];
export const scenarios = {
  inicial: { ES: 'public', PT: 'upcoming', FR: 'hidden', MA: 'hidden' },
  ampliado: { ES: 'public', PT: 'public', FR: 'public', MA: 'upcoming' },
  completo: { ES: 'public', PT: 'public', FR: 'public', MA: 'public' },
};
export const sources = Object.entries(media).map(([name, value]) => ({ name, ...value }));
