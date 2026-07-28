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
    <svg viewBox="0 0 32 32" {...STROKE}>
      <path d="M5 26h22M7 26v-3m5 3v-3m8 3v-3m5 3v-3M5 22.5h22M16 5.5 5.5 12h21L16 5.5Z" />
      <path d="M8.5 12v10.5m5-10.5v10.5m5-10.5v10.5m5-10.5v10.5" />
    </svg>
  ),
  Naturaleza: (
    <svg viewBox="0 0 32 32" {...STROKE}>
      <path d="M16 27v-9m0 0c-5.5 0-8-3.8-8-8.5 0-2 .4-3.6 1-5 3 .8 7 3.4 7 9.5Zm0 0c4.5-.5 7.5-3 7.5-7 0-1.5-.3-2.6-.8-3.7-2.6.8-6.2 3-6.7 8.2" />
      <path d="M9 27h14" />
    </svg>
  ),
  'Sol y playa': (
    <svg viewBox="0 0 32 32" {...STROKE}>
      <circle cx="16" cy="13" r="4.5" />
      <path d="M16 3.5v2.6m6.7.2-1.8 1.8m4.6 4.9h-2.6m-13.8 0H6.5m4.6-6.7L9.3 6.3" />
      <path d="M4 24.5c2-1.6 4-1.6 6 0s4 1.6 6 0 4-1.6 6-0 4 1.6 6 0" />
    </svg>
  ),
  Rural: (
    <svg viewBox="0 0 32 32" {...STROKE}>
      <path d="M6 26V15L16 7l10 8v11" />
      <path d="M6 26h20M13 26v-6.5a3 3 0 0 1 6 0V26" />
      <path d="M3.5 16.5 16 6.5l12.5 10" />
    </svg>
  ),
  Montaña: (
    <svg viewBox="0 0 32 32" {...STROKE}>
      <path d="M3 26 12 9l5.5 10L21 13l8 13H3Z" />
      <path d="m9.5 14 2.5-2.2 2.3 2.6" />
    </svg>
  ),
  Patrimonial: (
    <svg viewBox="0 0 32 32" {...STROKE}>
      <path d="M7 26V12h4v2h4v-2h2v2h4v-2h4v14" />
      <path d="M5 26h22M13 26v-5a3 3 0 0 1 6 0v5M7 12V8.5m18 3.5V8.5M11 12V6.5m10 5.5V6.5m-5 5.5V5" />
    </svg>
  ),
};

const STYLES = [
  { value: 'Cultural', label: 'Cultural', desc: 'Museos y piedras con historia', offsetClass: 'home-travel__item--offset-0', tilt: '-1deg' },
  { value: 'Naturaleza', label: 'Naturaleza', desc: 'Sendero, bosque y silencio', offsetClass: 'home-travel__item--offset-1', tilt: '0.9deg' },
  { value: 'Sol y playa', label: 'Sol y playa', desc: 'Toalla, sal y siesta', offsetClass: 'home-travel__item--offset-2', tilt: '-0.7deg' },
  { value: 'Rural', label: 'Rural', desc: 'Pueblos donde te saludan', offsetClass: 'home-travel__item--offset-3', tilt: '0.8deg' },
  { value: 'Montaña', label: 'Montaña', desc: 'Cuestas que valen la pena', offsetClass: 'home-travel__item--offset-4', tilt: '-1.1deg' },
  { value: 'Patrimonial', label: 'Patrimonial', desc: 'Lo que protege la UNESCO', offsetClass: 'home-travel__item--offset-5', tilt: '0.6deg' },
] as const;

export default function TravelStyles({ onSelect }: Props) {
  const [active, setActive] = useState<string | null>(null);

  const handleSelect = (value: string) => {
    setActive(value);
    onSelect(value);
    document.getElementById('destinos')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className="home-travel">
      <ScrollReveal>
        <div className="home-travel__header">
          <span className="home-travel__eyebrow field-label">El humor del viaje</span>
          <h2 className="home-travel__title">
            ¿Qué plan te pide el cuerpo?
          </h2>
          <p className="home-travel__copy">
            No es lo mismo buscar siesta que buscar sendero. Elige el plan y afinamos la lista.
          </p>
        </div>
      </ScrollReveal>

      <div className="home-travel__grid">
        {STYLES.map(({ value, label, desc, offsetClass, tilt }, i) => {
          const isActive = active === value;
          return (
            <ScrollReveal key={value} delay={((i % 3) + 1) as 1 | 2 | 3} className={offsetClass}>
              <button
                type="button"
                onClick={() => handleSelect(value)}
                className={`home-style-btn ficha-tilt touch-target ${isActive ? 'is-active' : ''}`}
                style={{
                  '--tilt': tilt,
                  boxShadow: 'var(--shadow-card)',
                } as CSSProperties}
              >
                <span className="home-style-btn__icon">
                  {ICONS[value]}
                </span>
                <span className="home-style-btn__label">{label}</span>
                <span className="home-style-btn__desc">
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
