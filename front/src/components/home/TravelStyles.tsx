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
    <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-16 sm:pt-24 pb-4">
      <ScrollReveal>
        <div className="text-center mb-8 sm:mb-12">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-brand-dark)] mb-3 block">
            Inspírate
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-[var(--color-primary)] tracking-tight mb-3 sm:mb-4">
            ¿Qué tipo de viaje buscas?
          </h2>
          <p className="text-[var(--color-muted)] text-base sm:text-lg max-w-2xl mx-auto font-light px-2">
            Elige un estilo y te mostramos los destinos que mejor encajan.
          </p>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-[var(--color-border-strong)] border border-[var(--color-border-strong)] rounded-xl overflow-hidden shadow-sm">
        {STYLES.map(({ value, label, icon: Icon, desc }, i) => (
          <div key={value} className="bg-[var(--color-surface)] group hover:bg-[var(--color-surface-2)] transition-colors">
            <ScrollReveal delay={(i % 3 + 1) as 1 | 2 | 3} className="h-full">
              <button
                type="button"
                onClick={() => onSelect(value)}
                className="w-full h-full flex flex-col items-center justify-center text-center gap-2 sm:gap-3 p-5 sm:p-6 outline-none"
              >
                <span className="w-10 h-10 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-primary)] group-hover:border-[var(--color-primary-light)]/30 group-hover:text-[var(--color-brand)] transition-colors">
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </span>
                <span className="text-xs sm:text-sm font-semibold text-[var(--color-primary)] tracking-tight">{label}</span>
                <span className="text-xs text-[var(--color-muted)] leading-snug hidden sm:block opacity-80">{desc}</span>
              </button>
            </ScrollReveal>
          </div>
        ))}
      </div>
    </section>
  );
}
