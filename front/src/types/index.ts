export interface Destino {
  id: string;
  nombre: string;
  imagen: string;
  presupuesto: string;
  masificacion: string;
  ubicacion: string;
  tipoTurismoPrincipal?: string;
}

export interface Municipio {
  id: string;
  nombre: string;
  precios: string | null;
  conexiones: string | null;
  tipoTurismo: string | null;
}

export interface ComparableDestino {
  id: string;
  nombre: string;
  imagen: string;
  ubicacion: string;
  presupuesto: string;
  masificacion: string;
  tipoTurismoPrincipal: string;
  tipoTurismoSecundario: string;
  mesesJulioAgosto: number;
  mesesMayJunSeptOct: number;
  mesesNovAbril: number;
}

export interface Recommendation {
  destino: Destino;
  reason: string;
  score: number;
}

export interface DestinoDetail {
  id: string;
  nombre: string;
  imagen: string;
  descripcion: string;
  masificacion: string;
  presupuesto: string;
  ubicacion: string;
  tipoTurismoPrincipal: string;
  tipoTurismoSecundario: string;
  imprescindibles: string;
  mesesJulioAgosto: number;
  mesesMayJunSeptOct: number;
  mesesNovAbril: number;
  latitud?: number | null;
  longitud?: number | null;
  destinosItem?: string | null;
  municipios: Municipio[];
}
