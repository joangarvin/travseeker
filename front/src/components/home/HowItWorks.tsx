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

const INDENT_CLASS = ['home-step__indent-0', 'home-step__indent-1', 'home-step__indent-2'];

export default function HowItWorks() {
  return (
    <section className="home-steps">
      <ScrollReveal>
        <div className="home-steps__header">
          <span className="home-steps__eyebrow field-label">Sin magia</span>
          <h2 className="home-steps__title">
            Sin magia. Método.
          </h2>
        </div>
      </ScrollReveal>

      <div className="home-steps__track">
        <svg
          aria-hidden
          className="home-steps__svg"
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

        <div className="home-steps__list">
          {STEPS.map(({ title, text }, i) => (
            <ScrollReveal key={title} delay={(i + 1) as 1 | 2 | 3} className={INDENT_CLASS[i]}>
              <div className="home-step">
                <span className={`home-step__num ${i === 2 ? 'is-accent' : ''}`}>
                  {i + 1}
                </span>
                <div>
                  <h3 className="home-step__title">
                    {title}
                  </h3>
                  <p className="home-step__text">
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
