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
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-24">
        <ScrollReveal>
          <div className="text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-brand-dark)] mb-3 block">
              Así funciona
            </span>
            <h2 className="text-4xl md:text-5xl font-semibold text-[var(--color-primary)] tracking-tight">
              Tu viaje en tres pasos
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <ScrollReveal key={title} delay={(i + 1) as 1 | 2 | 3}>
              <div className="relative text-center px-6">
                <div className="relative inline-flex mb-6">
                  <span className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-brand-dark)] flex items-center justify-center text-[var(--color-on-brand)] shadow-lg">
                    <Icon className="w-7 h-7" />
                  </span>
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[var(--color-secondary)] border border-[var(--color-border-strong)] flex items-center justify-center text-xs font-bold text-[var(--color-primary)]">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-[var(--color-primary)] mb-2">{title}</h3>
                <p className="text-[var(--color-muted)] leading-relaxed max-w-xs mx-auto">{text}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
