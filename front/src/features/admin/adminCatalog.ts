import type { Activity, Destino, Municipio, Place, TourismType } from '../../types';
import { plain } from '../../utils';
import { activityValues } from '../activities/activities';
import { tourismValues } from '../tourism/tourism';

export const EMPTY_DESTINATION: Partial<Destino> = {
  nombre: '',
  ubicacion: '',
  presupuesto: 'Medio',
  masificacion: 'Medio',
  tipoTurismoPrincipal: 'Cultural',
  tipoTurismoSecundario: '',
  descripcion: '',
  imprescindibles: '',
  essentialGroups: [],
  places: [],
  imagen: '',
  destinosItem: '',
  latitud: null,
  longitud: null,
  municipios: [],
  mesesJulioAgosto: 70,
  mesesMayJunSeptOct: 45,
  mesesNovAbril: 25,
};

export const EMPTY_MUNICIPALITY: Partial<Municipio> = {
  nombre: '',
  precios: '',
  conexiones: '',
  tipoTurismo: '',
};

export const EMPTY_PLACE: Partial<Place> = {
  nombre: '',
  categoria: '',
  descripcion: '',
  latitud: 40.2,
  longitud: -3.5,
  website: '',
  sortOrder: 0,
  isActive: true,
};

function normalizeSearchValue(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .trim();
}

function matchesQuery(query: string, ...values: unknown[]) {
  const normalizedQuery = normalizeSearchValue(query);
  if (!normalizedQuery) return true;
  return normalizeSearchValue(values.join(' ')).includes(normalizedQuery);
}

export function filterDestinations(destinations: Destino[], query: string) {
  return destinations.filter((destination) =>
    matchesQuery(
      query,
      destination.nombre,
      plain(destination.ubicacion),
      tourismValues(destination.tipoTurismoPrincipal).join(' '),
      activityValues(destination.tipoTurismoSecundario).join(' '),
    ),
  );
}

export function filterMunicipalities(municipalities: Municipio[], query: string) {
  return municipalities.filter((municipality) =>
    matchesQuery(
      query,
      municipality.nombre,
      plain(municipality.tipoTurismo),
      plain(municipality.conexiones),
    ),
  );
}

export function filterPlaces(places: Place[], query: string) {
  return places.filter((place) =>
    matchesQuery(query, place.nombre, place.categoria, place.descripcion),
  );
}

export function filterActivities(activities: Activity[], query: string) {
  return activities.filter((activity) =>
    matchesQuery(query, activity.name, activity.isActive ? 'visible' : 'oculta'),
  );
}

export function filterTourismTypes(types: TourismType[], query: string) {
  return types.filter((type) =>
    matchesQuery(query, type.name, type.description, type.isActive ? 'visible' : 'oculto'),
  );
}

export function filterDestinationChoices(destinations: Destino[], query: string) {
  return destinations.filter((destination) => matchesQuery(query, destination.nombre));
}
