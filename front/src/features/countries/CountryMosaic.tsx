import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Globe2 } from 'lucide-react';
import { MediaImage } from '../../components/ui';
import { api } from '../../services/api';
import { imageUrl } from '../../utils';
import { t } from '../../i18n';
import type { CountrySummary } from './types';
export function CountryMosaic() {
  const [countries, setCountries] = useState<CountrySummary[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    api<CountrySummary[]>('/paises', { signal: controller.signal })
      .then((value) => {
        if (!controller.signal.aborted) setCountries(value);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);
  if (!countries.length) return null;
  return (
    <section className="country-mosaic" id="countries" aria-labelledby="country-mosaic-title">
      <header>
        <div>
          <p className="kicker">{t('Otra forma de explorar')}</p>
          <h2 id="country-mosaic-title">{t('¿Prefieres empezar por un país?')}</h2>
        </div>
        <p>{t('Encuentra sus destinos, regiones y planes.')}</p>
      </header>
      <div className="country-mosaic__grid">
        {countries.map((c) =>
          c.status === 'public' ? (
            <Link
              className={`country-mosaic__card ${!c.image ? 'country-mosaic__card--plain' : ''}`}
              to={`/pais/${c.code.toLowerCase()}`}
              key={c.code}
            >
              {c.image && (
                <MediaImage
                  src={imageUrl(c.image)}
                  alt=""
                  loading="lazy"
                  sizes={countries.length === 1 ? '100vw' : '(max-width: 700px) 100vw, 50vw'}
                />
              )}
              <div>
                <span>{t('{0} destinos', { 0: c.destinationCount || 0 })}</span>
                <h3>
                  {c.name}
                  <ArrowUpRight aria-hidden />
                </h3>
                <span>{t('Explorar el país')}</span>
              </div>
            </Link>
          ) : (
            <article className="country-mosaic__card country-mosaic__card--plain" key={c.code}>
              <Globe2 className="country-mosaic__globe" aria-hidden />
              <div>
                <span className="country-mosaic__status">{t('Próximamente')}</span>
                <h3>{c.name}</h3>
                <p>{t('Estamos preparando su guía.')}</p>
              </div>
            </article>
          ),
        )}
      </div>
    </section>
  );
}
