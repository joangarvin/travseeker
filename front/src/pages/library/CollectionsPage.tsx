import { t } from '../../i18n';
import { useEffect, useMemo, useState } from 'react';
import { CalendarRange, Plus, Search } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageHeading, Shell } from '../../components/layout';
import { Button, Empty, Loader, Notice } from '../../components/ui';
import { useAuth } from '../../contexts';
import { GuestGate } from '../../features/auth/components/GuestGate';
import { CollectionCover } from '../../features/collections/components/CollectionCover';
import {
  CreateCollectionModal,
  type NewCollectionInput,
} from '../../features/collections/components/CreateCollectionModal';
import { api } from '../../services/api';
import type { CollectionSummary } from '../../types';

export default function CollectionsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, loading: isAuthLoading } = useAuth();
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'open' | 'shared'>('all');

  useEffect(() => {
    if ((location.state as { openCreate?: boolean } | null)?.openCreate) {
      setIsCreateModalOpen(true);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  const loadCollections = async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      setError('');
      setCollections(await api<CollectionSummary[]>('/colecciones', {}, token));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('No se pudieron cargar tus viajes'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadCollections();
  }, [token]);

  const createCollection = async ({
    name,
    description,
    startDate,
    endDate,
    travelerCount,
  }: NewCollectionInput) => {
    if (!token) return;

    try {
      const created = await api<CollectionSummary>(
        '/colecciones',
        {
          method: 'POST',
          body: JSON.stringify({
            nombre: name,
            descripcion: description,
            color: 'cobalt',
            startDate: startDate || null,
            endDate: endDate || null,
            travelerCount,
          }),
        },
        token,
      );
      navigate(`/colecciones/${created.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('No se pudo crear el viaje'));
      throw cause;
    }
  };

  const visibleCollections = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('es');
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return collections.filter((collection) => {
      const matchesQuery =
        !normalizedQuery ||
        `${collection.nombre} ${collection.descripcion || ''}`
          .toLocaleLowerCase('es')
          .includes(normalizedQuery);
      const start = collection.startDate?.slice(0, 10);
      const matchesFilter =
        filter === 'all' ||
        (filter === 'upcoming' &&
          Boolean(start && (collection.endDate?.slice(0, 10) || start) >= today)) ||
        (filter === 'open' && !start) ||
        (filter === 'shared' &&
          (collection.visibility === 'shared' || collection.role !== 'owner'));
      return matchesQuery && matchesFilter;
    });
  }, [collections, filter, query]);

  if (isAuthLoading) {
    return (
      <Shell>
        <Loader />
      </Shell>
    );
  }

  if (!user) {
    return (
      <GuestGate title={t('Convierte ideas en viajes')}>
        {t('Agrupa destinos, ordénalos por días y comparte el plan con quien viaja contigo.')}
      </GuestGate>
    );
  }

  return (
    <Shell>
      <div className="trips-library">
        <PageHeading
          className="trips-heading"
          kicker={t('Planificación')}
          title={t('Tus viajes')}
          action={
            <Button
              disabled={!user.emailVerified}
              aria-describedby={
                !user.emailVerified ? 'new-trip-verification-requirement' : undefined
              }
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus /> {t('Nuevo viaje')}
            </Button>
          }
        >
          <p>{t('Tus rutas, tus ideas y los próximos días por descubrir.')}</p>
        </PageHeading>

        {!user.emailVerified && (
          <p id="new-trip-verification-requirement" className="trip-verification-requirement">
            {t(
              'Verifica tu correo para crear un viaje nuevo. Tus viajes actuales siguen disponibles.',
            )}
          </p>
        )}

        <section className="trips-toolbar" aria-label={t('Buscar y filtrar viajes')}>
          <label className="trips-search" htmlFor="trip-search">
            <Search aria-hidden="true" />
            <span className="sr-only">{t('Buscar viajes')}</span>
            <input
              id="trip-search"
              type="search"
              placeholder={t('Buscar por nombre o descripción')}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <div className="trip-filters" aria-label={t('Filtrar viajes')}>
            {(
              [
                ['all', t('Todos')],
                ['upcoming', t('Próximos')],
                ['open', t('Sin fechas')],
                ['shared', t('Compartidos')],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
              >
                {t(label)}
              </button>
            ))}
          </div>
        </section>

        {!isLoading && (
          <div className="trips-results" role="status">
            <span>
              {visibleCollections.length} {t('viajes encontrados')}
            </span>
            {(query || filter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setFilter('all');
                }}
              >
                {t('Limpiar filtros')}
              </button>
            )}
          </div>
        )}
        <section className="collections-grid" aria-live="polite">
          {error && (
            <Notice tone="error">
              {error}.{' '}
              <button type="button" onClick={() => void loadCollections()}>
                {t('Reintentar')}
              </button>
            </Notice>
          )}
          {isLoading ? (
            <Loader label={t('Preparando tus viajes')} />
          ) : visibleCollections.length ? (
            visibleCollections.map((collection) => (
              <CollectionCover key={collection.id} collection={collection} />
            ))
          ) : collections.length ? (
            <Empty icon={<Search />} title={t('No hay viajes con esos filtros')}>
              {t('Prueba otra búsqueda o vuelve a ver todos los viajes.')}
            </Empty>
          ) : (
            <Empty
              icon={<CalendarRange />}
              title={t('Tu próxima ruta empieza aquí')}
              action={
                user.emailVerified ? (
                  <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus /> {t('Crear mi primer viaje')}
                  </Button>
                ) : undefined
              }
            >
              {t('Elige unas fechas, guarda destinos y organízalos día a día.')}
            </Empty>
          )}
        </section>

        {isCreateModalOpen && (
          <CreateCollectionModal
            onClose={() => setIsCreateModalOpen(false)}
            onCreate={createCollection}
          />
        )}
      </div>
    </Shell>
  );
}
