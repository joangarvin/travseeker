import { t } from '../../../i18n';
import type { CSSProperties } from 'react';
import { ArrowRight, ChevronDown, Map } from 'lucide-react';
import { useActivities } from '../../../contexts/ActivityContext';
import { MediaImage } from '../../../components/ui';
import type { Destino } from '../../../types';
import { plain, safeHtml } from '../../../utils';
import { activityDefinition, activityValues } from '../../activities/activities';
import { EssentialIconGlyph } from '../../essentials/essentialIcons';
import { destinationMix, destinationStory, mixHeadline } from '../destinationSignals';

const MIN_BAR_SHARE = 0.04;

type DestinationSummaryProps = {
  destination: Destino;
  mapUrl?: string | null;
  onExplore: (groupKeys: string[]) => void;
};

export function DestinationSummary({ destination, mapUrl, onExplore }: DestinationSummaryProps) {
  const { activities } = useActivities();
  const segments = destinationMix(destination.essentialGroups);
  const total = segments.reduce((sum, segment) => sum + segment.count, 0);
  const story = destinationStory(destination);
  const hasDescription = Boolean(plain(destination.descripcion));
  const extras = activityValues(destination.tipoTurismoSecundario).map((value) =>
    activityDefinition(value, activities),
  );

  return (
    <section id="resumen" className="dest-dna" aria-labelledby="summary-title" data-reveal>
      {destination.imagen && (
        <MediaImage
          className="dest-dna__image"
          src={destination.imagen}
          alt=""
          sizes="100vw"
          loading="lazy"
        />
      )}
      <div className="dest-dna__inner">
        <div className="dest-dna__top">
          <header>
            <p className="dest-dna__kicker">{t('¿Encaja contigo? · El ADN del destino')}</p>
            <h2 id="summary-title">{mixHeadline(segments, destination.nombre.trim())}</h2>
          </header>
          <div className="dest-dna__story">
            {story && <p>{story}</p>}
            {!hasDescription && (
              <p>
                {t(
                  'La descripción editorial todavía no está disponible. Usa las señales prácticas y el clima para decidir.',
                )}
              </p>
            )}
            <div className="dest-dna__links">
              {hasDescription && (
                <details className="dest-dna__more">
                  <summary>
                    {t('Leer la descripción completa')} <ChevronDown aria-hidden="true" />
                  </summary>
                  <div
                    className="prose"
                    dangerouslySetInnerHTML={{ __html: safeHtml(destination.descripcion) }}
                  />
                </details>
              )}
              {mapUrl && (
                <a href={mapUrl} target="_blank" rel="noreferrer">
                  <Map aria-hidden="true" /> {t('Situar el destino en el mapa')}
                </a>
              )}
            </div>
          </div>
        </div>

        {segments.length > 0 && (
          <>
            <div className="dest-dna__bar" aria-hidden="true">
              {segments.map((segment) => (
                <span
                  key={segment.key}
                  data-tone={segment.tone}
                  style={{ flexGrow: Math.max(segment.count, total * MIN_BAR_SHARE) }}
                />
              ))}
            </div>
            <ul
              className="dest-dna__mix"
              aria-label={t('De qué está hecho {0}', { 0: destination.nombre.trim() })}
              style={{ '--dna-columns': segments.length } as CSSProperties}
            >
              {segments.map((segment) => (
                <li key={segment.key} data-tone={segment.tone}>
                  <button type="button" onClick={() => onExplore(segment.groupKeys)}>
                    <strong>{segment.share}%</strong>
                    <span className="dest-dna__label">
                      <EssentialIconGlyph name={segment.icon} />
                      {segment.label}
                    </span>
                    {segment.examples.length > 0 && (
                      <span className="dest-dna__examples">{segment.examples.join(' · ')}</span>
                    )}
                    <span className="dest-dna__go">
                      {segment.count === 1
                        ? t('Ver 1 imprescindible')
                        : t('Ver {0} imprescindibles', { 0: segment.count })}
                      <ArrowRight aria-hidden="true" />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {extras.length > 0 && (
          <div className="dest-dna__extras">
            <p>{t('Además, encaja con')}</p>
            <ul>
              {extras.map((activity) => (
                <li key={activity.label}>
                  <activity.Icon aria-hidden="true" />
                  {activity.displayLabel || t(activity.label)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
