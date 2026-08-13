import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CloudRain, RefreshCw, Star, Sun } from 'lucide-react';
import { getDestinationClimate } from '../../../services/climateService';
import type { ClimateMonth, ClimateResponse, TemperatureUnit } from '../../../types';
import {
  buildClimateAlternatives,
  crowdLabel,
  metricLabel,
  monthSummary,
  safeStoredTemperatureUnit,
  storeTemperatureUnit,
  temperatureLabel,
} from '../../../utils/climate';

type Props = {
  destinationId: string;
  hasValidCoordinates: boolean;
};

function alternativeReason(
  month: ClimateMonth,
  role: 'balance' | 'quiet' | 'warm',
  unit: TemperatureUnit,
) {
  if (role === 'quiet') {
    return `${crowdLabel(month.crowd)} · máxima ${temperatureLabel(month.temperatureMaxC, unit)}`;
  }
  if (role === 'warm') {
    return `Máxima ${temperatureLabel(month.temperatureMaxC, unit)} · ${metricLabel(month.rainyDaysPerYear, 'rain')}`;
  }
  return monthSummary(month);
}

export function ClimateSection({ destinationId, hasValidCoordinates }: Props) {
  const [data, setData] = useState<ClimateResponse | null>(null);
  const [loading, setLoading] = useState(hasValidCoordinates);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [unit, setUnit] = useState<TemperatureUnit>(() => safeStoredTemperatureUnit());
  const monthButtons = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (!hasValidCoordinates) {
      setLoading(false);
      setData(null);
      setError('No tenemos la ubicación necesaria para calcular el tiempo de este destino.');
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setData(null);
    setError('');
    void getDestinationClimate(destinationId, controller.signal)
      .then((response) => {
        setData(response);
        setSelectedMonth(response.recommendedMonths[0]?.month || 1);
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === 'AbortError') return;
        setError(
          cause instanceof Error ? cause.message : 'No pudimos consultar el clima ahora mismo.',
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [destinationId, hasValidCoordinates, retry]);

  const selectUnit = (next: TemperatureUnit) => {
    setUnit(next);
    storeTemperatureUnit(next);
  };
  const orderedMonths = useMemo(
    () => (data ? [...data.months].sort((a, b) => a.month - b.month) : []),
    [data],
  );
  const alternatives = useMemo(
    () => (data ? buildClimateAlternatives(orderedMonths, data.recommendedMonths) : []),
    [data, orderedMonths],
  );
  const selected = orderedMonths.find((month) => month.month === selectedMonth) || orderedMonths[0];
  const recommendedMonth = alternatives[0]?.month.month;
  const moveMonth = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % orderedMonths.length;
    else if (event.key === 'ArrowLeft')
      next = (index + orderedMonths.length - 1) % orderedMonths.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = orderedMonths.length - 1;
    else return;
    event.preventDefault();
    const month = orderedMonths[next];
    if (month) setSelectedMonth(month.month);
    monthButtons.current[next]?.focus();
    monthButtons.current[next]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  };

  return (
    <div className="climate-section" aria-busy={loading}>
      <header className="climate-section__heading">
        <div>
          <p className="kicker">El momento importa</p>
          <h2 id="when-to-go-heading">Cuándo ir</h2>
        </div>
        <div className="climate-unit" role="group" aria-label="Unidad de temperatura">
          {(['C', 'F'] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={unit === value}
              onClick={() => selectUnit(value)}
            >
              °{value}
            </button>
          ))}
        </div>
      </header>

      {loading && (
        <div className="climate-skeleton" role="status" aria-label="Consultando el clima">
          <span className="climate-skeleton__lead" />
          <span className="climate-skeleton__facts" />
          <span className="climate-skeleton__choices" />
          <span className="climate-skeleton__ribbon" />
        </div>
      )}

      {!loading && error && (
        <div className="climate-state" role="alert">
          <AlertTriangle aria-hidden="true" />
          <div>
            <strong>No podemos mostrar cuándo ir</strong>
            <p>{error}</p>
          </div>
          {hasValidCoordinates && (
            <button type="button" onClick={() => setRetry((value) => value + 1)}>
              <RefreshCw aria-hidden="true" /> Reintentar
            </button>
          )}
        </div>
      )}

      {!loading && data && selected && (
        <>
          {data.stale && (
            <p className="climate-warning" role="status">
              <AlertTriangle aria-hidden="true" /> Mostramos la última información guardada porque
              no pudimos actualizarla ahora.
            </p>
          )}
          <article className="climate-decision" aria-live="polite" aria-atomic="true">
            <p
              className={`climate-decision__eyebrow${selected.month === recommendedMonth ? ' climate-decision__eyebrow--recommended' : ''}`}
            >
              {selected.month === recommendedMonth ? (
                <>
                  <Star aria-hidden="true" /> Nuestra recomendación
                </>
              ) : (
                'Mes seleccionado'
              )}
            </p>
            <h3>{selected.name}</h3>
            <p className="climate-decision__summary">
              En {selected.name} suele haber {monthSummary(selected)}.
            </p>
            <dl className="climate-essentials">
              <div>
                <dt>Temperatura</dt>
                <dd>
                  {temperatureLabel(selected.temperatureMinC, unit)} —{' '}
                  {temperatureLabel(selected.temperatureMaxC, unit)}
                </dd>
              </div>
              <div>
                <dt>Días de lluvia</dt>
                <dd>
                  {selected.rainyDaysPerYear == null
                    ? 'Sin datos'
                    : `${selected.rainyDaysPerYear} al mes`}
                </dd>
              </div>
              <div>
                <dt>Afluencia</dt>
                <dd>{crowdLabel(selected.crowd).replace('Afluencia ', '')}</dd>
              </div>
            </dl>
          </article>

          {alternatives.length > 0 && (
            <div className="climate-alternatives" aria-label="Alternativas recomendadas">
              {alternatives.map((alternative) => {
                const isSelected = selected.month === alternative.month.month;
                return (
                  <button
                    key={alternative.role}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedMonth(alternative.month.month)}
                  >
                    <span className="climate-alternatives__role">
                      {alternative.role === 'balance' && <Star aria-hidden="true" />}
                      {alternative.label}
                    </span>
                    <strong>{alternative.month.name}</strong>
                    <span>{alternativeReason(alternative.month, alternative.role, unit)}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="climate-ribbon-heading">
            <p>
              <strong>Explora el año</strong>
            </p>
            <p>Usa las flechas del teclado para cambiar de mes.</p>
          </div>
          <div className="climate-months" role="group" aria-label="Mes del año">
            {orderedMonths.map((month, index) => {
              const isSelected = selected.month === month.month;
              const isRecommended = recommendedMonth === month.month;
              return (
                <button
                  key={month.month}
                  ref={(node) => {
                    monthButtons.current[index] = node;
                  }}
                  type="button"
                  aria-label={`${month.name}, máxima ${temperatureLabel(month.temperatureMaxC, unit)}${isRecommended ? ', recomendación principal' : ''}${isSelected ? ', seleccionado' : ''}`}
                  aria-pressed={isSelected}
                  tabIndex={isSelected ? 0 : -1}
                  onClick={() => setSelectedMonth(month.month)}
                  onKeyDown={(event) => moveMonth(event, index)}
                >
                  <span className="climate-months__name" aria-hidden="true">
                    {month.name.slice(0, 3)}
                  </span>
                  <strong aria-hidden="true">
                    {temperatureLabel(month.temperatureMaxC, unit).replace(` °${unit}`, '°')}
                  </strong>
                  {isRecommended && (
                    <span className="climate-months__recommendation" aria-hidden="true">
                      <Star /> Ideal
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <details className="climate-details">
            <summary>Ver datos y metodología</summary>
            <div className="climate-details__content">
              <section aria-labelledby="climate-selected-data">
                <h3 id="climate-selected-data">Más datos de {selected.name}</h3>
                <dl className="climate-secondary-data">
                  <div>
                    <dt>
                      <Sun aria-hidden="true" /> Sol
                    </dt>
                    <dd>{metricLabel(selected.sunshineHoursPerDay, 'sun')}</dd>
                  </div>
                  <div>
                    <dt>
                      <CloudRain aria-hidden="true" /> Precipitación
                    </dt>
                    <dd>
                      {selected.precipitationMmPerYear == null
                        ? 'Sin datos'
                        : `${selected.precipitationMmPerYear} mm al mes`}
                    </dd>
                  </div>
                  <div>
                    <dt>Cobertura</dt>
                    <dd>
                      {Math.round(selected.coverage * 100)}% · {selected.sampleYears} años
                    </dd>
                  </div>
                </dl>
              </section>
              <section aria-labelledby="climate-all-data">
                <h3 id="climate-all-data">Todo el año</h3>
                <div className="climate-table">
                  <table>
                    <caption>Promedios mensuales de clima y afluencia</caption>
                    <thead>
                      <tr>
                        <th scope="col">Mes</th>
                        <th scope="col">Mín.</th>
                        <th scope="col">Máx.</th>
                        <th scope="col">Lluvia</th>
                        <th scope="col">Precipitación</th>
                        <th scope="col">Sol</th>
                        <th scope="col">Afluencia</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderedMonths.map((month) => (
                        <tr key={month.month}>
                          <th scope="row">{month.name}</th>
                          <td>{temperatureLabel(month.temperatureMinC, unit)}</td>
                          <td>{temperatureLabel(month.temperatureMaxC, unit)}</td>
                          <td>{metricLabel(month.rainyDaysPerYear, 'rain')}</td>
                          <td>
                            {month.precipitationMmPerYear == null
                              ? 'Sin datos'
                              : `${month.precipitationMmPerYear} mm/mes`}
                          </td>
                          <td>{metricLabel(month.sunshineHoursPerDay, 'sun')}</td>
                          <td>{crowdLabel(month.crowd, true)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
              <section className="climate-method" aria-labelledby="climate-method-heading">
                <h3 id="climate-method-heading">Cómo se calcula</h3>
                <p>
                  Reanálisis histórico {data.period.start} — {data.period.end} ·{' '}
                  {data.period.sampleYears} años · {Math.round(data.period.coverage * 100)}% de
                  cobertura. Medias de máximas y mínimas diarias; consideramos lluvioso un día con
                  al menos 1 mm. La afluencia es una estimación editorial de TravSeeker.
                </p>
                <p>
                  Fuente:{' '}
                  <a
                    href="https://open-meteo.com/en/docs/historical-weather-api"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open-Meteo Historical Weather API
                  </a>{' '}
                  ({data.model}).
                </p>
              </section>
            </div>
          </details>
        </>
      )}
    </div>
  );
}
