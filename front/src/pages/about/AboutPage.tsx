import { t } from '../../i18n';
import { Link } from 'react-router-dom';
import { ArrowRight, Eye, HandHeart, Scale, Search } from 'lucide-react';
import { Shell } from '../../components/layout';

export default function AboutPage() {
  return (
    <Shell>
      <section className="about-hero">
        <p className="kicker">{t('El proyecto')}</p>
        <h1>{t('Viajar mejor no significa viajar más.')}</h1>
        <p>
          {t(
            'TravSeeker nació para resolver una pregunta sencilla: ¿merece la pena ir a este lugar, para mí, ahora?',
          )}
        </p>
      </section>
      <section className="about-manifesto" data-reveal>
        <p>{t('No vendemos paquetes.')}</p>
        <p>{t('No ordenamos destinos por quién paga.')}</p>
        <p>{t('No fingimos que agosto y noviembre son el mismo viaje.')}</p>
        <strong>{t('Buscamos información útil para que decidas tú.')}</strong>
      </section>
      <section className="about-values" data-reveal>
        <header>
          <p className="kicker">{t('Cómo trabajamos')}</p>
          <h2>{t('Cuatro compromisos')}</h2>
        </header>
        <div>
          {[
            [Search, t('Buscamos'), t('Revisamos destinos, municipios y conexiones.')],
            [Eye, t('Mostramos'), t('Presupuesto y afluencia sin esconder los matices.')],
            [Scale, t('Comparamos'), t('Cada temporada cambia la experiencia y la contamos.')],
            [
              HandHeart,
              t('Cuidamos'),
              t('El destino y a quien lo visita: menos ruido, mejores decisiones.'),
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
      <section className="about-cta" data-reveal>
        <h2>{t('Encuentra un lugar que encaje contigo.')}</h2>
        <Link className="button button--sun" to="/">
          {t('Empezar a descubrir')} <ArrowRight />
        </Link>
      </section>
    </Shell>
  );
}
