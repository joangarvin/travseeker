import type { Destino } from './index';

export interface CollectionSummary {
  id: string;
  nombre: string;
  descripcion: string | null;
  color: string;
  visibility?: 'private' | 'shared';
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
  updatedAt: string;
  count: number;
  covers: string[];
  role?: CollectionAccessRole;
}

export type CollectionAccessRole = 'owner' | 'editor' | 'viewer';
export interface CollectionMember { id: string; role: 'editor' | 'viewer'; user: { id: string; email: string; nombre: string | null; avatarUrl: string | null } }

export interface CollectionItem {
  id: string;
  destinoId: string;
  notas: string | null;
  dayIndex: number | null;
  status: 'idea' | 'confirmed' | 'booked';
  sortOrder: number;
  createdAt: string;
  destino: Destino;
}

export interface CollectionDetail {
  id: string;
  nombre: string;
  descripcion: string | null;
  color: string;
  createdAt: string;
  updatedAt: string;
  visibility?: 'private' | 'shared';
  shareToken?: string | null;
  startDate: string | null;
  endDate: string | null;
  items: CollectionItem[];
  role: CollectionAccessRole;
  members: CollectionMember[];
}

export interface PublicCollection {
  nombre: string;
  descripcion: string | null;
  color: string;
  startDate: string | null;
  endDate: string | null;
  items: Array<Pick<CollectionItem, 'id' | 'destino' | 'dayIndex' | 'status' | 'sortOrder'>>;
}

export interface CollectionForDestino {
  id: string;
  nombre: string;
  color: string;
  contains: boolean;
}

export interface CollectionInput {
  nombre?: string;
  descripcion?: string | null;
  color?: string;
  startDate?: string | null;
  endDate?: string | null;
}
