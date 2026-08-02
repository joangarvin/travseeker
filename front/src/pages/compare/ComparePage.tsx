import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check, GitCompare, Plus, Search, Trash2, X } from 'lucide-react';
import { api } from '../../services/api';
import { useCompare } from '../../contexts';
import { imageUrl, plain } from '../../utils';
import type { Destino } from '../../types';
import { Empty, Loader, MediaImage } from '../../components/ui';
import { PageHeading, Shell } from '../../components/layout';
import { TourismMarks } from '../../features/tourism/tourism';
import { ActivityMarks } from '../../features/activities/activities';

const rows: Array<[string, keyof Destino]> = [
  ['Presupuesto', 'presupuesto'],
  ['Afluencia', 'masificacion'],
  ['Tipos de viaje', 'tipoTurismoPrincipal'],
  ['Actividades', 'tipoTurismoSecundario'],
  ['Julio y agosto', 'mesesJulioAgosto'],
  ['Entretiempo', 'mesesMayJunSeptOct'],
  ['Noviembre a abril', 'mesesNovAbril'],
];

export default function ComparePage() {
  const compare = useCompare();
  const [params, setParams] = useSearchParams();
  const [catalog, setCatalog] = useState<Destino[]>([]);
  const [items, setItems] = useState<Destino[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    api<Destino[]>('/destinos').then(setCatalog);
  }, []);
  useEffect(() => {
    const fromUrl = (params.get('ids') || '').split(',').filter(Boolean).slice(0, 4);
    if (fromUrl.length && !compare.ids.length) fromUrl.forEach(compare.toggle);
  }, []);
  useEffect(() => {
    if (compare.ids.length) setParams({ ids: compare.ids.join(',') }, { replace: true });
    else setParams({}, { replace: true });
    if (compare.ids.length < 2) {
      setItems([]);
      return;
    }
    setLoading(true);
    api<Destino[]>(`/destinos/compare?ids=${compare.ids.join(',')}`)
      .then(setItems)
      .finally(() => setLoading(false));
  }, [compare.ids.join(',')]);
  const suggestions = useMemo(
    () =>
      catalog
        .filter(
          (item) =>
            !compare.ids.includes(item.id) &&
            item.nombre.toLowerCase().includes(query.toLowerCase()),
        )
        .slice(0, 8),
    [catalog, compare.ids, query],
  );
  return (
    <Shell>
      <PageHeading kicker="Decide con los datos delante" title="Comparar destinos">
        <p>
          Hasta cuatro lugares, criterio por criterio. Sin ganador automático: la mejor opción
          depende de tu viaje.
        </p>
      </PageHeading>
      <section className="compare-picker">
        <div className="compare-picker__selected">
          {compare.ids.map((id) => {
            const item = catalog.find((d) => d.id === id);
            return (
              <span key={id}>
                {item?.nombre || 'Destino'}
                <button
                  onClick={() => compare.toggle(id)}
                  aria-label={`Quitar ${item?.nombre || 'destino'}`}
                >
                  <X />
                </button>
              </span>
            );
          })}
        </div>
        {compare.ids.length < 4 && (
          <div className="compare-picker__search">
            <Search />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Añade otro destino"
              aria-label="Buscar destino para comparar"
            />
            {query && (
              <div>
                {suggestions.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      compare.toggle(item.id);
                      setQuery('');
                    }}
                  >
                    <Plus /> {item.nombre}
                    <small>{plain(item.ubicacion)}</small>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {compare.ids.length > 0 && (
          <button className="button button--quiet" onClick={compare.clear}>
            <Trash2 /> Vaciar
          </button>
        )}
      </section>
      <section className="compare-content">
        {compare.ids.length < 2 ? (
          <Empty icon={<GitCompare />} title="Elige al menos dos destinos">
            Añade lugares desde el buscador o desde cualquier ficha para verlos cara a cara.
          </Empty>
        ) : loading ? (
          <Loader label="Preparando la comparación" />
        ) : (
          <div
            className="compare-table"
            style={{ '--compare-count': items.length } as React.CSSProperties}
          >
            <div className="compare-table__corner" />
            {items.map((item) => (
              <article key={item.id} className="compare-table__head">
                <MediaImage src={imageUrl(item.imagen)} alt="" />
                <Link to={`/destino/${item.id}`}>{item.nombre.trim()}</Link>
                <span>{plain(item.ubicacion)}</span>
              </article>
            ))}
            {rows.map(([label, key]) => (
              <div className="compare-table__row" key={key}>
                <strong>{label}</strong>
                {items.map((item) => {
                  const value = item[key];
                  const isTourism = key === 'tipoTurismoPrincipal';
                  const isActivity = key === 'tipoTurismoSecundario';
                  const crowd = key.toString().startsWith('meses')
                    ? `${value}%`
                    : plain(String(value || '—'));
                  return (
                    <div key={item.id}>
                      {isTourism ? (
                        <TourismMarks value={String(value || '')} compact />
                      ) : isActivity ? (
                        <ActivityMarks value={String(value || '')} />
                      ) : (
                        <>
                          {key.toString().startsWith('meses') && Number(value) <= 40 && <Check />}
                          <span>{crowd}</span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </section>
    </Shell>
  );
}
