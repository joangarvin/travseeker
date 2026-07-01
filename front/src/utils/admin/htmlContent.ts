function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function htmlToPlainText(html: string): string {
  if (!html) return '';
  if (typeof document === 'undefined') {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const blocks: string[] = [];
  doc.body.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const t = (node.textContent || '').trim();
      if (t) blocks.push(t);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const tag = el.tagName.toLowerCase();
      if (tag === 'br') blocks.push('');
      else if (['p', 'div', 'h1', 'h2', 'h3', 'h4', 'li'].includes(tag)) {
        const t = (el.textContent || '').trim();
        if (t) blocks.push(t);
      }
    }
  });
  return blocks.join('\n\n').trim();
}

export function plainTextToHtml(text: string): string {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (paragraphs.length === 0) return '';
  return paragraphs
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
}
