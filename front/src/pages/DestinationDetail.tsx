import { useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, GitCompare } from 'lucide-react';
import { useDestinoDetail } from '../hooks/useDestinoDetail';
import DestinationHero from '../components/destinations/DestinationHero';
import SeasonNotebook from '../components/destinations/SeasonNotebook';
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

  if (loading) return <PageLoader label="Abriendo la ficha…" />;

  if (error || !destino || !facts) {
    return (
      <div className="min-h-screen bg-[var(--color-secondary)] flex flex-col items-center justify-center gap-4 px-4">
        <p className="font-serif text-2xl text-[var(--color-primary)]">{error || 'Esta ficha no existe'}</p>
        <Link to="/" className="text-sm text-[var(--color-brand)] hover:underline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Volver al cuaderno
        </Link>
      </div>
    );
  }

  const municipios = destino.municipios ?? [];

  return (
    <div className="bg-[var(--color-secondary)] min-h-screen">
      <DestinationHero
        destinoId={destino.id}
        nombre={destino.nombre}
        imagen={destino.imagen}
        ubicacion={facts.ubicacion}
        presupuesto={facts.presupuesto}
        masificacion={facts.masificacion}
        tipoTurismo={facts.tipoTurismo}
      />

      {/* Cuerpo de ficha: lectura ancha + temporada al lado en desktop */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-10 sm:py-14 pb-24 sm:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Columna principal */}
          <div className="lg:col-span-7 space-y-12 sm:space-y-16">
            <ScrollReveal>
              <article>
                <span className="field-label text-[var(--color-teja)] mb-4 block">Notas de campo</span>
                <div
                  className="prose-premium text-[var(--color-primary)]/85 text-base sm:text-lg leading-[1.75] max-w-[38rem]"
                  dangerouslySetInnerHTML={{ __html: destino.descripcion }}
                />
              </article>
            </ScrollReveal>

            <ScrollReveal delay={1}>
              <section>
                <span className="field-label text-[var(--color-teja)] mb-2 block">Apuntes</span>
                <h2 className="font-serif text-2xl sm:text-3xl font-medium text-[var(--color-primary)] tracking-tight mb-2">
                  Imprescindibles
                </h2>
                <p className="text-sm text-[var(--color-muted)] mb-6 max-w-md">
                  Lo que no hay que perderse, apuntado por orden.
                </p>
                <Imprescindibles html={destino.imprescindibles} />
              </section>
            </ScrollReveal>
          </div>

          {/* Lateral: temporada sticky */}
          <aside className="lg:col-span-5 lg:sticky lg:top-6 space-y-6">
            <ScrollReveal delay={1}>
              <SeasonNotebook
                julioAgosto={destino.mesesJulioAgosto}
                mayJunSeptOct={destino.mesesMayJunSeptOct}
                novAbril={destino.mesesNovAbril}
              />
            </ScrollReveal>

            <ScrollReveal delay={2}>
              <Link
                to={`/comparar?ids=${destino.id}`}
                className="flex items-center justify-center gap-2.5 px-5 py-4 rounded-lg bg-[var(--color-brand)] text-[var(--color-on-brand)] font-semibold hover:bg-[var(--color-accent-hover)] transition-colors"
              >
                <GitCompare className="w-5 h-5" />
                Cara a cara con otro
              </Link>
            </ScrollReveal>
          </aside>
        </div>

        {/* Municipios a sangre de columna */}
        <ScrollReveal>
          <section className="mt-14 sm:mt-20 pt-12 sm:pt-14 border-t border-[var(--color-border-strong)]">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
              <div>
                <span className="field-label text-[var(--color-teja)] mb-2 block">Alojamiento</span>
                <h2 className="font-serif text-2xl sm:text-3xl font-medium text-[var(--color-primary)] tracking-tight">
                  Dónde dormir (y cuánto cuesta)
                </h2>
                <p className="text-sm text-[var(--color-muted)] mt-2 max-w-lg">
                  Municipios con precios reales y cómo llegar.
                </p>
              </div>
              {municipios.length > 0 && (
                <span className="field-label text-[var(--color-muted)]">
                  {municipios.length} municipio{municipios.length === 1 ? '' : 's'}
                </span>
              )}
            </div>

            {municipios.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {municipios.map((mun, i) => (
                  <MunicipioCard key={mun.id} municipio={mun} index={i} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-[var(--color-border-strong)] rounded-lg text-[var(--color-muted)] text-sm">
                Aún no hay municipios apuntados en esta ficha.
              </div>
            )}
          </section>
        </ScrollReveal>

        <div className="mt-14 sm:mt-20 pt-12 sm:pt-14 border-t border-[var(--color-border-strong)]">
          <ReviewSection destinoId={destino.id} />
        </div>

        <div className="mt-14 sm:mt-20 pt-12 sm:pt-14 border-t border-[var(--color-border-strong)]">
          <RelatedDestinations destinoId={destino.id} />
        </div>
      </div>

      <Footer />
    </div>
  );
}
