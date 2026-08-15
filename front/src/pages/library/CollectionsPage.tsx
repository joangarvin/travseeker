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

    try {
      setError('');
      setCollections(await api<CollectionSummary[]>('/colecciones', {}, token));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudieron cargar tus viajes');
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
      setError(cause instanceof Error ? cause.message : 'No se pudo crear el viaje');
      throw cause;
    }
  };

  const visibleCollections = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('es');
    const today = new Date().toISOString().slice(0, 10);
    return collections.filter((collection) => {
      const matchesQuery =
        !normalizedQuery ||
        `${collection.nombre} ${collection.descripcion || ''}`
          .toLocaleLowerCase('es')
          .includes(normalizedQuery);
      const start = collection.startDate?.slice(0, 10);
      const matchesFilter =
        filter === 'all' ||
        (filter === 'upcoming' && Boolean(start && start >= today)) ||
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
      <GuestGate title="Convierte ideas en viajes">
        Agrupa destinos, ordénalos por días y comparte el plan con quien viaja contigo.
      </GuestGate>
    );
  }

  return (
    <Shell>
      <PageHeading
        className="trips-heading"
        kicker="Planificación"
        title="Tus viajes"
        action={
          <Button
            disabled={!user.emailVerified}
            aria-describedby={!user.emailVerified ? 'new-trip-verification-requirement' : undefined}
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus /> Nuevo viaje
          </Button>
        }
      >
        <p>Todo lo necesario para convertir una idea en una ruta compartida.</p>
      </PageHeading>

      {!user.emailVerified && (
        <p id="new-trip-verification-requirement" className="trip-verification-requirement">
          Verifica tu correo para crear un viaje nuevo. Tus viajes actuales siguen disponibles.
        </p>
      )}

      <section className="trips-toolbar" aria-label="Buscar y filtrar viajes">
        <label className="trips-search" htmlFor="trip-search">
          <Search aria-hidden="true" />
          <span className="sr-only">Buscar viajes</span>
          <input
            id="trip-search"
            type="search"
            placeholder="Buscar por nombre o descripción"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="trip-filters" aria-label="Filtrar viajes">
          {(
            [
              ['all', 'Todos'],
              ['upcoming', 'Próximos'],
              ['open', 'Sin fechas'],
              ['shared', 'Compartidos'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="collections-grid" aria-live="polite">
        {error && (
          <Notice tone="error">
            {error}.{' '}
            <button type="button" onClick={() => void loadCollections()}>
              Reintentar
            </button>
          </Notice>
        )}
        {isLoading ? (
          <Loader label="Preparando tus viajes" />
        ) : visibleCollections.length ? (
          visibleCollections.map((collection) => (
            <CollectionCover key={collection.id} collection={collection} />
          ))
        ) : collections.length ? (
          <Empty icon={<Search />} title="No hay viajes con esos filtros">
            Prueba otra búsqueda o vuelve a ver todos los viajes.
          </Empty>
        ) : (
          <Empty
            icon={<CalendarRange />}
            title="Tu próxima ruta empieza aquí"
            action={
              user.emailVerified ? (
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus /> Crear mi primer viaje
                </Button>
              ) : undefined
            }
          >
            Elige unas fechas, guarda destinos y organízalos día a día.
          </Empty>
        )}
      </section>

      {isCreateModalOpen && (
        <CreateCollectionModal
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={createCollection}
        />
      )}
    </Shell>
  );
}
