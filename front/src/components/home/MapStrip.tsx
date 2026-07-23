import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import ScrollReveal from '../ui/ScrollReveal';

function MapCutout() {
  return (
    <svg
      viewBox="0 0 560 320"
      className="w-full h-auto rounded-lg border border-[var(--color-mapa)]/40"
      style={{ background: 'color-mix(in srgb, var(--color-mapa) 14%, var(--color-surface))' }}
      aria-hidden
    >
      <path d="M186 0v320M373 0v320" stroke="var(--color-mapa)" strokeOpacity="0.22" strokeWidth="1.5" />
      <path
        d="M40 250c40-30 90-18 120-46s10-60 56-70 84 14 120 -6 40-48 90-50"
        fill="none"
        stroke="var(--color-mapa)"
        strokeOpacity="0.4"
        strokeWidth="1.5"
      />
      <path
        d="M20 120c50 10 80 42 130 36s70-40 120-34 90 46 150 30 90-42 120-40"
        fill="none"
        stroke="var(--color-mapa)"
        strokeOpacity="0.28"
        strokeWidth="1.5"
      />
      <path
        d="M80 260C150 220 170 140 250 150s130 60 190-30"
        fill="none"
        stroke="var(--color-teja)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="1 9"
      />
      {[
        [80, 260],
        [190, 172],
        [250, 150],
        [352, 186],
        [440, 120],
      ].map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r="8" fill="var(--color-brand)" />
          <circle cx={cx} cy={cy} r="2.5" fill="var(--color-on-brand)" />
        </g>
      ))}
      <g stroke="var(--color-mapa)" strokeWidth="1.5" strokeLinecap="round" opacity="0.65">
        <circle cx="500" cy="262" r="18" fill="none" />
        <path d="M500 248v28M486 262h28" />
      </g>
    </svg>
  );
}

export default function MapStrip() {
  return (
    <section className="bg-[var(--color-surface-2)] border-y border-[var(--color-border)] mt-14 sm:mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-12 sm:py-16 grid lg:grid-cols-12 gap-8 lg:gap-10 items-center">
        <div className="lg:col-span-4">
          <ScrollReveal>
            <span className="field-label text-[var(--color-teja)] mb-3 block">Cartografía</span>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium text-[var(--color-primary)] tracking-tight mb-4">
              El mapa manda.
            </h2>
            <p className="text-[var(--color-muted)] text-base sm:text-lg leading-relaxed max-w-[26ch] mb-6">
              A veces no sabes el nombre del sitio, pero sabes la zona. Abre el mapa y deja que el
              dedo decida.
            </p>
            <Link
              to="/mapa"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[var(--color-brand)] text-[var(--color-on-brand)] font-semibold text-sm hover:bg-[var(--color-accent-hover)] transition-colors duration-150"
            >
              Abrir el mapa
            </Link>
          </ScrollReveal>
        </div>

        <div className="lg:col-span-8">
          <ScrollReveal delay={1}>
            <div
              className="ficha-tilt lg:translate-x-3"
              style={{ '--tilt': '0.8deg', boxShadow: 'var(--shadow-card)' } as CSSProperties}
            >
              <MapCutout />
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
