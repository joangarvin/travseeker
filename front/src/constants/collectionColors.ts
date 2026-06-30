export interface CollectionColor {
  id: string;
  label: string;
  hex: string;
}

export const COLLECTION_COLORS: CollectionColor[] = [
  { id: 'emerald', label: 'Esmeralda', hex: '#1f9d6a' },
  { id: 'sky', label: 'Cielo', hex: '#0ea5e9' },
  { id: 'amber', label: 'Ámbar', hex: '#f59e0b' },
  { id: 'rose', label: 'Coral', hex: '#f43f5e' },
  { id: 'violet', label: 'Violeta', hex: '#8b5cf6' },
  { id: 'slate', label: 'Pizarra', hex: '#64748b' },
];

export function colorHex(id: string): string {
  return (COLLECTION_COLORS.find((c) => c.id === id) || COLLECTION_COLORS[0]).hex;
}
