import { t } from '../../i18n';
import { useEffect, useMemo, useState } from 'react';
import { Heart, Search } from 'lucide-react';
import { PageHeading, Shell } from '../../components/layout';
import { Empty, Loader, Notice } from '../../components/ui';
import { useAuth } from '../../contexts';
import { GuestGate } from '../../features/auth/components/GuestGate';
import { DestinationCard } from '../../features/destinations/components/DestinationCard';
import { api } from '../../services/api';
import type { Destino } from '../../types';

type Favorite = {
  id: string;
  createdAt: string;
  destino: Destino;
};

export default function FavoritesPage() {
  const { user, token, loading: isAuthLoading } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');
    api<Favorite[]>('/favoritos', {}, token)
      .then(setFavorites)
      .catch((cause) =>
        setError(cause instanceof Error ? cause.message : t('No se pudieron cargar tus guardados')),
      )
      .finally(() => setIsLoading(false));
  }, [token, retry]);

  const filteredFavorites = useMemo(
    () =>
      favorites.filter((favorite) =>
        favorite.destino.nombre.toLowerCase().includes(query.toLowerCase()),
      ),
    [favorites, query],
  );

  if (isAuthLoading) {
    return (
      <Shell>
        <Loader />
      </Shell>
    );
  }

  if (!user) {
    return (
      <GuestGate title={t('Guarda lo que te mueve')}>
        {t('Marca destinos para encontrarlos después, sin volver a empezar la búsqueda.')}
      </GuestGate>
    );
  }

  return (
    <Shell>
      <PageHeading kicker={t('Tu biblioteca')} title={t('Destinos guardados')}>
        <p>
          {favorites.length
            ? t('{0} lugares esperando su momento.', { 0: favorites.length })
            : t('Aquí aparecerán los destinos que guardes.')}
        </p>
      </PageHeading>

      <section className="library-toolbar">
        <div>
          <Search />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('Buscar entre tus guardados')}
            aria-label={t('Buscar guardados')}
          />
        </div>
      </section>

      <section className="library-content">
        {error && (
          <Notice tone="error">
            {error}
            <button
              type="button"
              className="button button--quiet"
              onClick={() => setRetry((value) => value + 1)}
            >
              {t('Reintentar')}
            </button>
          </Notice>
        )}
        {isLoading ? (
          <Loader />
        ) : filteredFavorites.length ? (
          <div className="destination-list">
            {filteredFavorites.map((favorite, index) => (
              <DestinationCard key={favorite.id} destino={favorite.destino} index={index} />
            ))}
          </div>
        ) : (
          <Empty
            icon={<Heart />}
            title={
              favorites.length ? t('No hay coincidencias') : t('Aún no tienes destinos guardados')
            }
            action={
              favorites.length ? (
                <button type="button" className="button" onClick={() => setQuery('')}>
                  {t('Limpiar búsqueda')}
                </button>
              ) : (
                <a className="button" href="/">
                  {t('Explorar destinos')}
                </a>
              )
            }
          >
            {favorites.length
              ? t('Prueba otro nombre o limpia la búsqueda.')
              : t('Guarda un destino desde su ficha y volverá a aparecer aquí.')}
          </Empty>
        )}
      </section>
    </Shell>
  );
}
