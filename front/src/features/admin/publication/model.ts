export type Result = 'draft' | 'ready' | 'public' | 'upcoming' | 'blocked';
export type Country = {
  code: string;
  name: string;
  preparationComplete: boolean;
  showOnWebsite: boolean;
  contentCount: number;
  completeCount: number;
  state: Result;
};
export type Entry = {
  id: string;
  resource: string;
  title: string;
  description: string;
  countryCode: string | null;
  region: string;
  preparationComplete: boolean;
  showOnWebsite: boolean;
  state: Result;
  global: boolean;
  teaser: boolean;
  editorTab: string;
};
export const labels: Record<Result, string> = {
  draft: 'En preparación · Oculto',
  ready: 'Listo para publicar',
  public: 'Publicado',
  upcoming: 'Próximamente',
  blocked: 'Oculto por país',
};
export function outcome(ready: boolean, show: boolean, country?: Country, teaser = false): Result {
  if (!show) return ready ? 'ready' : 'draft';
  if (country && (!country.preparationComplete || !country.showOnWebsite)) return 'blocked';
  return ready ? 'public' : teaser ? 'upcoming' : 'draft';
}
export const resources = [
  { id: 'destinos', name: 'Destinos', tab: 'destinos' },
  { id: 'municipios', name: 'Localidades', tab: 'municipios' },
  { id: 'actividades', name: 'Actividades', tab: 'catalogo-actividades' },
  { id: 'hoteles', name: 'Hoteles', tab: 'hoteles' },
  { id: 'restaurantes', name: 'Restaurantes', tab: 'restaurantes' },
  { id: 'places', name: 'Lugares', tab: 'places' },
  { id: 'tipos-actividad', name: 'Tipos de actividad', tab: 'actividades', global: true },
  { id: 'tipos-viaje', name: 'Tipos de viaje', tab: 'tipos-viaje', global: true },
] as const;
