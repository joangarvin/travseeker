import { Link, useParams } from 'react-router-dom';
import { Compass, FolderHeart } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import PageLoader from '../components/ui/PageLoader';
import DestinationCard from '../components/destinations/DestinationCard';
import { useAbortableFetch } from '../hooks/useAbortableFetch';
import { getPublicCollection } from '../api/collections';
import { colorHex } from '../constants/collectionColors';
import type { PublicCollection as PublicCollectionData } from '../types/collection';

export default function PublicCollection() {
  const { shareToken } = useParams();
  const { data, loading, error } = useAbortableFetch<PublicCollectionData>(
    (signal) => getPublicCollection(shareToken as string, signal),
    [shareToken],
    { enabled: !!shareToken },
  );

  if (loading) return <PageLoader label="Abriendo viaje…" />;
  if (error || !data) {
    return <div className="page-shell"><Header /><main className="page-guest"><div className="ui-card page-guest__card"><Compass className="page-guest__icon" /><h1 className="page-guest__title">Este viaje ya no está disponible</h1><Link to="/" className="btn-cta">Descubrir destinos</Link></div></main><Footer /></div>;
  }

  return (
    <div className="page-shell">
      <Header />
      <main className="page-wrap">
        <section className="page-section">
          <span className="field-label" style={{ color: colorHex(data.color) }}><FolderHeart className="icon-sm" /> Viaje compartido</span>
          <h1 className="page-hero__title">{data.nombre}</h1>
          {data.descripcion && <p className="page-hero__description">{data.descripcion}</p>}
          {data.items.length ? <div className="colecciones-grid">{data.items.map((item, index) => <DestinationCard key={item.id} destino={item.destino} index={index} />)}</div> : <p>Aún no hay destinos en este viaje.</p>}
        </section>
      </main>
      <Footer />
    </div>
  );
}
