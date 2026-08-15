export type AdminTab =
  'editorial' | 'destinos' | 'tipos-viaje' | 'actividades' | 'municipios' | 'reviews' | 'places';

export type AdminResource = Exclude<AdminTab, 'reviews' | 'editorial'>;

export type EditorialResource =
  'destinos' | 'activities' | 'tourism-types' | 'municipios' | 'places';

export type AdminFeedback = {
  tone: 'error' | 'success';
  text: string;
};
