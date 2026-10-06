import { Check, GitCompare, MapPin, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { catalogName, t } from '../../../i18n';
import { Loader, MediaImage, Notice } from '../../../components/ui';
import { distanceLabel, imageUrl, plain } from '../../../utils';
import type { Destino } from '../../../types';

function matchReasons(source: Destino, item: Destino) {
  const reasons: string[] = [];
  const shared = (item.tourismTypes || [])
    .filter((type) => item.match?.sharedTypeIds.includes(type.id))
    .slice(0, 2)
    .map(catalogName);
  if (shared.length) {
    reasons.push(t('{0}, como aquí', { 0: shared.join(t(' y ')) }));
  }

  const budget = plain(item.presupuesto);
  const crowd = plain(item.masificacion);
  const budgetDelta = item.match?.budgetDelta;
  if (budget) {
    if (budgetDelta === 0) reasons.push(t('Mismo presupuesto · {0}', { 0: t(budget) }));
    else if (budgetDelta != null && budgetDelta < 0)
      reasons.push(t('Presupuesto más bajo · {0}', { 0: t(budget) }));
    else if (budgetDelta != null && budgetDelta > 0)
      reasons.push(t('Presupuesto algo mayor · {0}', { 0: t(budget) }));
    else reasons.push(t('Presupuesto {0}', { 0: t(budget) }));
  }

  if (crowd) {
    const crowdLabel = t(crowd).toLocaleLowerCase();
    const crowdDelta = item.match?.crowdDelta;
    if (crowdDelta === 0)
      reasons.push(t('Igual de tranquilo · afluencia {0}', { 0: crowdLabel }));
    else if (crowdDelta != null && crowdDelta < 0)
      reasons.push(t('Más tranquilo · afluencia {0}', { 0: crowdLabel }));
    else if (crowdDelta != null && crowdDelta > 0)
      reasons.push(t('Afluencia {0}', { 0: crowdLabel }));
    else reasons.push(t('Afluencia {0}', { 0: crowdLabel }));
  }

  return reasons.slice(0, 3);
}

export function RelatedDestinations({
  destination,
  items,
  loading,
  error,
  onRetry,
}: {
  destination: Destino;
  items: Destino[];
  loading: boolean;
  error: string;
  onRetry: () => void;
}) {
  return (
    <section id="alternativas" className="related" aria-labelledby="related-title">
      <div className="destination-section-heading">
        <p className="kicker">{t('Sigue explorando')}</p>
        <h2 id="related-title">{t('Otros destinos que pueden encajar')}</h2>
        <p>
          {t(
            'Elegidos por lo que comparten con {0}: tipo de viaje, presupuesto, afluencia y distancia.',
            { 0: destination.nombre.trim() },
          )}
        </p>
      </div>
      {error ? (
        <Notice
          tone="error"
          action={
            <button type="button" onClick={onRetry}>
              {t('Reintentar')}
            </button>
          }
        >
          {error}
        </Notice>
      ) : loading ? (
        <Loader label={t('Buscando destinos relacionados')} />
      ) : !items.length ? (
        <p className="destination-empty-copy">
          {t('No hay recomendaciones relacionadas publicadas por ahora.')}
        </p>
      ) : (
        <div className="related__grid">
          {items.slice(0, 3).map((item) => {
            const reasons = matchReasons(destination, item);
            const params = new URLSearchParams({ ids: [destination.id, item.id].join(',') });
            const km = item.match?.distanceKm;
            const affinity = item.match?.affinity;
            return (
              <article className="related-option" key={item.id}>
                <Link
                  className="related-option__image"
                  to={`/destino/${item.id}`}
                  aria-label={t('Ver {0}', { 0: item.nombre })}
                >
                  <MediaImage
                    src={imageUrl(item.imagen)}
                    alt=""
                    loading="lazy"
                    sizes="(max-width: 700px) 100vw, 33vw"
                  />
                  {affinity != null && (
                    <span className="related-option__affinity">
                      <Sparkles aria-hidden="true" />
                      <b>{affinity}%</b> {t('afinidad')}
                    </span>
                  )}
                </Link>
                <div className="related-option__body">
                  <h3>
                    <Link to={`/destino/${item.id}`}>{item.nombre.trim()}</Link>
                  </h3>
                  {reasons.length > 0 && (
                    <ul className="related-option__why">
                      {reasons.map((reason) => (
                        <li key={reason}>
                          <Check aria-hidden="true" />
                          {reason}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="related-option__footer">
                    {km != null ? (
                      <small>
                        <MapPin aria-hidden="true" />
                        {t('A {0}', { 0: distanceLabel(km) })}
                      </small>
                    ) : (
                      <small>{t(plain(item.ubicacion))}</small>
                    )}
                    <Link className="related-option__compare" to={`/comparar?${params}`}>
                      <GitCompare aria-hidden="true" />
                      {t('Comparar')}
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
