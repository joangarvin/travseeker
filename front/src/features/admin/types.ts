export type AdminTab =
  'destinos' | 'tipos-viaje' | 'actividades' | 'municipios' | 'reviews' | 'places';

export type AdminResource = Exclude<AdminTab, 'reviews'>;

export type AdminFeedback = {
  tone: 'error' | 'success';
  text: string;
};
