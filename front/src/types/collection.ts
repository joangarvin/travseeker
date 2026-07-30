import type { Destino } from './index';

export interface CollectionSummary {
  id: string;
  nombre: string;
  descripcion: string | null;
  color: string;
  visibility?: 'private' | 'shared';
  createdAt: string;
  updatedAt: string;
  count: number;
  covers: string[];
}

export interface CollectionItem {
  id: string;
  destinoId: string;
  notas: string | null;
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
  items: CollectionItem[];
}

export interface PublicCollection {
  nombre: string;
  descripcion: string | null;
  color: string;
  items: Array<Pick<CollectionItem, 'id' | 'destino'>>;
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
}
