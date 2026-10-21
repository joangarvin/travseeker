export type Country = { id: string; name: string; ready: boolean; show: boolean };
export type Kind = 'Destinos' | 'Localidades' | 'Actividades' | 'Hoteles' | 'Restaurantes';
export type Entry = {
  id: string;
  country: string;
  region: string;
  kind: Kind;
  title: string;
  description: string;
  ready: boolean;
  show: boolean;
};
export type Snapshot = { countries: Country[]; entries: Entry[] };
export type Result = 'draft' | 'upcoming' | 'ready' | 'public' | 'blocked';
export const labels: Record<Result, string> = {
  draft: 'En preparación · Oculto',
  upcoming: 'Próximamente',
  ready: 'Listo para publicar',
  public: 'Publicado',
  blocked: 'Oculto por país',
};
export const kinds: Kind[] = ['Destinos', 'Localidades', 'Actividades', 'Hoteles', 'Restaurantes'];
export const regions: Record<string, string[]> = {
  ES: ['Cataluña', 'País Vasco'],
  PT: ['Norte', 'Lisboa'],
  FR: ['Bretaña', 'Occitania'],
  MA: ['Marrakech-Safi', 'Tánger-Tetuán-Alhucemas'],
};
export function teaser(kind: Kind) {
  return kind === 'Destinos' || kind === 'Localidades';
}
export function countryResult(country: Country): Result {
  return !country.show
    ? country.ready
      ? 'ready'
      : 'draft'
    : country.ready
      ? 'public'
      : 'upcoming';
}
export function entryResult(entry: Entry, countries: Country[]): Result {
  if (!entry.show) return entry.ready ? 'ready' : 'draft';
  const country = countries.find((c) => c.id === entry.country);
  if (!country || countryResult(country) !== 'public') return 'blocked';
  return entry.ready ? 'public' : teaser(entry.kind) ? 'upcoming' : 'draft';
}
export function validate(entry: Entry) {
  if (!entry.title.trim()) return 'Escribe un nombre para guardar el contenido.';
  if (!entry.country || !regions[entry.country]?.includes(entry.region))
    return 'Selecciona un país y una región compatible.';
  if (entry.ready && entry.description.trim().length < 20)
    return 'Para marcar Acabado, añade una descripción de al menos 20 caracteres.';
  if (!entry.ready && entry.show && !teaser(entry.kind))
    return 'Este catálogo no admite anuncios Próximamente.';
  return '';
}
export const initial: Snapshot = {
  countries: [
    { id: 'ES', name: 'España', ready: true, show: true },
    { id: 'PT', name: 'Portugal', ready: true, show: false },
    { id: 'FR', name: 'Francia', ready: false, show: true },
    { id: 'MA', name: 'Marruecos', ready: false, show: false },
  ],
  entries: [
    {
      id: 'garraf',
      country: 'ES',
      region: 'Cataluña',
      kind: 'Destinos',
      title: 'Costa del Garraf',
      description: 'Playas, patrimonio y senderos junto al Mediterráneo.',
      ready: true,
      show: true,
    },
    {
      id: 'sitges',
      country: 'ES',
      region: 'Cataluña',
      kind: 'Localidades',
      title: 'Sitges',
      description: 'Paseos junto al mar y patrimonio modernista.',
      ready: true,
      show: false,
    },
    {
      id: 'bilbao',
      country: 'ES',
      region: 'País Vasco',
      kind: 'Destinos',
      title: 'Bilbao y el Gran Bilbao',
      description: 'Arquitectura, cultura y gastronomía junto a la ría.',
      ready: true,
      show: true,
    },
    {
      id: 'porto',
      country: 'PT',
      region: 'Norte',
      kind: 'Destinos',
      title: 'Oporto y el Duero',
      description: 'Barrios históricos y paisajes junto al río Duero.',
      ready: true,
      show: true,
    },
    {
      id: 'lisboa',
      country: 'PT',
      region: 'Lisboa',
      kind: 'Destinos',
      title: 'Lisboa',
      description: 'Miradores, barrios y paseos a orillas del Tajo.',
      ready: true,
      show: false,
    },
    {
      id: 'hotelporto',
      country: 'PT',
      region: 'Norte',
      kind: 'Hoteles',
      title: 'Alojamiento en Oporto · ejemplo',
      description: 'Ficha de alojamiento de demostración, pendiente de verificar.',
      ready: false,
      show: false,
    },
    {
      id: 'restlisboa',
      country: 'PT',
      region: 'Lisboa',
      kind: 'Restaurantes',
      title: 'Mesa de Lisboa · ejemplo',
      description: 'Ficha de restaurante de demostración, pendiente de verificar.',
      ready: false,
      show: false,
    },
    {
      id: 'portoactivity',
      country: 'PT',
      region: 'Norte',
      kind: 'Actividades',
      title: 'Paseo por la Ribeira',
      description: 'Un recorrido a pie por el barrio junto al río.',
      ready: true,
      show: false,
    },
    {
      id: 'breton',
      country: 'FR',
      region: 'Bretaña',
      kind: 'Destinos',
      title: 'Costa de Bretaña',
      description: '',
      ready: false,
      show: true,
    },
    {
      id: 'occitania',
      country: 'FR',
      region: 'Occitania',
      kind: 'Localidades',
      title: 'Carcasona',
      description: '',
      ready: false,
      show: false,
    },
    {
      id: 'marrakech',
      country: 'MA',
      region: 'Marrakech-Safi',
      kind: 'Destinos',
      title: 'Marrakech',
      description: '',
      ready: false,
      show: false,
    },
    {
      id: 'tanger',
      country: 'MA',
      region: 'Tánger-Tetuán-Alhucemas',
      kind: 'Localidades',
      title: 'Tánger',
      description: 'Encuentros de culturas y vistas al estrecho.',
      ready: true,
      show: false,
    },
  ],
};
