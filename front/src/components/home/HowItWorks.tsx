import { Search, SlidersHorizontal, Heart } from 'lucide-react';
import ScrollReveal from '../ui/ScrollReveal';

const STEPS = [
  {
    icon: Search,
    title: 'Explora',
    text: 'Busca entre destinos curados por todo el territorio, sin trampas ni patrocinios.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Filtra',
    text: 'Ajusta por presupuesto, masificación y tipo de turismo hasta dar con tu sitio ideal.',
  },
  {
    icon: Heart,
    title: 'Guarda',
    text: 'Añade tus destinos favoritos y crea tu propia lista para tu próxima aventura.',
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-[var(--color-surface)] border-y border-[var(--color-border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-16 sm:py-24">
        <ScrollReveal>
          <div className="text-center mb-10 sm:mb-16">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-brand-dark)] mb-3 block">
              Así funciona
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-[var(--color-primary)] tracking-tight">
              Tu viaje en tres pasos
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-px bg-[var(--color-border-strong)] border border-[var(--color-border-strong)] rounded-xl overflow-hidden shadow-sm">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <div key={title} className="bg-[var(--color-surface)] flex flex-col items-start relative group hover:bg-[var(--color-surface-2)] transition-colors">
              <ScrollReveal delay={(i + 1) as 1 | 2 | 3} className="w-full h-full p-8 md:p-10 flex flex-col">
                <span className="absolute top-8 right-8 text-[var(--color-muted)] font-mono text-sm font-medium tracking-wider opacity-40">0{i + 1}</span>
                <span className="w-12 h-12 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-primary)] mb-6 shadow-sm group-hover:border-[var(--color-primary-light)]/30 transition-colors">
                  <Icon className="w-5 h-5" />
                </span>
                <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-2 tracking-tight">{title}</h3>
                <p className="text-[var(--color-muted)] text-sm leading-relaxed">{text}</p>
              </ScrollReveal>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
