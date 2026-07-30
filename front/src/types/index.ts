export type User = {
  id: string;
  email: string;
  nombre?: string | null;
  apellidos?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  role: 'user' | 'admin' | string;
  locale?: string;
  emailVerified: boolean;
  createdAt: string;
  preferences?: Record<string, unknown> | null;
};

export type Municipio = {
  id: string;
  nombre: string;
  precios?: string;
  conexiones?: string;
  tipoTurismo?: string | null;
  destinosCount?: number;
};
export type Place = {
  id: string;
  nombre: string;
  categoria: string;
  descripcion?: string | null;
  latitud: number;
  longitud: number;
  website?: string | null;
  sortOrder?: number;
  isActive?: boolean;
};

export type Destino = {
  id: string;
  nombre: string;
  tipoTurismoPrincipal: string;
  tipoTurismoSecundario?: string;
  presupuesto: string;
  masificacion: string;
  mesesJulioAgosto: number;
  mesesNovAbril: number;
  mesesMayJunSeptOct: number;
  destinosItem?: string | null;
  ubicacion: string;
  descripcion?: string;
  imprescindibles?: string;
  imagen: string;
  latitud?: number | null;
  longitud?: number | null;
  seasonCrowd?: number;
  matchReason?: string;
  municipios?: Municipio[];
  places?: Place[];
};

export type Review = {
  id: string;
  rating: number;
  comment?: string | null;
  visitMonth?: number | null;
  createdAt: string;
  status?: string;
  adminResponse?: string | null;
  user?: { id: string; nombre?: string | null; avatarUrl?: string | null };
  destino?: { id: string; nombre: string };
};

export type CollectionSummary = {
  id: string;
  nombre: string;
  descripcion?: string | null;
  color: string;
  visibility: string;
  count: number;
  covers: string[];
  role: string;
  startDate?: string | null;
  endDate?: string | null;
};

export type CollectionDetail = CollectionSummary & {
  shareToken?: string | null;
  items: Array<{
    id: string;
    destinoId: string;
    notas?: string | null;
    dayIndex?: number | null;
    status: string;
    destino: Destino;
  }>;
  members?: Array<{
    id: string;
    role: string;
    user: Pick<User, 'id' | 'email' | 'nombre' | 'avatarUrl'>;
  }>;
};

export type SearchFilters = {
  q?: string;
  month?: string;
  presupuesto?: string;
  masificacion?: string;
  ubicacion?: string;
  tipoTurismo?: string;
  actividades?: string;
  avoidCrowds?: string;
};
