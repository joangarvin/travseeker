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

export type EditorialStatus = 'draft' | 'pending' | 'published' | 'archived';

export type EditorialActor = Pick<User, 'id' | 'email' | 'nombre' | 'apellidos' | 'avatarUrl'>;

export type EditorialFields = {
  editorialStatus: EditorialStatus;
  submittedAt?: string;
  reviewedAt?: string | null;
  createdById?: string | null;
  reviewedById?: string | null;
  createdBy?: EditorialActor | null;
  reviewedBy?: EditorialActor | null;
};

export type Municipio = EditorialFields & {
  id: string;
  nombre: string;
  precios?: string;
  conexiones?: string;
  tipoTurismo?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  destinosCount?: number;
};
export type Place = EditorialFields & {
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

export type EssentialItem = {
  id: string;
  title: string;
  description?: string | null;
  icon?: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  duration?: string | null;
  bestTime?: string | null;
  reservationRequired?: boolean | null;
  officialUrl?: string | null;
  placeId?: string | null;
  place?: Place | null;
  sortOrder: number;
};

export type EssentialGroup = {
  id: string;
  title: string;
  icon: string;
  sortOrder: number;
  items: EssentialItem[];
};

export type Activity = EditorialFields & {
  id: string;
  name: string;
  slug: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
  destinationsCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type TourismType = EditorialFields & {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  colorKey: string;
  colorValue: string;
  sortOrder: number;
  isActive: boolean;
  destinationsCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type Destino = EditorialFields & {
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
  searchMatch?: {
    kind: string;
    label: string;
  };
  municipios?: Municipio[];
  places?: Place[];
  essentialGroups?: EssentialGroup[];
  activities?: Activity[];
  activityIds?: string[];
  tourismTypes?: TourismType[];
  tourismTypeIds?: string[];
};

export type TemperatureUnit = 'C' | 'F';
export type ClimateMetric = 'rain' | 'sun' | 'crowd';

export type ClimateMonth = {
  month: number;
  name: string;
  temperatureMaxC: number | null;
  temperatureMinC: number | null;
  rainyDaysPerYear: number | null;
  precipitationMmPerYear: number | null;
  sunshineHoursPerDay: number | null;
  sampleYears: number;
  coverage: number;
  crowd: number | null;
  recommendationScore: number | null;
  scoreComponents: Partial<Record<'comfort' | 'rain' | 'sunshine' | 'crowd', number>>;
};

export type ClimateResponse = {
  destinationId: string;
  source: string;
  provider: string;
  model: string;
  period: { start: string; end: string; sampleYears: number; coverage: number };
  stale: boolean;
  fetchedAt: string;
  months: ClimateMonth[];
  recommendedMonths: Array<{
    rank: number;
    month: number;
    name: string;
    score: number;
    components: ClimateMonth['scoreComponents'];
  }>;
};

export type Review = {
  id: string;
  rating: number;
  comment?: string | null;
  visitMonth?: number | null;
  createdAt: string;
  status: 'pending' | 'published' | 'rejected' | 'flagged';
  adminResponse?: string | null;
  respondedAt?: string | null;
  updatedAt?: string;
  user?: {
    id: string;
    nombre?: string | null;
    apellidos?: string | null;
    avatarUrl?: string | null;
  };
  destino?: { id: string; nombre: string };
};

export type ReviewStats = {
  average?: number;
  count?: number;
  distribution?: Record<1 | 2 | 3 | 4 | 5, number>;
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
  travelerCount: number;
  itineraryDays?: number;
  memberCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type CollectionDetail = CollectionSummary & {
  shareToken?: string | null;
  itinerary: ItineraryDay[];
  owner?: Pick<User, 'id' | 'nombre' | 'avatarUrl'>;
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
    user: Pick<User, 'id' | 'nombre' | 'avatarUrl'> & { email?: string };
  }>;
};

export interface ItineraryDay {
  dayNumber: number;
  date?: string;
  destinationId: string;
  baseMunicipioId?: string;
  notes?: string;
  plannedActivities?: string[];
}

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

export type FilterOptions = {
  locations: string[];
  activities: string[];
};
