import ScrollReveal from '../ui/ScrollReveal';

const STEPS = [
  {
    title: 'Acota',
    text: 'Dinos presupuesto y cuánta gente soportas alrededor.',
  },
  {
    title: 'Compara',
    text: 'Pon dos o tres destinos frente a frente, con datos y sin humo.',
  },
  {
    title: 'Guarda',
    text: 'Favoritos y colecciones, listos para el grupo del viaje.',
  },
];

/* Escalones de la escalera diagonal (solo en pantallas medianas o más) */
const INDENTS = ['md:ml-0', 'md:ml-[88px]', 'md:ml-[176px]'];

export default function HowItWorks() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-16 sm:py-24">
      <ScrollReveal>
        <div className="mb-10 sm:mb-14 max-w-xl">
          <span className="field-label text-[var(--color-teja)] mb-3 block">Sin magia</span>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium text-[var(--color-primary)] tracking-tight">
            Sin magia. Método.
          </h2>
        </div>
      </ScrollReveal>

      <div className="relative max-w-3xl">
        {/* Ruta punteada que une los pasos, como trazo en un mapa */}
        <svg
          aria-hidden
          className="hidden md:block absolute left-10 top-14 h-[calc(100%-56px)] w-[240px] pointer-events-none"
          viewBox="0 0 240 260"
          preserveAspectRatio="none"
          fill="none"
        >
          <path
            d="M20 10C10 90 80 100 108 130s16 90 96 116"
            stroke="var(--color-teja)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="1 10"
          />
        </svg>

        <div className="flex flex-col gap-10 sm:gap-12">
          {STEPS.map(({ title, text }, i) => (
            <ScrollReveal key={title} delay={(i + 1) as 1 | 2 | 3} className={INDENTS[i]}>
              <div className="flex items-center gap-5 sm:gap-7">
                <span
                  className={`font-mono leading-none text-6xl sm:text-[80px] select-none ${
                    i === 2 ? 'text-[var(--color-brand)]' : 'text-[var(--color-primary)]/30'
                  }`}
                >
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-serif text-xl sm:text-2xl font-medium text-[var(--color-primary)] mb-1">
                    {title}
                  </h3>
                  <p className="text-[var(--color-muted)] text-sm sm:text-base leading-relaxed max-w-sm">
                    {text}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
