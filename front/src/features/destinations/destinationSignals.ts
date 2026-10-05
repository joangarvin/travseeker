import { t } from '../../i18n';
import type { Destino, EssentialGroup, EssentialItem } from '../../types';
import {
  essentialCategory,
  type EssentialIconName,
  type EssentialTone,
} from '../essentials/essentialIcons';
import { essentialGroupKey, essentialPresentation } from '../essentials/essentialPresentation';
import { excerptAtWord, plain } from '../../utils';
import { crowdLevel, type CrowdLevel } from '../../utils/climate';
import { parsePriceRange } from '../../utils/budgetCalculator';

const BUDGET_LEVELS = ['bajo', 'medio-bajo', 'medio', 'medio-alto', 'alto'];
const CROWD_LEVELS = ['nulo', 'leve', 'medio', 'alto', 'muy alto'];

export const LEVEL_STEPS = 5;

function levelOf(value: string | undefined, scale: string[]) {
  const index = scale.indexOf(
    plain(value || '')
      .trim()
      .toLocaleLowerCase('es'),
  );
  return index < 0 ? null : index + 1;
}

export type SeasonCrowd = { label: string; value: number; level: CrowdLevel };

export function seasonCrowds(destination: Destino): SeasonCrowd[] {
  return [
    { label: t('Nov–Abr'), value: destination.mesesNovAbril },
    { label: t('May–Jun · Sep–Oct'), value: destination.mesesMayJunSeptOct },
    { label: t('Jul–Ago'), value: destination.mesesJulioAgosto },
  ].flatMap(({ label, value }) => {
    const level = crowdLevel(value);
    return level ? [{ label, value: Math.round(value), level }] : [];
  });
}

export function destinationHook(destination: Destino) {
  const text = plain(destination.descripcion).trim();
  const sentence = text.match(/^.+?[.!?](?=\s|$)/)?.[0] || text;
  return (
    excerptAtWord(sentence, 180) ||
    t('Información práctica para decidir si {0} encaja en tu viaje.', {
      0: destination.nombre.trim(),
    })
  );
}

export function destinationStory(destination: Destino) {
  const text = plain(destination.descripcion).replace(/\s+/g, ' ').trim();
  const rest = text.replace(/^.+?[.!?](?=\s|$)/, '').trim();
  return excerptAtWord(rest, 220);
}

const MIX_LIMIT = 5;
const LEADING_VERB =
  /^(?:visitar|recorrer|conocer|explorar|admirar|descubrir|disfrutar(?: de)?|ver|probar|callejear por|pasear por|subir a|hacer (?:una |un )?(?:ruta|excursión|senderismo|paseo|visita)?(?: a pie(?: o en bicicleta)?| en bicicleta)?(?: a| por| en| de)?|visit|explore|discover|see|try|walk (?:along|through|around)|stroll (?:along|through)|hike (?:in|on)|take (?:a|an) (?:trip|walk|hike) (?:to|in|along))\s+(?:(?:el|la|los|las|un|una|the|a|an)\s+)?/i;

export type MixSegment = {
  key: string;
  tone: EssentialTone;
  label: string;
  icon: EssentialIconName;
  count: number;
  share: number;
  examples: string[];
  groupKeys: string[];
};

function essentialPlace(item: EssentialItem) {
  const { lead } = essentialPresentation(item);
  const place = lead.replace(LEADING_VERB, '').trim();
  return place.charAt(0).toLocaleUpperCase() + place.slice(1);
}

export function destinationMix(groups: EssentialGroup[] = []) {
  const segments = new Map<string, MixSegment>();
  groups.forEach((group, index) => {
    if (!group.items?.length) return;
    const category = essentialCategory(group.title, group.icon);
    const key = category.tone === 'explore' ? `explore:${group.title}` : category.tone;
    const segment = segments.get(key) ?? {
      key,
      ...category,
      count: 0,
      share: 0,
      examples: [],
      groupKeys: [],
    };
    segment.count += group.items.length;
    segment.groupKeys.push(essentialGroupKey(group, index));
    segment.examples.push(...group.items.map(essentialPlace).filter(Boolean));
    segments.set(key, segment);
  });

  const sorted = [...segments.values()].sort((a, b) => b.count - a.count);
  const kept = sorted.slice(0, MIX_LIMIT - (sorted.length > MIX_LIMIT ? 1 : 0));
  const others = sorted.slice(kept.length);
  if (others.length) {
    kept.push({
      key: 'others',
      tone: 'explore',
      label: t('Otros'),
      icon: 'Compass',
      count: others.reduce((sum, segment) => sum + segment.count, 0),
      share: 0,
      examples: others.flatMap((segment) => segment.examples),
      groupKeys: others.flatMap((segment) => segment.groupKeys),
    });
  }
  const total = kept.reduce((sum, segment) => sum + segment.count, 0);
  return kept.map((segment) => ({
    ...segment,
    share: Math.round((segment.count / total) * 100),
    examples: [...new Set(segment.examples)].slice(0, 3),
  }));
}

export function mixHeadline(segments: MixSegment[], destinationName: string) {
  const named = segments.filter(({ key }) => key !== 'others');
  const names = named
    .slice(0, 3)
    .map(({ label, tone }) => (tone === 'explore' ? label : label.toLocaleLowerCase()));
  if (!names.length) return t('{0}, en pocas palabras', { 0: destinationName });
  if (names.length === 1) return t('Un destino de {0}', { 0: names[0] });
  if (named[0].share < 35) {
    return names.length === 2
      ? t('Un poco de todo: {0} y {1}', { 0: names[0], 1: names[1] })
      : t('Un poco de todo: {0}, {1} y {2}', { 0: names[0], 1: names[1], 2: names[2] });
  }
  return names.length === 2
    ? t('Sobre todo {0}, con {1}', { 0: names[0], 1: names[1] })
    : t('Sobre todo {0}, con {1} y {2}', { 0: names[0], 1: names[1], 2: names[2] });
}

export function destinationSignals(destination: Destino) {
  const prices = (destination.municipios || [])
    .filter((municipio) => /\d/.test(plain(municipio.precios || '')))
    .map((municipio) => parsePriceRange(municipio.precios).min);
  const essentials = (destination.essentialGroups || []).reduce(
    (sum, group) => sum + (group.items?.length || 0),
    0,
  );
  return {
    budgetLevel: levelOf(destination.presupuesto, BUDGET_LEVELS),
    crowdLevel: levelOf(destination.masificacion, CROWD_LEVELS),
    seasons: seasonCrowds(destination),
    essentials,
    hasEssentials: essentials > 0 || Boolean(plain(destination.imprescindibles)),
    bases: destination.municipios?.length || 0,
    fromPrice: prices.length ? Math.min(...prices) : null,
  };
}
