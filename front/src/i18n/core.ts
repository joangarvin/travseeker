export type MessageValues = Record<string, string | number | null | undefined>;

export function resolveLocale(value: string | null | undefined): 'es' | 'en' {
  return value?.toLowerCase().split(/[-_]/)[0] === 'en' ? 'en' : 'es';
}

export function translateMessage(
  message: string,
  locale: string,
  catalog: Record<string, string>,
  values?: MessageValues,
): string {
  const translated = locale === 'en' ? (catalog[message] ?? message) : message;
  return values
    ? translated.replace(/\{(\w+)\}/g, (match, key) => String(values[key] ?? match))
    : translated;
}

export function withLanguage(href: string, language: string): string {
  const url = new URL(href);
  url.searchParams.set('lang', resolveLocale(language));
  return url.toString();
}

export function translatedCatalogName(
  item: {
    name: string;
    displayName?: string;
    translations?: Partial<Record<string, Record<string, string>>>;
  },
  locale: string,
  catalog: Record<string, string>,
): string {
  if (locale === 'es') return item.name;
  return (
    item.translations?.[locale]?.name?.trim() ||
    (item.displayName && item.displayName !== item.name
      ? item.displayName
      : translateMessage(item.name, locale, catalog))
  );
}
