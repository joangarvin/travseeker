import { t } from '../../../i18n';
import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { ClimateCarousel } from './ClimateCarousel';
import { getDestinationClimate } from '../../../services/climateService';
import type { ClimateMonth, ClimateResponse, TemperatureUnit } from '../../../types';
import {
  bestClimateMonths,
  crowdLabel,
  metricLabel,
  monthGrade,
  monthGradeLabel,
  monthScore,
  safeStoredTemperatureUnit,
  storeTemperatureUnit,
  temperatureLabel,
} from '../../../utils/climate';

type Props = {
  destinationId: string;
  hasValidCoordinates: boolean;
  destinationName: string;
};

export function ClimateSection({ destinationId, hasValidCoordinates, destinationName }: Props) {
  const [data, setData] = useState<ClimateResponse | null>(null);
  const [loading, setLoading] = useState(hasValidCoordinates);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [initialMonth, setInitialMonth] = useState(1);
  const [unit, setUnit] = useState<TemperatureUnit>(() => safeStoredTemperatureUnit());

  useEffect(() => {
    if (!hasValidCoordinates) {
      setLoading(false);
      setData(null);
      setError(t('No tenemos la ubicación necesaria para calcular el tiempo de este destino.'));
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setData(null);
    setError('');
    void getDestinationClimate(destinationId, controller.signal)
      .then((response) => {
        setData(response);
        const ranked = [...response.months].sort(
          (a, b) => (monthScore(b) ?? -1) - (monthScore(a) ?? -1) || a.month - b.month,
        );
        setInitialMonth(ranked[0]?.month || 1);
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === 'AbortError') return;
        setError(
          cause instanceof Error ? cause.message : t('No pudimos consultar el clima ahora mismo.'),
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
  const bestMonths = useMemo(() => bestClimateMonths(orderedMonths), [orderedMonths]);
  const initial = orderedMonths.find((month) => month.month === initialMonth) || orderedMonths[0];

  return (
    <div className="climate-section" aria-busy={loading}>
      <header className="climate-section__heading">
        <div>
          <h2 id="when-to-go-heading">{t('El momento también cuenta.')}</h2>
          <p className="climate-section__lede">{t('Clima y afluencia, mes a mes.')}</p>
        </div>
        <div
          className="climate-unit"
          data-unit={unit}
          role="group"
          aria-label={t('Unidad de temperatura')}
        >
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
        <div className="climate-skeleton" role="status" aria-label={t('Consultando el clima')}>
          <span className="climate-skeleton__detail" />
        </div>
      )}

      {!loading && (error || (data && !initial)) && (
        <div className="climate-state" role="alert">
          <AlertTriangle aria-hidden="true" />
          <div>
            <strong>{t('No podemos mostrar cuándo ir')}</strong>
            <p>{error || t('Todavía no hay datos mensuales para este destino.')}</p>
          </div>
          {hasValidCoordinates && (
            <button type="button" onClick={() => setRetry((value) => value + 1)}>
              <RefreshCw aria-hidden="true" /> {t('Reintentar')}
            </button>
          )}
        </div>
      )}

      {!loading && data && initial && (
        <>
          {data.stale && (
            <p className="climate-warning" role="status">
              <AlertTriangle aria-hidden="true" />{' '}
              {t('Mostramos la última información guardada porque no pudimos actualizarla ahora.')}
            </p>
          )}
          <ClimateCarousel
            key={destinationId}
            months={orderedMonths}
            bestMonths={bestMonths}
            initialMonth={initial.month}
            destinationName={destinationName}
            unit={unit}
          />

          <details className="climate-details">
            <summary>{t('Ver datos y metodología')}</summary>
            <div className="climate-details__content">
              <section aria-labelledby="climate-all-data">
                <h3 id="climate-all-data">{t('Todo el año')}</h3>
                <div className="climate-table">
                  <table>
                    <caption>{t('Promedios mensuales de clima y afluencia')}</caption>
                    <thead>
                      <tr>
                        <th scope="col">{t('Mes')}</th>
                        <th scope="col">{t('Nota')}</th>
                        <th scope="col">{t('Mín.')}</th>
                        <th scope="col">{t('Máx.')}</th>
                        <th scope="col">{t('Lluvia')}</th>
                        <th scope="col">{t('Precipitación')}</th>
                        <th scope="col">{t('Sol')}</th>
                        <th scope="col">{t('Afluencia')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderedMonths.map((month: ClimateMonth) => {
                        const score = monthScore(month);
                        const grade = monthGrade(score);
                        return (
                          <tr key={month.month}>
                            <th scope="row">{month.name}</th>
                            <td>
                              {grade ? `${monthGradeLabel(grade)} · ${score}` : t('Sin datos')}
                            </td>
                            <td>{temperatureLabel(month.temperatureMinC, unit)}</td>
                            <td>{temperatureLabel(month.temperatureMaxC, unit)}</td>
                            <td>{metricLabel(month.rainyDaysPerYear, 'rain')}</td>
                            <td>
                              {month.precipitationMmPerYear == null
                                ? t('Sin datos')
                                : t('{0} mm/mes', { 0: month.precipitationMmPerYear })}
                            </td>
                            <td>{metricLabel(month.sunshineHoursPerDay, 'sun')}</td>
                            <td>{crowdLabel(month.crowd, true)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
              <section className="climate-method" aria-labelledby="climate-method-heading">
                <h3 id="climate-method-heading">{t('Cómo se calcula')}</h3>
                <p>
                  {t(
                    'La nota de cada mes combina tres cosas: lo agradable de las máximas (mejor entre 20 y 26 °C), los días de lluvia y la afluencia estimada. Pesan un 40 %, un 25 % y un 35 %.',
                  )}
                </p>
                <p>
                  {t('Reanálisis histórico')} {data.period.start} — {data.period.end} ·{' '}
                  {data.period.sampleYears} {t('años ·')} {Math.round(data.period.coverage * 100)}
                  {t(
                    '% de cobertura. Medias de máximas y mínimas diarias; consideramos lluvioso un día con al menos 1 mm. La afluencia es una estimación editorial de TravSeeker.',
                  )}
                </p>
                <p>
                  {t('Fuente:')}{' '}
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
