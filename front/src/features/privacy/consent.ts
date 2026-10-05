export const CONSENT_KEY = 'trav_privacy_choices';
export const CONSENT_VERSION = '2026-10-05.1';
export const CONSENT_LIFETIME_MS = 180 * 24 * 60 * 60 * 1000;
export type Choices = { analytics: boolean; maps: boolean };
export type Consent = Choices & { version: string; savedAt: number; expiresAt: number };
export function parseConsent(raw: string | null, now = Date.now()): Consent | null {
  try {
    const value = JSON.parse(raw || 'null');
    if (
      !value ||
      value.version !== CONSENT_VERSION ||
      typeof value.analytics !== 'boolean' ||
      typeof value.maps !== 'boolean' ||
      !Number.isFinite(value.savedAt) ||
      !Number.isFinite(value.expiresAt) ||
      value.savedAt > now ||
      value.expiresAt <= now ||
      value.expiresAt - value.savedAt !== CONSENT_LIFETIME_MS
    )
      return null;
    return value;
  } catch {
    return null;
  }
}
function stored() {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    const parsed = parseConsent(raw);
    if (raw && !parsed) localStorage.removeItem(CONSENT_KEY);
    return parsed;
  } catch {
    return null;
  }
}
let current = typeof window === 'undefined' ? null : stored();
const listeners = new Set<() => void>();
function notify() {
  listeners.forEach((listener) => listener());
}
export function getConsent() {
  return current;
}
export function hasConsent(category: keyof Choices) {
  return !!current && current.expiresAt > Date.now() && current[category];
}
export function subscribeConsent(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
function clearOptionalStorage() {
  if (hasConsent('maps')) return;
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith('travseeker:route:'))
      .forEach((key) => localStorage.removeItem(key));
  } catch {
    /* storage can be disabled */
  }
}
export function saveConsent(choices: Choices) {
  const now = Date.now();
  current = {
    analytics: choices.analytics === true,
    maps: choices.maps === true,
    version: CONSENT_VERSION,
    savedAt: now,
    expiresAt: now + CONSENT_LIFETIME_MS,
  };
  let persisted = true;
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(current));
  } catch {
    persisted = false;
  }
  clearOptionalStorage();
  notify();
  return persisted;
}
export function refreshConsent() {
  if (current && current.expiresAt <= Date.now()) {
    current = null;
    clearOptionalStorage();
    notify();
  }
}
if (typeof window !== 'undefined') {
  clearOptionalStorage();
  window.addEventListener('storage', (event) => {
    if (event.key !== CONSENT_KEY && event.key !== null) return;
    current = stored();
    clearOptionalStorage();
    notify();
  });
}
