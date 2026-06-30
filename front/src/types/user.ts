export interface TravelPreferences {
  tipos?: string[];
  presupuesto?: string;
  evitarMasificacion?: boolean;
}

export interface UserPreferences {
  theme?: 'system' | 'light' | 'dark';
  notifications?: boolean;
  newsletter?: boolean;
  travel?: TravelPreferences;
  [key: string]: unknown;
}

export interface User {
  id: string;
  email: string;
  nombre: string | null;
  apellidos: string | null;
  avatarUrl: string | null;
  bio: string | null;
  role: string;
  locale: string;
  preferences: UserPreferences | null;
  emailVerified: boolean;
  createdAt: string;
}

export interface ProfileUpdate {
  nombre?: string | null;
  apellidos?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  locale?: string;
  preferences?: UserPreferences;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Favorito {
  id: string;
  destinoId: string;
  notas: string | null;
  createdAt: string;
  destino: {
    id: string;
    nombre: string;
    imagen: string;
    presupuesto: string;
    masificacion: string;
    ubicacion: string;
    tipoTurismoPrincipal: string;
  };
}
