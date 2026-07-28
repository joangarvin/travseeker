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
        className="impresc__fallback prose-premium"
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
    <div className="impresc">
      {sections.map((section, i) => {
        const isOpen = openSections.has(i);
        const showAll = expandedItems.has(i);
        const items = showAll ? section.items : section.items.slice(0, ITEMS_PREVIEW);
        const hidden = section.items.length - ITEMS_PREVIEW;
        const num = String(i + 1).padStart(2, '0');

        return (
          <div key={i} className="impresc__section">
            <button
              type="button"
              onClick={() => toggleSection(i)}
              aria-expanded={isOpen}
              className="impresc__toggle"
            >
              <span className="impresc__num">{num}</span>
              <span className="impresc__heading">
                {section.title || 'Apunte'}
              </span>
              <span className="impresc__count field-label">{section.items.length}</span>
              <ChevronDown className={`impresc__chevron ${isOpen ? 'is-open' : ''}`} />
            </button>

            {isOpen && (
              <div className="impresc__panel">
                <ol className="impresc__list">
                  {items.map((item, k) => (
                    <li key={k} className="impresc__item">
                      <span className="impresc__item-num">
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
                    className="impresc__more"
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
