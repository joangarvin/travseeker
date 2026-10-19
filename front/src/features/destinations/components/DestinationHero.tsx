import { intlLocale, t } from '../../../i18n';
import { useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowLeft, Expand, MapPin, Star } from 'lucide-react';
import { Dialog, MediaImage } from '../../../components/ui';
import { useTourismTypes } from '../../../contexts';
import type { Destino } from '../../../types';
import { imageUrl, plain } from '../../../utils';
import { tourismColorStyle, tourismDefinition, tourismValues } from '../../tourism/tourism';
import { LEVEL_STEPS, destinationSignals } from '../destinationSignals';

type DestinationHeroProps = {
  destination: Destino;
  rating?: { average: number; count: number };
  onBack: () => void;
  actions: ReactNode;
};

function LevelDots({ level }: { level: number | null }) {
  if (!level) return null;
  return (
    <span className="dest-hero__dots" aria-hidden="true">
      {Array.from({ length: LEVEL_STEPS }, (_, index) => (
        <i key={index} className={index < level ? 'is-on' : undefined} />
      ))}
    </span>
  );
}

export function DestinationHero({ destination, rating, onBack, actions }: DestinationHeroProps) {
  const [photoOpen, setPhotoOpen] = useState(false);
  const { tourismTypes: catalog } = useTourismTypes();
  const name = destination.nombre.trim();
  const signals = destinationSignals(destination);
  const types = tourismValues(destination.tipoTurismoPrincipal).map((value) =>
    tourismDefinition(value, catalog),
  );
  const budget = plain(destination.presupuesto);
  const crowd = plain(destination.masificacion);
  const titleSize = name.length > 34 ? ' is-title-xl' : name.length > 20 ? ' is-title-long' : '';

  return (
    <>
      <header className="dest-hero">
        <div className="dest-hero__shade" aria-hidden="true" />

        <div className="dest-hero__topline">
          <button type="button" className="dest-hero__back" onClick={onBack}>
            <ArrowLeft aria-hidden="true" /> {t('Volver a descubrir')}
          </button>
          <nav aria-label={t('Migas de pan')}>
            <Link to="/">{t('Descubrir')}</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{name}</span>
          </nav>
        </div>

        <figure className="dest-hero__media">
          <MediaImage
            className="dest-hero__image"
            src={imageUrl(destination.imagen)}
            alt={t('Vista principal de {0}', { 0: name })}
            fetchPriority="high"
            loading="eager"
            sizes="100vw"
            width={1920}
            height={1080}
          />
          <button
            type="button"
            className="dest-hero__photo-open"
            onClick={() => setPhotoOpen(true)}
            aria-haspopup="dialog"
          >
            <Expand aria-hidden="true" /> {t('Ver foto completa')}
          </button>
        </figure>

        <div className="dest-hero__layout">
          <div className={`dest-hero__intro${titleSize}`}>
            <p className="dest-hero__location">
              <MapPin aria-hidden="true" /> {t(plain(destination.ubicacion)) || t('España')}
            </p>
            <h1>{name}</h1>

            {(!!types.length || rating) && (
              <div className="dest-hero__marks">
                {types.map((type) => (
                  <span
                    className="dest-hero__type"
                    style={tourismColorStyle(type.colorValue)}
                    key={type.label}
                  >
                    <type.Icon aria-hidden="true" />
                    {type.displayLabel || t(type.label)}
                  </span>
                ))}
                {rating && (
                  <a className="dest-hero__rating" href="#opiniones">
                    <Star aria-hidden="true" />
                    {rating.average.toLocaleString(intlLocale, { maximumFractionDigits: 1 })}
                    <span>
                      · {rating.count} {rating.count === 1 ? t('opinión') : t('opiniones')}
                    </span>
                  </a>
                )}
              </div>
            )}

            <nav className="dest-hero__jump" aria-label={t('Ir a una sección')}>
              {signals.hasEssentials && (
                <a className="cover-action" href="#imprescindibles">
                  <span>
                    {signals.essentials
                      ? t('{0} imprescindibles', { 0: signals.essentials })
                      : t('Imprescindibles')}
                  </span>
                  <ArrowDown aria-hidden="true" />
                </a>
              )}
              {!!signals.bases && (
                <a className="cover-action" href="#bases">
                  <span>
                    {signals.fromPrice
                      ? t('{0} bases desde {1} €', { 0: signals.bases, 1: signals.fromPrice })
                      : signals.bases === 1
                        ? t('1 base')
                        : t('{0} bases', { 0: signals.bases })}
                  </span>
                  <ArrowDown aria-hidden="true" />
                </a>
              )}
              <a className="cover-action" href="#cuando-ir">
                <span>{t('Clima y afluencia')}</span>
                <ArrowDown aria-hidden="true" />
              </a>
            </nav>
          </div>

          <aside className="dest-hero__card" aria-label={t('Datos clave para decidir')}>
            <dl className="dest-hero__facts">
              <div>
                <dt>{t('Presupuesto')}</dt>
                <dd>
                  <LevelDots level={signals.budgetLevel} />
                  {budget ? t(budget) : t('Sin estimación')}
                </dd>
              </div>
              <div>
                <dt>{t('Afluencia')}</dt>
                <dd>
                  <LevelDots level={signals.crowdLevel} />
                  {crowd ? t(crowd) : t('Sin estimación')}
                </dd>
              </div>
            </dl>

            {!!signals.seasons.length && (
              <div className="dest-hero__seasons">
                <p>{t('Gente según la época')}</p>
                <ul>
                  {signals.seasons.map((season) => (
                    <li key={season.label} data-level={season.level}>
                      <span>{season.label}</span>
                      <span className="dest-hero__bar" aria-hidden="true">
                        <b style={{ inlineSize: `${season.value}%` }} />
                      </span>
                      <span>
                        {season.value}%<span className="sr-only"> · {t(season.level)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="dest-hero__actions">{actions}</div>
          </aside>
        </div>
      </header>
      {photoOpen &&
        createPortal(
          <Dialog
            title={name}
            description={t('Fotografía principal del destino · Imagen completa, sin recorte')}
            className="destination-photo-viewer"
            onClose={() => setPhotoOpen(false)}
          >
            <MediaImage
              src={imageUrl(destination.imagen)}
              alt={t('Vista principal de {0}', { 0: name })}
              loading="eager"
              sizes="100vw"
            />
          </Dialog>,
          document.body,
        )}
    </>
  );
}
