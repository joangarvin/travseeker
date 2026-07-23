export interface AdminMunicipio {
  id: string;
  nombre: string;
  precios: string;
  conexiones: string;
  tipoTurismo: string;
  destinosCount?: number;
}

export interface AdminDestinoRow {
  id: string;
  nombre: string;
  ubicacion: string;
  imagen: string;
  presupuesto: string;
  masificacion: string;
  latitud: number | null;
  longitud: number | null;
  municipios: { id: string; nombre: string }[];
}

export interface AdminDestinoPayload {
  nombre: string;
  tipoTurismoPrincipal: string;
  tipoTurismoSecundario: string;
  presupuesto: string;
  masificacion: string;
  mesesJulioAgosto: number;
  mesesMayJunSeptOct: number;
  mesesNovAbril: number;
  destinosItem?: string;
  ubicacion: string;
  descripcion: string;
  imprescindibles: string;
  imagen: string;
  latitud?: number | null;
  longitud?: number | null;
}

export interface AdminMunicipioPayload {
  nombre: string;
  precios?: string;
  conexiones?: string;
  tipoTurismo?: string;
}

export interface MunicipioFormState {
  nombre: string;
  precios: string;
  conexiones: string;
  tipoTurismo: string;
}

export interface ImprescindibleSection {
  title: string;
  items: string[];
}

export interface DestinoFormState {
  nombre: string;
  ubicacion: string;
  presupuesto: string;
  masificacion: string;
  tipoTurismoPrincipal: string;
  tipoTurismoSecundario: string;
  descripcion: string;
  imagen: string;
  imprescindiblesSections: ImprescindibleSection[];
  mesesJulioAgosto: number;
  mesesMayJunSeptOct: number;
  mesesNovAbril: number;
  latitud: number | null;
  longitud: number | null;
}

export type AdminMobileView = 'list' | 'form';

export type AdminTab = 'destinos' | 'municipios';
