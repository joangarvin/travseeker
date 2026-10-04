/** Validate API envelopes before putting them into React state. */
export function readCatalogPage<T>(value: unknown): { items: T[]; total: number } {
  if (
    !value ||
    typeof value !== 'object' ||
    !('items' in value) ||
    !Array.isArray(value.items) ||
    !('total' in value) ||
    typeof value.total !== 'number' ||
    !Number.isFinite(value.total)
  ) {
    throw new Error(
      'La respuesta de administración no es compatible. Reinicia el servidor backend y vuelve a intentarlo.',
    );
  }
  return { items: value.items as T[], total: value.total };
}
export type EditorialCounts = Record<
  'all' | 'draft' | 'pending' | 'published' | 'archived',
  number
>;
export function readEditorialPage<T>(value: unknown): {
  items: T[];
  counts: EditorialCounts;
  nextCursor: string | null;
} {
  if (
    !value ||
    typeof value !== 'object' ||
    !('items' in value) ||
    !Array.isArray(value.items) ||
    !('counts' in value) ||
    !value.counts ||
    typeof value.counts !== 'object' ||
    !('nextCursor' in value) ||
    (value.nextCursor !== null && typeof value.nextCursor !== 'string')
  ) {
    throw new Error(
      'La respuesta de administración no es compatible. Reinicia el servidor backend y vuelve a intentarlo.',
    );
  }
  const counts = value.counts as EditorialCounts;
  if (
    ['all', 'draft', 'pending', 'published', 'archived'].some(
      (key) => !Number.isFinite(counts[key as keyof EditorialCounts]),
    )
  ) {
    throw new Error(
      'La respuesta de administración no es compatible. Reinicia el servidor backend y vuelve a intentarlo.',
    );
  }
  return { items: value.items as T[], counts, nextCursor: value.nextCursor };
}
