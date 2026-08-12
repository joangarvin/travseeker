import { sanitizeRichHtml, stripHtmlToText } from './sanitizeContent';

export function plainText(value?: string | null) {
  if (!value) return '';

  try {
    const parsedValue = JSON.parse(value);

    if (Array.isArray(parsedValue)) {
      return parsedValue.map((item) => stripHtmlToText(String(item))).join(', ');
    }
    if (typeof parsedValue === 'string') return stripHtmlToText(parsedValue);
  } catch {
    // El valor ya está almacenado como texto plano.
  }

  return stripHtmlToText(value);
}

export function sanitizeHtml(value?: string | null) {
  return sanitizeRichHtml(value);
}
