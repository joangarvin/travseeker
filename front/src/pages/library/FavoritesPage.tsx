import { useEffect, useMemo, useState } from 'react';
import { Heart, Search } from 'lucide-react';
import { PageHeading, Shell } from '../../components/layout';
import { Empty, Loader } from '../../components/ui';
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

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    api<Favorite[]>('/favoritos', {}, token)
      .then(setFavorites)
      .finally(() => setIsLoading(false));
  }, [token]);

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
      <GuestGate title="Guarda lo que te mueve">
        Marca destinos para encontrarlos después, sin volver a empezar la búsqueda.
      </GuestGate>
    );
  }

  return (
    <Shell>
      <PageHeading kicker="Tu biblioteca" title="Destinos guardados">
        <p>
          {favorites.length
            ? `${favorites.length} lugares esperando su momento.`
            : 'Aquí aparecerán los destinos que guardes.'}
        </p>
      </PageHeading>

      <section className="library-toolbar">
        <div>
          <Search />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar entre tus guardados"
            aria-label="Buscar guardados"
          />
        </div>
      </section>

      <section className="library-content">
        {isLoading ? (
          <Loader />
        ) : filteredFavorites.length ? (
          <div className="destination-list">
            {filteredFavorites.map((favorite, index) => (
              <DestinationCard key={favorite.id} destino={favorite.destino} index={index} />
            ))}
          </div>
        ) : (
          <Empty icon={<Heart />} title="Nada por aquí">
            Guarda un destino desde su ficha y volverá a aparecer aquí.
          </Empty>
        )}
      </section>
    </Shell>
  );
}
