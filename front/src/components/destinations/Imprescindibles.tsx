import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface Section {
  title: string;
  items: string[];
}

const ITEMS_PREVIEW = 6;

function parseSections(html: string): Section[] {
  if (typeof window === 'undefined' || !html) return [];
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const sections: Section[] = [];
  let current: Section | null = null;

  doc.body.childNodes.forEach((node) => {
    if (node.nodeType !== 1) return;
    const el = node as Element;
    const tag = el.tagName.toLowerCase();

    if (/^h[1-6]$/.test(tag)) {
      current = { title: (el.textContent || '').trim(), items: [] };
      sections.push(current);
    } else if (tag === 'ul' || tag === 'ol') {
      if (!current) {
        current = { title: '', items: [] };
        sections.push(current);
      }
      el.querySelectorAll('li').forEach((li) => {
        const text = (li.textContent || '').trim();
        if (text) current!.items.push(text);
      });
    }
  });

  return sections.filter((s) => s.items.length > 0);
}

export default function Imprescindibles({ html }: { html: string }) {
  const sections = useMemo(() => parseSections(html), [html]);
  const [openSections, setOpenSections] = useState<Set<number>>(() => new Set([0]));
  const [expandedItems, setExpandedItems] = useState<Set<number>>(() => new Set());

  if (sections.length === 0) {
    return (
      <div
        className="prose-premium text-[var(--color-primary)]/85 text-base sm:text-lg leading-relaxed"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  const toggleSection = (i: number) =>
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  const toggleItems = (i: number) =>
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <div className="space-y-2">
      {sections.map((section, i) => {
        const isOpen = openSections.has(i);
        const showAll = expandedItems.has(i);
        const items = showAll ? section.items : section.items.slice(0, ITEMS_PREVIEW);
        const hidden = section.items.length - ITEMS_PREVIEW;
        const num = String(i + 1).padStart(2, '0');

        return (
          <div
            key={i}
            className="border-b border-[var(--color-border-strong)] last:border-b-0"
          >
            <button
              type="button"
              onClick={() => toggleSection(i)}
              aria-expanded={isOpen}
              className="w-full flex items-center gap-4 py-4 text-left group"
            >
              <span className="font-mono text-sm text-[var(--color-teja)] shrink-0 w-7">{num}</span>
              <span className="flex-1 font-serif text-lg sm:text-xl font-medium text-[var(--color-primary)] tracking-tight group-hover:text-[var(--color-brand-dark)] transition-colors">
                {section.title || 'Apunte'}
              </span>
              <span className="field-label text-[var(--color-muted)] shrink-0">{section.items.length}</span>
              <ChevronDown
                className={`w-4 h-4 text-[var(--color-muted)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isOpen && (
              <div className="pb-5 pl-11 sm:pl-11">
                <ol className="space-y-2.5">
                  {items.map((item, k) => (
                    <li key={k} className="flex gap-3 text-[var(--color-primary)]/85 leading-relaxed">
                      <span className="font-mono text-xs text-[var(--color-muted)]/60 mt-1 shrink-0 w-4">
                        {k + 1}.
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ol>
                {hidden > 0 && (
                  <button
                    type="button"
                    onClick={() => toggleItems(i)}
                    className="mt-4 text-sm font-semibold text-[var(--color-brand-dark)] hover:underline"
                  >
                    {showAll ? 'Ver menos' : `Ver ${hidden} más`}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
