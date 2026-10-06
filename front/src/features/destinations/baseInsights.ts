import { t } from '../../i18n';
import type { Destino, Municipio } from '../../types';
import { plain } from '../../utils';
import { parsePriceRange } from '../../utils/budgetCalculator';

export type BaseMode = 'train' | 'bus' | 'car' | 'plane';
export type BaseProfile = 'coast' | 'nature' | 'heritage' | 'food' | 'urban' | 'relax';
export type BaseBadge = 'recommended' | 'cheapest' | 'connected';

export type BaseInsight = {
  municipio: Municipio;
  name: string;
  price: { min: number; max: number } | null;
  modes: BaseMode[];
  minutes: string | null;
  profiles: BaseProfile[];
  summary: string;
  connections: string;
};

const modeRules: [BaseMode, RegExp][] = [
  ['train', /\btren|renfe|ferrovi|feve|adif|cercanias/],
  ['bus', /autob|villavesa|\bbus\b|arriva|alsa|monbus/],
  ['car', /autovia|autopista|\b[an]-\d|carretera/],
  ['plane', /aeropuerto/],
];

const profileRules: [BaseProfile, RegExp][] = [
  ['coast', /playa|surf|costa|mar\b/],
  ['nature', /rural|montan|senderismo|naturaleza|ecoturismo|bosque/],
  ['heritage', /cultur|histor|patrimon|romanic|gotic|medieval|arqueol|monument/],
  ['food', /gastronom|vino|enoturism/],
  ['urban', /urban|ocio|golf|lujo|compras/],
  ['relax', /relax|termal|balneario|bienestar/],
];

export const modeLabels: Record<BaseMode, string> = {
  train: t('Tren'),
  bus: t('Autobús'),
  car: t('Coche'),
  plane: t('Aeropuerto'),
};

export const profileLabels: Record<BaseProfile, string> = {
  coast: t('Playa'),
  nature: t('Naturaleza'),
  heritage: t('Patrimonio'),
  food: t('Gastronomía'),
  urban: t('Ocio y ciudad'),
  relax: t('Relax'),
};

export const badgeLabels: Record<BaseBadge, string> = {
  recommended: t('Recomendada'),
  cheapest: t('Más económica'),
  connected: t('Mejor conectada'),
};

const LOWERCASE_PARTICLES = new Set([
  'de',
  'del',
  'la',
  'las',
  'los',
  'y',
  'e',
  'el',
  'da',
  'do',
  'das',
  'dos',
]);

function normalized(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es');
}

// Imported municipality names arrive in capitals ("CENDEA DE CIZUR").
export function displayBaseName(municipio: Pick<Municipio, 'nombre' | 'displayName'>) {
  const name = (municipio.displayName || municipio.nombre).trim();
  if (name !== name.toLocaleUpperCase('es')) return name;
  return name
    .toLocaleLowerCase('es')
    .split(/\s+/)
    .map((word, index) =>
      index && LOWERCASE_PARTICLES.has(word)
        ? word
        : word.charAt(0).toLocaleUpperCase('es') + word.slice(1),
    )
    .join(' ');
}

function journeyMinutes(text: string) {
  // "cada 10 minutos" is a frequency, not a journey time.
  const match =
    text.match(/\ben\s+(?:solo\s+|apenas\s+|unos\s+)?(\d+)(?:\s*-\s*(\d+))?\s*min/) ||
    text.match(/(?<!cada\s)\b(\d+)(?:\s*-\s*(\d+))?\s*min/);
  if (!match) return null;
  return match[2] ? `${match[1]}–${match[2]} min` : `${match[1]} min`;
}

function firstSentence(text: string, limit = 140) {
  const sentence = text.split(/(?<=[.;:])\s|\s[—–]/)[0].replace(/[.;:]$/, '');
  if (sentence.length <= limit) return sentence;
  return `${sentence.slice(0, limit).replace(/\s+\S*$/, '')}…`;
}

export function baseInsight(municipio: Municipio): BaseInsight {
  const connections = plain(municipio.conexiones || '').trim();
  const text = normalized(connections);
  const profileText = normalized(municipio.tipoTurismo || '');
  const hasPrice = /\d/.test(plain(municipio.precios || ''));
  return {
    municipio,
    name: displayBaseName(municipio),
    price: hasPrice ? parsePriceRange(municipio.precios) : null,
    modes: modeRules.filter(([, pattern]) => pattern.test(text)).map(([mode]) => mode),
    minutes: journeyMinutes(text),
    profiles: profileRules
      .filter(([, pattern]) => pattern.test(profileText))
      .map(([profile]) => profile),
    summary: firstSentence(connections),
    connections,
  };
}

export function recommendedBaseId(destination: Pick<Destino, 'nombre' | 'municipios'>) {
  const municipios = destination.municipios || [];
  const destinationName = normalized(destination.nombre);
  const namesake = municipios.find((municipio) =>
    destinationName.includes(normalized(municipio.nombre).trim()),
  );
  return (namesake || municipios[0])?.id;
}

function uniqueBest(bases: BaseInsight[], score: (base: BaseInsight) => number | null) {
  const scored = bases.filter((base) => score(base) != null);
  if (scored.length < 2) return undefined;
  const best = Math.max(...scored.map((base) => score(base)!));
  const winners = scored.filter((base) => score(base) === best);
  return winners.length === 1 ? winners[0].municipio.id : undefined;
}

export function baseBadges(bases: BaseInsight[], recommendedId?: string) {
  const badges = new Map<string, BaseBadge>();
  const cheapest = uniqueBest(bases, (base) =>
    base.price ? -(base.price.min + base.price.max) : null,
  );
  const connected = uniqueBest(bases, (base) => base.modes.length);
  if (recommendedId) badges.set(recommendedId, 'recommended');
  if (cheapest && !badges.has(cheapest)) badges.set(cheapest, 'cheapest');
  if (connected && !badges.has(connected)) badges.set(connected, 'connected');
  return badges;
}
