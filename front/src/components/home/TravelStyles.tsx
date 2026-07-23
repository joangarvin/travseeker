import { useState } from 'react';
import type { CSSProperties } from 'react';
import ScrollReveal from '../ui/ScrollReveal';

interface Props {
  onSelect: (tipoTurismo: string) => void;
}

const STROKE = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const ICONS: Record<string, React.ReactNode> = {
  Cultural: (
    <svg viewBox="0 0 32 32" className="w-7 h-7" {...STROKE}>
      <path d="M5 26h22M7 26v-3m5 3v-3m8 3v-3m5 3v-3M5 22.5h22M16 5.5 5.5 12h21L16 5.5Z" />
      <path d="M8.5 12v10.5m5-10.5v10.5m5-10.5v10.5m5-10.5v10.5" />
    </svg>
  ),
  Naturaleza: (
    <svg viewBox="0 0 32 32" className="w-7 h-7" {...STROKE}>
      <path d="M16 27v-9m0 0c-5.5 0-8-3.8-8-8.5 0-2 .4-3.6 1-5 3 .8 7 3.4 7 9.5Zm0 0c4.5-.5 7.5-3 7.5-7 0-1.5-.3-2.6-.8-3.7-2.6.8-6.2 3-6.7 8.2" />
      <path d="M9 27h14" />
    </svg>
  ),
  'Sol y playa': (
    <svg viewBox="0 0 32 32" className="w-7 h-7" {...STROKE}>
      <circle cx="16" cy="13" r="4.5" />
      <path d="M16 3.5v2.6m6.7.2-1.8 1.8m4.6 4.9h-2.6m-13.8 0H6.5m4.6-6.7L9.3 6.3" />
      <path d="M4 24.5c2-1.6 4-1.6 6 0s4 1.6 6 0 4-1.6 6-0 4 1.6 6 0" />
    </svg>
  ),
  Rural: (
    <svg viewBox="0 0 32 32" className="w-7 h-7" {...STROKE}>
      <path d="M6 26V15L16 7l10 8v11" />
      <path d="M6 26h20M13 26v-6.5a3 3 0 0 1 6 0V26" />
      <path d="M3.5 16.5 16 6.5l12.5 10" />
    </svg>
  ),
  Montaña: (
    <svg viewBox="0 0 32 32" className="w-7 h-7" {...STROKE}>
      <path d="M3 26 12 9l5.5 10L21 13l8 13H3Z" />
      <path d="m9.5 14 2.5-2.2 2.3 2.6" />
    </svg>
  ),
  Patrimonial: (
    <svg viewBox="0 0 32 32" className="w-7 h-7" {...STROKE}>
      <path d="M7 26V12h4v2h4v-2h2v2h4v-2h4v14" />
      <path d="M5 26h22M13 26v-5a3 3 0 0 1 6 0v5M7 12V8.5m18 3.5V8.5M11 12V6.5m10 5.5V6.5m-5 5.5V5" />
    </svg>
  ),
};

const STYLES = [
  { value: 'Cultural', label: 'Cultural', desc: 'Museos y piedras con historia', offset: 'mt-0 md:mt-0', tilt: '-1deg' },
  { value: 'Naturaleza', label: 'Naturaleza', desc: 'Sendero, bosque y silencio', offset: 'mt-2 md:mt-4', tilt: '0.9deg' },
  { value: 'Sol y playa', label: 'Sol y playa', desc: 'Toalla, sal y siesta', offset: 'mt-0 md:mt-1.5', tilt: '-0.7deg' },
  { value: 'Rural', label: 'Rural', desc: 'Pueblos donde te saludan', offset: 'mt-2 md:mt-6', tilt: '0.8deg' },
  { value: 'Montaña', label: 'Montaña', desc: 'Cuestas que valen la pena', offset: 'mt-0 md:mt-0.5', tilt: '-1.1deg' },
  { value: 'Patrimonial', label: 'Patrimonial', desc: 'Lo que protege la UNESCO', offset: 'mt-2 md:mt-3.5', tilt: '0.6deg' },
] as const;

export default function TravelStyles({ onSelect }: Props) {
  const [active, setActive] = useState<string | null>(null);

  const handleSelect = (value: string) => {
    setActive(value);
    onSelect(value);
    document.getElementById('destinos')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-12 sm:pt-20 pb-4">
      <ScrollReveal>
        <div className="mb-8 sm:mb-10 max-w-xl">
          <span className="field-label text-[var(--color-teja)] mb-3 block">El humor del viaje</span>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium text-[var(--color-primary)] tracking-tight mb-3">
            ¿Qué plan te pide el cuerpo?
          </h2>
          <p className="text-[var(--color-muted)] text-base sm:text-lg">
            No es lo mismo buscar siesta que buscar sendero. Elige el plan y afinamos la lista.
          </p>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-3.5 items-start">
        {STYLES.map(({ value, label, desc, offset, tilt }, i) => {
          const isActive = active === value;
          return (
            <ScrollReveal key={value} delay={((i % 3) + 1) as 1 | 2 | 3} className={offset}>
              <button
                type="button"
                onClick={() => handleSelect(value)}
                className={`ficha-tilt w-full flex flex-col items-start text-left gap-2 p-4 sm:p-5 rounded-lg border transition-colors duration-150 touch-target ${
                  isActive
                    ? 'bg-[var(--color-brand)] border-[var(--color-brand)] text-[var(--color-on-brand)]'
                    : 'bg-[var(--color-surface)] border-[var(--color-border-strong)] text-[var(--color-primary)] hover:border-[var(--color-primary-light)]'
                }`}
                style={{
                  '--tilt': tilt,
                  boxShadow: isActive ? 'var(--shadow-card)' : 'var(--shadow-card)',
                } as CSSProperties}
              >
                <span className={isActive ? 'text-[var(--color-on-brand)]' : 'text-[var(--color-brand-dark)]'}>
                  {ICONS[value]}
                </span>
                <span className="text-sm font-semibold tracking-tight">{label}</span>
                <span className={`text-xs leading-snug ${isActive ? 'text-[var(--color-on-brand)]/75' : 'text-[var(--color-muted)]'}`}>
                  {desc}
                </span>
              </button>
            </ScrollReveal>
          );
        })}
      </div>
    </section>
  );
}
