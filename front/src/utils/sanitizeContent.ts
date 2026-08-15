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

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  apos: "'",
  gt: '>',
  lt: '<',
  nbsp: ' ',
  quot: '"',
  euro: '€',
};

function decodeHtmlEntities(value: string): string {
  return value.replace(/&(#(?:x[0-9a-f]+|\d+)|[a-z]+);/gi, (entity, code: string) => {
    if (code.startsWith('#')) {
      const hexadecimal = code[1]?.toLowerCase() === 'x';
      const numeric = Number.parseInt(code.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10);
      return Number.isInteger(numeric) && numeric >= 0 && numeric <= 0x10ffff
        ? String.fromCodePoint(numeric)
        : entity;
    }
    return NAMED_ENTITIES[code.toLowerCase()] ?? entity;
  });
}

/** Returns normalized plain text with markup and encoded legacy markup removed. */
export function stripHtmlToText(input?: string | null): string {
  if (!input) return '';
  const decoded = decodeHtmlEntities(decodeHtmlEntities(String(input)));
  return decoded
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--([\s\S]*?)-->/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Keeps a small semantic tag allowlist while removing editor classes, styles and unsafe attributes. */
export function sanitizeRichHtml(input?: string | null): string {
  if (!input) return '';
  if (typeof DOMParser === 'undefined') return stripHtmlToText(input);

  const normalizedInput = /&lt;\/?[a-z][\s\S]*?&gt;/i.test(input)
    ? decodeHtmlEntities(decodeHtmlEntities(input))
    : input;
  const documentFragment = new DOMParser().parseFromString(normalizedInput, 'text/html');
  documentFragment.body.querySelectorAll('script, style').forEach((node) => node.remove());

  [...documentFragment.body.querySelectorAll('*')].forEach((node) => {
    if (!ALLOWED_HTML_TAGS.has(node.tagName)) {
      node.replaceWith(...node.childNodes);
      return;
    }

    [...node.attributes].forEach((attribute) => {
      const isAllowedLinkAttribute =
        node.tagName === 'A' && ['href', 'target', 'rel'].includes(attribute.name);
      if (!isAllowedLinkAttribute) node.removeAttribute(attribute.name);
    });

    if (node.tagName === 'A') {
      const href = node.getAttribute('href') || '';
      if (!/^(https?:|mailto:|\/(?!\/))/.test(href)) node.removeAttribute('href');
      if (node.getAttribute('target') === '_blank') {
        node.setAttribute('rel', 'noopener noreferrer');
      }
    }
  });

  return documentFragment.body.innerHTML.trim();
}
