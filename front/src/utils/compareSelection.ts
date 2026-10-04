export function normalizeCompareIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value.filter(
        (id): id is string => typeof id === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(id),
      ),
    ),
  ].slice(0, 4);
}
