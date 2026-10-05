import { locale, t } from '../../../i18n';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CloudRain,
  RefreshCw,
  Star,
  Sun,
  ThermometerSun,
  Users,
} from 'lucide-react';
import { getDestinationClimate } from '../../../services/climateService';
import type { ClimateMonth, ClimateResponse, TemperatureUnit } from '../../../types';
import {
  bestClimateMonths,
  crowdLabel,
  crowdLevel,
  listMonths,
  metricLabel,
  monthGrade,
  monthGradeLabel,
  monthScore,
  monthSummary,
  safeStoredTemperatureUnit,
  storeTemperatureUnit,
  temperature,
  temperatureLabel,
  type MonthGrade,
} from '../../../utils/climate';

type Props = {
  destinationId: string;
  hasValidCoordinates: boolean;
};

const GRADES: MonthGrade[] = ['ideal', 'good', 'fair', 'poor'];

function degrees(value: number | null, unit: TemperatureUnit) {
  const converted = temperature(value, unit);
  return converted == null ? '—' : `${Math.round(converted)}°`;
}

function crowdWord(value: number | null | undefined) {
  const level = crowdLevel(value);
  if (!level) return null;
  const word = t(level);
  return word.charAt(0).toLocaleUpperCase() + word.slice(1);
}

function CrowdDot({ value }: { value: number | null | undefined }) {
  const level = crowdLevel(value);
  return <i className={`climate-dot climate-dot--${level ?? 'none'}`} aria-hidden="true" />;
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
        setSelectedMonth(ranked[0]?.month || 1);
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
  const bestIds = new Set(bestMonths.map((month) => month.month));
  const selected = orderedMonths.find((month) => month.month === selectedMonth) || orderedMonths[0];
  const selectedScore = selected ? monthScore(selected) : null;
  const selectedGrade = monthGrade(selectedScore);

  const moveMonth = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const grid = event.currentTarget.parentElement;
    const columns = grid
      ? getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length
      : 4;
    const count = orderedMonths.length;
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % count;
    else if (event.key === 'ArrowLeft') next = (index + count - 1) % count;
    else if (event.key === 'ArrowDown') next = Math.min(count - 1, index + columns);
    else if (event.key === 'ArrowUp') next = Math.max(0, index - columns);
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = count - 1;
    else return;
    event.preventDefault();
    const month = orderedMonths[next];
    if (month) setSelectedMonth(month.month);
    monthButtons.current[next]?.focus();
  };

  return (
    <div className="climate-section" aria-busy={loading}>
      <header className="climate-section__heading">
        <div>
          <p className="kicker">{t('El momento importa')}</p>
          <h2 id="when-to-go-heading">{t('Cuándo ir')}</h2>
          {bestMonths.length > 0 && (
            <p className="climate-section__lede">
              {bestMonths.length === 1
                ? t('{0} es el mes con mejor combinación de clima y afluencia.', {
                    0: bestMonths[0].name,
                  })
                : t('{0} son la mejor combinación de clima y afluencia.', {
                    0: listMonths(
                      bestMonths.map((month, index) =>
                        index && locale === 'es' ? month.name.toLocaleLowerCase('es') : month.name,
                      ),
                    ),
                  })}
            </p>
          )}
        </div>
        <div className="climate-unit" role="group" aria-label={t('Unidad de temperatura')}>
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
          <span className="climate-skeleton__calendar" />
          <span className="climate-skeleton__detail" />
        </div>
      )}

      {!loading && error && (
        <div className="climate-state" role="alert">
          <AlertTriangle aria-hidden="true" />
          <div>
            <strong>{t('No podemos mostrar cuándo ir')}</strong>
            <p>{error}</p>
          </div>
          {hasValidCoordinates && (
            <button type="button" onClick={() => setRetry((value) => value + 1)}>
              <RefreshCw aria-hidden="true" /> {t('Reintentar')}
            </button>
          )}
        </div>
      )}

      {!loading && data && selected && (
        <>
          {data.stale && (
            <p className="climate-warning" role="status">
              <AlertTriangle aria-hidden="true" />{' '}
              {t('Mostramos la última información guardada porque no pudimos actualizarla ahora.')}
            </p>
          )}
          <div className="climate-planner">
            <div className="climate-planner__calendar">
              <div className="climate-calendar" role="group" aria-label={t('Mes del año')}>
                {orderedMonths.map((month, index) => {
                  const score = monthScore(month);
                  const grade = monthGrade(score);
                  const isSelected = selected.month === month.month;
                  const isBest = bestIds.has(month.month);
                  return (
                    <button
                      key={month.month}
                      ref={(node) => {
                        monthButtons.current[index] = node;
                      }}
                      type="button"
                      className="climate-tile"
                      data-grade={grade ?? 'none'}
                      aria-label={t('{0}: {1}, máxima {2}, {3}{4}', {
                        0: month.name,
                        1: grade ? monthGradeLabel(grade) : t('Sin datos'),
                        2: temperatureLabel(month.temperatureMaxC, unit),
                        3: crowdLabel(month.crowd, true),
                        4: isBest ? t(', recomendación principal') : '',
                      })}
                      aria-pressed={isSelected}
                      tabIndex={isSelected ? 0 : -1}
                      onClick={() => setSelectedMonth(month.month)}
                      onKeyDown={(event) => moveMonth(event, index)}
                    >
                      <span className="climate-tile__top" aria-hidden="true">
                        <b>{month.name.slice(0, 3)}</b>
                        {isBest && <Star />}
                      </span>
                      {grade && (
                        <span className="climate-tile__grade" aria-hidden="true">
                          {monthGradeLabel(grade)}
                        </span>
                      )}
                      <span className="climate-tile__temp" aria-hidden="true">
                        <strong>{degrees(month.temperatureMaxC, unit)}</strong>
                        <span>{degrees(month.temperatureMinC, unit)}</span>
                      </span>
                      <span className="climate-tile__meta" aria-hidden="true">
                        <span>
                          <CloudRain />
                          {month.rainyDaysPerYear == null
                            ? '—'
                            : Math.round(month.rainyDaysPerYear)}
                        </span>
                        <span>
                          <CrowdDot value={month.crowd} />
                          {crowdWord(month.crowd) ?? '—'}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <ul className="climate-legend" aria-label={t('Leyenda')}>
                {GRADES.map((grade) => (
                  <li key={grade} data-grade={grade}>
                    {monthGradeLabel(grade)}
                  </li>
                ))}
                <li className="climate-legend__icon">
                  <CloudRain aria-hidden="true" /> {t('días de lluvia')}
                </li>
              </ul>
            </div>

            <article
              className="climate-detail"
              data-grade={selectedGrade ?? 'none'}
              aria-live="polite"
              aria-atomic="true"
            >
              <div className="climate-detail__top">
                {selectedGrade && (
                  <span className="climate-detail__grade">
                    <Star aria-hidden="true" /> {monthGradeLabel(selectedGrade)} · {selectedScore}
                    /100
                  </span>
                )}
                <span className="climate-detail__eyebrow">
                  {bestIds.has(selected.month) ? t('Nuestra recomendación') : t('Mes seleccionado')}
                </span>
              </div>
              <h3>{selected.name}</h3>
              <p className="climate-detail__summary">
                {t('En {0} suele haber {1}.', {
                  0: locale === 'es' ? selected.name.toLocaleLowerCase('es') : selected.name,
                  1: monthSummary(selected),
                })}
              </p>
              <dl className="climate-detail__stats">
                <div>
                  <dt>
                    <ThermometerSun aria-hidden="true" /> {t('Temperatura')}
                  </dt>
                  <dd>
                    {degrees(selected.temperatureMinC, unit)} –{' '}
                    {degrees(selected.temperatureMaxC, unit)}
                  </dd>
                </div>
                <div>
                  <dt>
                    <CloudRain aria-hidden="true" /> {t('Lluvia')}
                  </dt>
                  <dd>
                    {selected.rainyDaysPerYear == null
                      ? t('Sin datos')
                      : t('{0} días', { 0: Math.round(selected.rainyDaysPerYear) })}
                  </dd>
                </div>
                <div>
                  <dt>
                    <Users aria-hidden="true" /> {t('Afluencia')}
                  </dt>
                  <dd>
                    <CrowdDot value={selected.crowd} />
                    {crowdWord(selected.crowd)
                      ? `${crowdWord(selected.crowd)} · ${Math.round(selected.crowd!)}%`
                      : t('Sin datos')}
                  </dd>
                </div>
                <div>
                  <dt>
                    <Sun aria-hidden="true" /> {t('Sol')}
                  </dt>
                  <dd>
                    {selected.sunshineHoursPerDay == null
                      ? t('Sin datos')
                      : t('{0} h/día', { 0: Math.round(selected.sunshineHoursPerDay) })}
                  </dd>
                </div>
              </dl>
            </article>
          </div>

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
