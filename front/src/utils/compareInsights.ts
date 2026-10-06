export const budgetLevels: Record<string, number> = {
  Bajo: 1,
  'Medio-Bajo': 2,
  Medio: 3,
  'Medio-Alto': 4,
  Alto: 5,
};

export function crowdPercentage(raw: unknown): number | null {
  if (raw === null || raw === undefined || typeof raw === 'boolean' || String(raw).trim() === '')
    return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 && value <= 100 ? value : null;
}

export function lowestScored<T>(
  entries: Array<{ item: T; score: number | null | undefined }>,
): T[] {
  const available = entries.filter(
    (entry) => typeof entry.score === 'number' && Number.isFinite(entry.score),
  );
  const minimum = Math.min(...available.map((entry) => entry.score!));
  return available.filter((entry) => entry.score === minimum).map((entry) => entry.item);
}
