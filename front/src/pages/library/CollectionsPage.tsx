import { useEffect, useState } from 'react';
import { FolderHeart, Plus } from 'lucide-react';
import { PageHeading, Shell } from '../../components/layout';
import { Button, Empty, Loader } from '../../components/ui';
import { useAuth } from '../../contexts';
import { GuestGate } from '../../features/auth/components/GuestGate';
import { CollectionCover } from '../../features/collections/components/CollectionCover';
import { CreateCollectionModal } from '../../features/collections/components/CreateCollectionModal';
import { api } from '../../services/api';
import type { CollectionSummary } from '../../types';

export default function CollectionsPage() {
  const { user, token, loading: isAuthLoading } = useAuth();
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadCollections = async () => {
    if (!token) return;

    try {
      setCollections(await api<CollectionSummary[]>('/colecciones', {}, token));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadCollections();
  }, [token]);

  const createCollection = async (name: string, description: string) => {
    if (!token) return;

    await api(
      '/colecciones',
      {
        method: 'POST',
        body: JSON.stringify({ nombre: name, descripcion: description, color: 'cobalt' }),
      },
      token,
    );
    await loadCollections();
  };

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
        kicker="Planificación"
        title="Tus viajes"
        action={
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus /> Nuevo viaje
          </Button>
        }
      >
        <p>De una primera idea a un itinerario que puedes compartir.</p>
      </PageHeading>

      <section className="collections-grid">
        {isLoading ? (
          <Loader />
        ) : collections.length ? (
          collections.map((collection) => (
            <CollectionCover key={collection.id} collection={collection} />
          ))
        ) : (
          <Empty icon={<FolderHeart />} title="Empieza un viaje">
            Crea una colección y añade destinos desde cualquier ficha.
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
