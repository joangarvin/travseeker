import type { ImprescindibleSection } from '../../types/admin';
import { htmlToPlainText } from './htmlContent';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function parseImprescindibles(html: string): ImprescindibleSection[] {
  if (!html?.trim()) return [{ title: '', items: [''] }];
  if (typeof document === 'undefined') {
    return [{ title: 'Imprescindibles', items: [htmlToPlainText(html)] }];
  }

  const doc = new DOMParser().parseFromString(html, 'text/html');
  const sections: ImprescindibleSection[] = [];
  let current: ImprescindibleSection | null = null;

  doc.body.childNodes.forEach((node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as Element;
    const tag = el.tagName.toLowerCase();

    if (/^h[1-6]$/.test(tag)) {
      current = { title: (el.textContent || '').trim(), items: [''] };
      sections.push(current);
    } else if (tag === 'ul' || tag === 'ol') {
      if (!current) {
        current = { title: '', items: [] };
        sections.push(current);
      }
      const items = Array.from(el.querySelectorAll('li'))
        .map((li) => (li.textContent || '').trim())
        .filter(Boolean);
      current.items = items.length > 0 ? items : [''];
    } else if (tag === 'p') {
      const text = (el.textContent || '').trim();
      if (text) {
        if (!current) {
          current = { title: '', items: [] };
          sections.push(current);
        }
        current.items.push(text);
      }
    }
  });

  const cleaned = sections
    .map((s) => ({
      title: s.title,
      items: s.items.filter(Boolean).length > 0 ? s.items.filter(Boolean) : [''],
    }))
    .filter((s) => s.title || s.items.some(Boolean));

  return cleaned.length > 0 ? cleaned : [{ title: '', items: [''] }];
}

export function serializeImprescindibles(sections: ImprescindibleSection[]): string {
  const parts = sections
    .map((section) => {
      const items = section.items.map((i) => i.trim()).filter(Boolean);
      if (items.length === 0) return '';
      const title = section.title.trim();
      const titleHtml = title ? `<h3>${escapeHtml(title)}</h3>` : '';
      const listHtml = `<ul>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>`;
      return `${titleHtml}${listHtml}`;
    })
    .filter(Boolean);

  return parts.join('') || '<p></p>';
}
