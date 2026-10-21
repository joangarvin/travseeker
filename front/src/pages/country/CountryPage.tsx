import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowLeft, ArrowUpRight, Globe2, Map } from 'lucide-react';
import { Shell, PageMeta } from '../../components/layout';
import { Empty, Loader, MediaImage, Notice } from '../../components/ui';
import { ExternalMapGate } from '../../features/privacy/CookieConsent';
import { DestinationCard } from '../../features/destinations/components/DestinationCard';
import { api, ApiError } from '../../services/api';
import { imageUrl } from '../../utils';
import { t } from '../../i18n';
import { SearchBox } from '../../features/search/SearchBox';
import { HomeFilterPanel } from '../../features/search/HomeFilterPanel';
import { getActiveFilterChips } from '../../utils/filterFallbackEngine';
import type { SearchFilters } from '../../types';
import type { CountryPageData } from '../../features/countries/types';
export default function CountryPage() {
  const { code = '' } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState<CountryPageData | null>(null),
    [filters, setFilters] = useState<SearchFilters>(() => ({
      ...Object.fromEntries(params),
      countryCode: code.toUpperCase(),
      tipoTurismo: params.get('tipoTurismo') || params.get('type') || '',
    })),
    [filtersOpen, setFiltersOpen] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [missing, setMissing] = useState(false),
    [revision, setRevision] = useState(0);
  const searchKey = params.toString();
  const offset = Math.max(0, parseInt(params.get('offset') || '0', 10) || 0);
  useEffect(() => {
    const current = new URLSearchParams(searchKey);
    setFilters({
      ...Object.fromEntries(current),
      countryCode: code.toUpperCase(),
      tipoTurismo: current.get('tipoTurismo') || current.get('type') || '',
    });
  }, [code, searchKey]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setData((current) => (current?.code === code.toUpperCase() ? current : null));
    setError('');
    setMissing(false);
    const search = new URLSearchParams(searchKey);
    api<CountryPageData>(`/paises/${encodeURIComponent(code)}?${search}`, {
      signal: controller.signal,
    })
      .then((value) => {
        if (!controller.signal.aborted) setData(value);
      })
      .catch((cause) => {
        if (!controller.signal.aborted) {
          setMissing(cause instanceof ApiError && cause.status === 404);
          setError(cause.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [code, searchKey, revision]);
  function apply(next = filters) {
    const p = new URLSearchParams();
    if (params.get('lang')) p.set('lang', params.get('lang')!);
    for (const [key, value] of Object.entries(next)) {
      if (value && !['offset', 'type', 'countryCode'].includes(key)) p.set(key, value);
    }
    const nextCountry = next.countryCode || '';
    if (nextCountry !== code.toUpperCase()) {
      navigate(`${nextCountry ? `/pais/${nextCountry.toLowerCase()}` : '/'}?${p}`);
    } else {
      setParams(p);
    }
    setFiltersOpen(false);
  }
  function reset() {
    const defaults = { countryCode: code.toUpperCase() };
    setFilters(defaults);
    apply(defaults);
  }
  function paginate(next: number) {
    setParams((current) => {
      const p = new URLSearchParams(current);
      if (next) p.set('offset', String(next));
      else p.delete('offset');
      return p;
    });
    document.getElementById('country-destinations')?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    });
  }
  const back = (
    <Link to="/" className="country-page__back">
      <ArrowLeft size={17} aria-hidden />
      {t('Volver a descubrir')}
    </Link>
  );
  if (loading && !data)
    return (
      <Shell>
        <section className="country-page">
          <Loader label={t('Cargando país…')} />
        </section>
      </Shell>
    );
  if (missing)
    return (
      <Shell>
        <PageMeta
          title={t('País no disponible — TravSeeker')}
          description={t('Explora los destinos y países que ya tienen guías publicadas.')}
        />
        <section className="country-page country-page__gate">
          <Empty
            headingLevel="h1"
            icon={<Globe2 />}
            title={t('Este país todavía no está disponible')}
            action={back}
          >
            {t('Explora los destinos y países que ya tienen guías publicadas.')}
          </Empty>
        </section>
      </Shell>
    );
  if (error && !data)
    return (
      <Shell>
        <section className="country-page">
          {back}
          <Notice tone="error">
            {error}
            <button className="button button--secondary" onClick={() => setRevision((n) => n + 1)}>
              {t('Reintentar')}
            </button>
          </Notice>
        </section>
      </Shell>
    );
  if (!data) return null;
  if (data.status === 'upcoming')
    return (
      <Shell>
        <PageMeta
          title={`${data.name} · ${t('Próximamente')} — TravSeeker`}
          description={t('Sus destinos y su guía aparecerán cuando estén listos.')}
        />
        <section className="country-page country-page__gate">
          {back}
          <p className="kicker">{t('Próximamente')}</p>
          <h1>{t('Estamos preparando {0}', { 0: data.name })}</h1>
          <p>{t('Sus destinos y su guía aparecerán cuando estén listos.')}</p>
        </section>
      </Shell>
    );
  return (
    <Shell>
      <PageMeta
        title={`${t('Destinos de {0}', { 0: data.name })} — TravSeeker`}
        description={data.description || t('Encuentra tu próximo destino')}
      />
      <article className="country-page">
        <nav className="country-page__breadcrumb" aria-label={t('Ruta de navegación')}>
          {back}
          <span>{data.name}</span>
        </nav>
        {data.image && (
          <figure className="country-page__photo">
            <MediaImage
              src={imageUrl(data.image)}
              alt={data.imageAlt || data.name}
              loading="eager"
              fetchPriority="high"
              sizes="100vw"
            />
            <figcaption>{data.imageAlt}</figcaption>
          </figure>
        )}
        <div
          className={`country-page__overview ${data.bbox ? '' : 'country-page__overview--text'}`}
        >
          <header className="country-page__intro">
            <p className="kicker">{t('Encuentra tu próximo destino')}</p>
            <h1>{data.name}</h1>
            {data.description && <p className="country-page__description">{data.description}</p>}
            <a href="#country-destinations" className="button button--sun">
              {t('Explorar destinos')}
              <ArrowDown size={17} aria-hidden />
            </a>
            <dl className="country-page__facts">
              <div>
                <dt>{t('En esta guía')}</dt>
                <dd>{t('{0} destinos', { 0: data.destinationCount || 0 })}</dd>
              </div>
              {data.currency && (
                <div>
                  <dt>{t('Moneda')}</dt>
                  <dd>{data.currency}</dd>
                </div>
              )}
              {data.languages && (
                <div>
                  <dt>{t('Idiomas')}</dt>
                  <dd>{data.languages}</dd>
                </div>
              )}
            </dl>
          </header>
          {data.bbox && (
            <section className="country-page__map" aria-labelledby="country-map-title">
              <div className="country-page__map-heading">
                <h2 id="country-map-title">
                  <Map size={20} aria-hidden />
                  {t('Dónde está')}
                </h2>
                <a
                  className="country-page__map-link"
                  href={`https://www.openstreetmap.org/?bbox=${data.bbox.join('%2C')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('Abrir mapa')}
                  <ArrowUpRight size={17} aria-hidden />
                </a>
              </div>
              <div className="country-page__map-canvas">
                <ExternalMapGate>
                  <iframe
                    title={t('Mapa de {0}', { 0: data.name })}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${data.bbox.join('%2C')}&layer=mapnik`}
                  />
                </ExternalMapGate>
              </div>
            </section>
          )}
        </div>
        <section
          className="country-page__destinations"
          id="country-destinations"
          aria-labelledby="country-destinations-title"
          aria-busy={loading}
        >
          <header>
            <div>
              <p className="kicker">{t('Elige tu próxima parada')}</p>
              <h2 id="country-destinations-title">{t('Destinos de {0}', { 0: data.name })}</h2>
            </div>
            <p role="status">{t('{0} resultados', { 0: data.total || 0 })}</p>
          </header>
          <div className="country-page__search">
            <SearchBox
              value={filters.q || ''}
              onChange={(q) => setFilters((current) => ({ ...current, q }))}
              onSubmit={() => apply()}
              loading={loading}
            />
            <HomeFilterPanel
              filters={filters}
              isOpen={filtersOpen}
              activeCount={getActiveFilterChips(filters).length}
              countries={data.filterOptions?.countries}
              locations={data.filterOptions?.locations || []}
              locationLabels={data.filterOptions?.locationLabels}
              activities={data.filterOptions?.activities || []}
              onToggle={() => setFiltersOpen((open) => !open)}
              onUpdate={(key, value) => setFilters((current) => ({ ...current, [key]: value }))}
              onClear={reset}
              onApply={() => apply()}
              loading={loading}
            />
          </div>
          {error && (
            <Notice tone="error">
              {error}
              <button className="button button--quiet" onClick={() => setRevision((n) => n + 1)}>
                {t('Reintentar')}
              </button>
            </Notice>
          )}
          {loading && <p role="status">{t('Actualizando destinos…')}</p>}
          {data.items?.length ? (
            <div className="country-page__grid">
              {data.items.map((d) => (
                <DestinationCard key={d.id} destino={d} index={-1} />
              ))}
            </div>
          ) : (
            !loading && (
              <Empty
                title={t('No hay destinos con estos filtros')}
                action={
                  <button className="button button--primary" onClick={reset}>
                    {t('Limpiar filtros')}
                  </button>
                }
              >
                {t('Prueba con otra búsqueda o tipo de viaje.')}
              </Empty>
            )
          )}
          {!!data.total && (
            <nav className="country-page__pagination" aria-label={t('Páginas del catálogo')}>
              <button
                className="button button--secondary"
                disabled={!offset || loading}
                onClick={() => paginate(Math.max(0, offset - 24))}
              >
                {t('Anterior')}
              </button>
              <span>
                {Math.min(offset + 1, data.total)}–
                {Math.min(offset + (data.items?.length || 0), data.total)} / {data.total}
              </span>
              <button
                className="button button--secondary"
                disabled={!data.hasMore || loading}
                onClick={() => paginate(offset + 24)}
              >
                {t('Siguiente')}
              </button>
            </nav>
          )}
        </section>
      </article>
    </Shell>
  );
}
