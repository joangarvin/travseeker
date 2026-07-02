import { useMemo, useState } from 'react';
import {
  ChevronDown,
  Landmark,
  Leaf,
  Footprints,
  Home,
  UtensilsCrossed,
  Waves,
  Sparkles,
  MapPin,
} from 'lucide-react';

interface Section {
  title: string;
  items: string[];
}

const ITEMS_PREVIEW = 5;

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

function iconFor(title: string) {
  const t = title.toLowerCase();
  if (/(gastron|vino|enotur|product|jamón|jamon)/.test(t)) return UtensilsCrossed;
  if (/(playa|mar\b|sol y|costa|náut|nautic)/.test(t)) return Waves;
  if (/(natur|paisaj|laguna|parque|montañ|\bmont|protegid|aire libre)/.test(t)) return Leaf;
  if (/(sender|activ|ruta|btt|aventur|bici)/.test(t)) return Footprints;
  if (/(pueblo|urban|vida local|encanto)/.test(t)) return Home;
  if (/(cultur|patrimon|histó|histor|relig|artíst|artist|museo)/.test(t)) return Landmark;
  if (/(experien|especial|astro|singular)/.test(t)) return Sparkles;
  return MapPin;
}

export default function Imprescindibles({ html }: { html: string }) {
  const sections = useMemo(() => parseSections(html), [html]);
  const [openSections, setOpenSections] = useState<Set<number>>(() => new Set([0]));
  const [expandedItems, setExpandedItems] = useState<Set<number>>(() => new Set());

  if (sections.length === 0) {
    return (
      <div
        className="prose-premium text-[var(--color-primary)]/80"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  const toggleSection = (i: number) =>
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(i)) {
        next.delete(i);
      } else {
        next.add(i);
      }
      return next;
    });

  const toggleItems = (i: number) =>
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(i)) {
        next.delete(i);
      } else {
        next.add(i);
      }
      return next;
    });

  return (
    <div className="space-y-3">
      {sections.map((section, i) => {
        const Icon = iconFor(section.title);
        const isOpen = openSections.has(i);
        const showAll = expandedItems.has(i);
        const items = showAll ? section.items : section.items.slice(0, ITEMS_PREVIEW);
        const hidden = section.items.length - ITEMS_PREVIEW;

        return (
          <div
            key={i}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] overflow-hidden transition-colors"
          >
            <button
              type="button"
              onClick={() => toggleSection(i)}
              aria-expanded={isOpen}
              className="w-full flex items-center gap-3.5 px-5 py-4 text-left hover:bg-[var(--color-border)]/40 transition-colors"
            >
              <span className="w-9 h-9 rounded-lg bg-[var(--color-brand)]/12 text-[var(--color-brand-dark)] flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5" />
              </span>
              <span className="flex-1 font-semibold text-[var(--color-primary)]">
                {section.title || 'Imprescindibles'}
              </span>
              <span className="text-xs text-[var(--color-muted)] tabular-nums bg-[var(--color-border)]/60 px-2 py-0.5 rounded-full">
                {section.items.length}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-[var(--color-muted)] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isOpen && (
              <div className="px-5 pb-5 pt-1 animate-fade-up">
                <ul className="space-y-2.5">
                  {items.map((item, k) => (
                    <li key={k} className="flex gap-3 text-[var(--color-primary)]/85 leading-relaxed">
                      <span className="mt-[0.55rem] w-1.5 h-1.5 rounded-full bg-[var(--color-brand)] shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                {hidden > 0 && (
                  <button
                    type="button"
                    onClick={() => toggleItems(i)}
                    className="mt-3.5 text-sm font-semibold text-[var(--color-brand-dark)] hover:underline"
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
