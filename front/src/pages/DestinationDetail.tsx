import { useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, GitCompare } from 'lucide-react';
import { useDestinoDetail } from '../hooks/useDestinoDetail';
import DestinationHero from '../components/destinations/DestinationHero';
import QuickFactsBar from '../components/destinations/QuickFactsBar';
import MasificationChart from '../components/destinations/MasificationChart';
import BestSeasonCard from '../components/destinations/BestSeasonCard';
import MunicipioCard from '../components/destinations/MunicipioCard';
import Imprescindibles from '../components/destinations/Imprescindibles';
import ReviewSection from '../components/destinations/ReviewSection';
import RelatedDestinations from '../components/destinations/RelatedDestinations';
import Footer from '../components/layout/Footer';
import ScrollReveal from '../components/ui/ScrollReveal';
import PageLoader from '../components/ui/PageLoader';
import { parseJsonSafe } from '../utils/parseJson';

export default function DestinationDetail() {
  const { id } = useParams();
  const { destino, loading, error } = useDestinoDetail(id);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const facts = useMemo(() => {
    if (!destino) return null;
    return {
      ubicacion: parseJsonSafe(destino.ubicacion),
      presupuesto: parseJsonSafe(destino.presupuesto),
      masificacion: parseJsonSafe(destino.masificacion),
      tipoTurismo: parseJsonSafe(destino.tipoTurismoPrincipal),
    };
  }, [destino]);

  if (loading) return <PageLoader label="Cargando destino..." />;

  if (error || !destino || !facts) {
    return (
      <div className="min-h-screen bg-[var(--color-secondary)] flex flex-col items-center justify-center gap-4">
        <p className="text-[var(--color-primary)] font-semibold text-xl">{error || 'Destino no encontrado'}</p>
        <Link to="/" className="text-sm text-[var(--color-brand)] hover:underline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-secondary)] min-h-screen">
      <DestinationHero
        destinoId={destino.id}
        nombre={destino.nombre}
        imagen={destino.imagen}
        ubicacion={facts.ubicacion}
      />
      <QuickFactsBar
        presupuesto={facts.presupuesto}
        masificacion={facts.masificacion}
        tipoTurismo={facts.tipoTurismo}
      />

      <div className="max-w-5xl mx-auto px-6 md:px-8 py-16 space-y-16">
        <ScrollReveal>
          <article>
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-brand-dark)] mb-6">Sobre el destino</h2>
            <div
              className="prose-premium text-[var(--color-primary)]/80 text-lg font-light leading-relaxed"
              dangerouslySetInnerHTML={{ __html: destino.descripcion }}
            />
          </article>
        </ScrollReveal>

        <ScrollReveal delay={1}>
          <div className="space-y-6">
            <BestSeasonCard
              data={{
                mesesJulioAgosto: destino.mesesJulioAgosto,
                mesesMayJunSeptOct: destino.mesesMayJunSeptOct,
                mesesNovAbril: destino.mesesNovAbril,
              }}
            />
            <MasificationChart
              julioAgosto={destino.mesesJulioAgosto}
              mayJunSeptOct={destino.mesesMayJunSeptOct}
              novAbril={destino.mesesNovAbril}
            />
          </div>
        </ScrollReveal>

        <ScrollReveal delay={2}>
          <article className="p-6 md:p-10 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm">
            <h2 className="text-2xl font-semibold text-[var(--color-primary)] tracking-tight mb-2">Imprescindibles</h2>
            <p className="text-sm text-[var(--color-muted)] mb-8">Lo que no te puedes perder en tu visita</p>
            <Imprescindibles html={destino.imprescindibles} />
          </article>
        </ScrollReveal>

        <ScrollReveal delay={3}>
          <section>
            <h2 className="text-2xl font-semibold text-[var(--color-primary)] tracking-tight mb-2">¿Dónde alojarte?</h2>
            <p className="text-sm text-[var(--color-muted)] mb-8">Municipios recomendados con precios y conexiones</p>

            {destino.municipios?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {destino.municipios.map(mun => (
                  <MunicipioCard key={mun.id} municipio={mun} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-muted)]">
                No hay datos de municipios disponibles.
              </div>
            )}
          </section>
        </ScrollReveal>

        <ReviewSection destinoId={destino.id} />

        <ScrollReveal>
          <Link
            to={`/comparar?ids=${destino.id}`}
            className="flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm text-[var(--color-primary)] font-medium hover:border-[var(--color-brand)]/40 transition-colors"
          >
            <GitCompare className="w-5 h-5 text-[var(--color-brand-dark)]" />
            Comparar este destino con otros
          </Link>
        </ScrollReveal>

        <RelatedDestinations destinoId={destino.id} />
      </div>

      <Footer />
    </div>
  );
}
