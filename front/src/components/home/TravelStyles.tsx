import { Landmark, Trees, Sun, Wheat, Mountain, Castle } from 'lucide-react';
import ScrollReveal from '../ui/ScrollReveal';

interface Props {
  onSelect: (tipoTurismo: string) => void;
}

const STYLES = [
  { value: 'Cultural', label: 'Cultural', icon: Landmark, desc: 'Museos, arte e historia' },
  { value: 'Naturaleza', label: 'Naturaleza', icon: Trees, desc: 'Paisajes y vida salvaje' },
  { value: 'Sol y playa', label: 'Sol y playa', icon: Sun, desc: 'Costa y descanso' },
  { value: 'Rural', label: 'Rural', icon: Wheat, desc: 'Pueblos con encanto' },
  { value: 'Montaña', label: 'Montaña', icon: Mountain, desc: 'Aventura en altura' },
  { value: 'Patrimonial', label: 'Patrimonial', icon: Castle, desc: 'Joyas Patrimonio' },
] as const;

export default function TravelStyles({ onSelect }: Props) {
  return (
    <section className="max-w-7xl mx-auto px-6 md:px-8 pt-24 pb-4">
      <ScrollReveal>
        <div className="text-center mb-12">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-brand-dark)] mb-3 block">
            Inspírate
          </span>
          <h2 className="text-4xl md:text-5xl font-semibold text-[var(--color-primary)] tracking-tight mb-4">
            ¿Qué tipo de viaje buscas?
          </h2>
          <p className="text-[var(--color-muted)] text-lg max-w-2xl mx-auto font-light">
            Elige un estilo y te mostramos los destinos que mejor encajan.
          </p>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {STYLES.map(({ value, label, icon: Icon, desc }, i) => (
          <ScrollReveal key={value} delay={(i % 3 + 1) as 1 | 2 | 3}>
            <button
              type="button"
              onClick={() => onSelect(value)}
              className="group w-full h-full flex flex-col items-center text-center gap-3 p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm hover:shadow-lg hover:border-[var(--color-brand)]/40 hover:-translate-y-1 transition-all duration-300"
            >
              <span className="w-14 h-14 rounded-2xl bg-[var(--color-secondary)] flex items-center justify-center text-[var(--color-brand-dark)] group-hover:bg-[var(--color-brand)] group-hover:text-[var(--color-on-brand)] transition-colors">
                <Icon className="w-6 h-6" />
              </span>
              <span className="text-sm font-semibold text-[var(--color-primary)]">{label}</span>
              <span className="text-xs text-[var(--color-muted)] leading-snug">{desc}</span>
            </button>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
