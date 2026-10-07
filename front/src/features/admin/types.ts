export type AdminTab =
  | 'editorial'
  | 'destinos'
  | 'tipos-viaje'
  | 'actividades'
  | 'municipios'
  | 'reviews'
  | 'places'
  | 'catalogo-actividades'
  | 'hoteles'
  | 'restaurantes';

export type AdminResource = Exclude<
  AdminTab,
  'reviews' | 'editorial' | 'catalogo-actividades' | 'hoteles' | 'restaurantes'
>;

export type EditorialResource =
  'destinos' | 'activities' | 'tourism-types' | 'municipios' | 'places';

export type AdminFeedback = {
  tone: 'error' | 'success';
  text: string;
};
