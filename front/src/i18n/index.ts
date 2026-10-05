import {
  resolveLocale,
  translateMessage,
  translatedCatalogName,
  withLanguage,
  type MessageValues,
} from './core';
export { resolveLocale } from './core';
import config from '../../../shared/localization.json';
import english from './en.json';

export type Locale = 'es' | 'en';
export type Translations = Partial<Record<Locale, Record<string, string>>>;
export const languages = config.languages;
const STORAGE_KEY = 'trav_locale';

function initialLocale(): Locale {
  if (typeof window === 'undefined') return 'es';
  const requested = new URLSearchParams(window.location.search).get('lang');
  try {
    if (requested === 'es' || requested === 'en') {
      localStorage.setItem(STORAGE_KEY, requested);
      return requested;
    }
    return resolveLocale(localStorage.getItem(STORAGE_KEY));
  } catch {
    return resolveLocale(requested);
  }
}

// Language switches are full navigations: module-level labels, API data, and
// formatters all start in the same locale, with no stale translated caches.
export const locale = initialLocale();
export const intlLocale = languages.find((language) => language.code === locale)!.intl;

export function languageUrl(language: string, href = window.location.href): string {
  return withLanguage(href, language);
}

export function changeLanguage(language: Locale) {
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
    /* URL remains authoritative. */
  }
  window.location.assign(languageUrl(language));
}

export function t(message: string, values?: MessageValues): string {
  return translateMessage(message, locale, english, values);
}

export function serverMessage(message: string): string {
  if (locale === 'es') return message;
  const exact = t(message);
  if (exact !== message) return exact;
  // Search match labels contain editorial content after a fixed prefix.
  const separator = message.indexOf(' · ');
  if (separator !== -1)
    return `${t(message.slice(0, separator))} · ${message.slice(separator + 3)}`;
  if (message.startsWith('Falta completar: ')) return `Please complete: ${t(message.slice(17))}`;
  return message;
}

export function catalogName(item: {
  name: string;
  displayName?: string;
  translations?: Translations;
}): string {
  return translatedCatalogName(item, locale, english);
}

if (typeof document !== 'undefined') document.documentElement.lang = locale;
