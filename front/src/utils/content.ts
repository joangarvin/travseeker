const ALLOWED_HTML_TAGS = new Set([
  'A',
  'B',
  'BLOCKQUOTE',
  'BR',
  'EM',
  'H2',
  'H3',
  'H4',
  'LI',
  'OL',
  'P',
  'STRONG',
  'UL',
]);

export function plainText(value?: string | null) {
  if (!value) return '';

  try {
    const parsedValue = JSON.parse(value);

    if (Array.isArray(parsedValue)) return parsedValue.join(', ');
    if (typeof parsedValue === 'string') return parsedValue;
  } catch {
    // El valor ya está almacenado como texto plano.
  }

  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function sanitizeHtml(value?: string | null) {
  if (!value || typeof DOMParser === 'undefined') return '';

  const documentFragment = new DOMParser().parseFromString(value, 'text/html');

  [...documentFragment.body.querySelectorAll('*')].forEach((node) => {
    if (!ALLOWED_HTML_TAGS.has(node.tagName)) {
      node.replaceWith(...node.childNodes);
      return;
    }

    [...node.attributes].forEach((attribute) => {
      const isAllowedLinkAttribute =
        node.tagName === 'A' && ['href', 'target', 'rel'].includes(attribute.name);

      if (!isAllowedLinkAttribute) {
        node.removeAttribute(attribute.name);
      }
    });

    if (node.tagName === 'A') {
      const href = node.getAttribute('href') || '';

      if (!/^(https?:|mailto:|\/(?!\/))/.test(href)) {
        node.removeAttribute('href');
      }

      if (node.getAttribute('target') === '_blank') {
        node.setAttribute('rel', 'noopener noreferrer');
      }
    }
  });

  return documentFragment.body.innerHTML;
}
