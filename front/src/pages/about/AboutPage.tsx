import { Link } from 'react-router-dom';
import { ArrowRight, Eye, HandHeart, Scale, Search } from 'lucide-react';
import { Shell } from '../../components/layout';

export default function AboutPage() {
  return (
    <Shell>
      <section className="about-hero">
        <p className="kicker">El proyecto</p>
        <h1>Viajar mejor no significa viajar más.</h1>
        <p>
          TravSeeker nació para resolver una pregunta sencilla: ¿merece la pena ir a este lugar,
          para mí, ahora?
        </p>
      </section>
      <section className="about-manifesto">
        <p>No vendemos paquetes.</p>
        <p>No ordenamos destinos por quién paga.</p>
        <p>No fingimos que agosto y noviembre son el mismo viaje.</p>
        <strong>Buscamos información útil para que decidas tú.</strong>
      </section>
      <section className="about-values">
        <header>
          <p className="kicker">Cómo trabajamos</p>
          <h2>Cuatro compromisos</h2>
        </header>
        <div>
          {[
            [Search, 'Buscamos', 'Revisamos destinos, municipios y conexiones.'],
            [Eye, 'Mostramos', 'Presupuesto y afluencia sin esconder los matices.'],
            [Scale, 'Comparamos', 'Cada temporada cambia la experiencia y la contamos.'],
            [
              HandHeart,
              'Cuidamos',
              'El destino y a quien lo visita: menos ruido, mejores decisiones.',
            ],
          ].map(([Icon, title, text]: any, index) => (
            <article key={title}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <Icon />
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="about-cta">
        <h2>Encuentra un lugar que encaje contigo.</h2>
        <Link className="button button--sun" to="/">
          Empezar a descubrir <ArrowRight />
        </Link>
      </section>
    </Shell>
  );
}
