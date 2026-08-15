const normalizedNames = new WeakMap<object, string>();

export function normalizeSearchText(value: string): string {
  return value
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/** Returns at most `limit` matches so a search never creates an unbounded DOM list. */
export function filterMunicipalities<T extends { nombre: string }>(
  items: T[],
  query: string,
  limit = 20,
): T[] {
  const safeLimit = Math.max(0, Math.floor(limit));
  if (!safeLimit) return [];

  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return items.slice(0, safeLimit);

  const matches: T[] = [];
  for (const item of items) {
    let normalizedName = normalizedNames.get(item);
    if (normalizedName === undefined) {
      normalizedName = normalizeSearchText(item.nombre);
      normalizedNames.set(item, normalizedName);
    }
    if (normalizedName.includes(normalizedQuery)) {
      matches.push(item);
      if (matches.length === safeLimit) break;
    }
  }
  return matches;
}
