export const TOUR_KEY = 'trav_tour_v1';
export type TourResult = 'dismissed' | 'completed';
const valid = (value: string | null): value is TourResult =>
  value === 'dismissed' || value === 'completed';

export function readTourResult(persistent: boolean): TourResult | null {
  for (const kind of persistent ? ['localStorage', 'sessionStorage'] : ['sessionStorage']) {
    try {
      const value = window[kind as 'localStorage' | 'sessionStorage'].getItem(TOUR_KEY);
      if (valid(value)) return value;
    } catch {
      /* Storage may be unavailable. */
    }
  }
  return null;
}
export function saveTourResult(result: TourResult, persistent: boolean) {
  try {
    sessionStorage.setItem(TOUR_KEY, result);
  } catch {
    /* Keep in-memory state. */
  }
  try {
    if (persistent) localStorage.setItem(TOUR_KEY, result);
    else localStorage.removeItem(TOUR_KEY);
  } catch {
    /* Keep session or in-memory state. */
  }
}
export function tourWasOffered() {
  try {
    return sessionStorage.getItem(`${TOUR_KEY}:offered`) === 'true';
  } catch {
    return false;
  }
}
export function markTourOffered() {
  try {
    sessionStorage.setItem(`${TOUR_KEY}:offered`, 'true');
  } catch {
    /* Optional UI memory. */
  }
}
