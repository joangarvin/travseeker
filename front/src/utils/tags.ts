export function parseTagValues(value?: string | string[] | null): string[] {
  if (Array.isArray(value)) {
    return [...new Set(value.map((item) => String(item).trim()).filter(Boolean))];
  }
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parseTagValues(parsed.map(String));
    if (typeof parsed === 'string') return parseTagValues(parsed);
  } catch {
    /* Compatibilidad con valores históricos sin serializar. */
  }

  return [
    ...new Set(
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

export function serializeTagValues(values: string[]) {
  return JSON.stringify(parseTagValues(values));
}

export function tagQueryValue(values: string[]) {
  return parseTagValues(values).join(',');
}
