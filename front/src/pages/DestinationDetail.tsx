import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, GitCompare } from 'lucide-react';
import { useDestinoDetail } from '../hooks/useDestinoDetail';
import DestinationHero from '../components/destinations/DestinationHero';
import SeasonNotebook from '../components/destinations/SeasonNotebook';
import MunicipioCard from '../components/destinations/MunicipioCard';
import Imprescindibles from '../components/destinations/Imprescindibles';
import ReviewSection from '../components/destinations/ReviewSection';
import RelatedDestinations from '../components/destinations/RelatedDestinations';
import DestinationQuickFacts from '../components/destinations/DestinationQuickFacts';
import Footer from '../components/layout/Footer';
import ScrollReveal from '../components/ui/ScrollReveal';
import PageLoader from '../components/ui/PageLoader';
import { parseJsonSafe } from '../utils/parseJson';
import NearbyPlaces from '../components/destinations/NearbyPlaces';

const MUNI_PREVIEW = 6;

const TOC = [
  { href: '#resumen', label: 'Resumen' },
  { href: '#notas', label: 'Notas' },
  { href: '#imprescindibles', label: 'Imprescindibles' },
  { href: '#cuando-ir', label: 'Cuándo ir' },
  { href: '#dormir', label: 'Dónde dormir' },
  { href: '#cerca', label: 'Cerca' },
  { href: '#resenas', label: 'Firmas' },
] as const;

export default function DestinationDetail() {
  const { id } = useParams();
  const { destino, loading, error } = useDestinoDetail(id);
  const [showAllMunis, setShowAllMunis] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setShowAllMunis(false);
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
      <div className="dest-detail-error">
        <p className="dest-detail-error__title">{error || 'Esta ficha no existe'}</p>
        <Link to="/" className="dest-detail-error__link">
          <ArrowLeft className="icon-sm" />
          Volver al cuaderno
        </Link>
      </div>
    );
  }

  const municipios = destino.municipios ?? [];
  const visibleMunis = showAllMunis ? municipios : municipios.slice(0, MUNI_PREVIEW);
  const hasMoreMunis = municipios.length > MUNI_PREVIEW;

  return (
    <div className="dest-detail">
      <DestinationHero
        destinoId={destino.id}
        nombre={destino.nombre}
        imagen={destino.imagen}
        ubicacion={facts.ubicacion}
        presupuesto={facts.presupuesto}
        masificacion={facts.masificacion}
        tipoTurismo={facts.tipoTurismo}
      />

      <div className="dest-detail__body">
        <nav className="dest-detail__toc" aria-label="En esta ficha">
          {TOC.map((item) => (
            <a key={item.href} href={item.href} className="dest-detail__toc-link">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="dest-detail__layout">
          <div className="dest-detail__main">
            <ScrollReveal>
              <article id="notas">
                <span className="dest-detail__section-eyebrow field-label">Notas de campo</span>
                <div
                  className="dest-detail__prose prose-premium"
                  dangerouslySetInnerHTML={{ __html: destino.descripcion }}
                />
              </article>
            </ScrollReveal>

            <ScrollReveal delay={1}>
              <section id="imprescindibles">
                <span className="dest-detail__block-eyebrow field-label">Apuntes</span>
                <h2 className="dest-detail__block-title">
                  Imprescindibles
                </h2>
                <p className="dest-detail__block-lead">
                  Lo que no hay que perderse, apuntado por orden.
                </p>
                <Imprescindibles html={destino.imprescindibles} />
              </section>
            </ScrollReveal>
          </div>

          <aside className="dest-detail__aside">
            <ScrollReveal>
              <DestinationQuickFacts
                presupuesto={facts.presupuesto}
                masificacion={facts.masificacion}
                tipoTurismo={facts.tipoTurismo}
                ubicacion={facts.ubicacion}
                julioAgosto={destino.mesesJulioAgosto}
                mayJunSeptOct={destino.mesesMayJunSeptOct}
                novAbril={destino.mesesNovAbril}
                municipioCount={municipios.length}
              />
            </ScrollReveal>

            <ScrollReveal delay={1}>
              <div id="cuando-ir">
                <SeasonNotebook
                  julioAgosto={destino.mesesJulioAgosto}
                  mayJunSeptOct={destino.mesesMayJunSeptOct}
                  novAbril={destino.mesesNovAbril}
                />
              </div>
            </ScrollReveal>

            <ScrollReveal delay={2}>
              <Link to={`/comparar?ids=${destino.id}`} className="dest-detail__compare-cta">
                <GitCompare className="icon-md" />
                Cara a cara con otro
              </Link>
            </ScrollReveal>
          </aside>
        </div>

        <ScrollReveal>
          <section id="dormir" className="dest-detail__divider-section">
            <div className="dest-detail__section-head">
              <div>
                <span className="dest-detail__section-head-eyebrow field-label">Alojamiento</span>
                <h2 className="dest-detail__section-head-title">
                  Dónde dormir (y cuánto cuesta)
                </h2>
                <p className="dest-detail__section-head-lead">
                  Municipios con precios reales y cómo llegar.
                </p>
              </div>
              {municipios.length > 0 && (
                <span className="field-label" style={{ color: 'var(--color-muted)' }}>
                  {municipios.length} municipio{municipios.length === 1 ? '' : 's'}
                </span>
              )}
            </div>

            {municipios.length > 0 ? (
              <>
                <div className="dest-detail__muni-grid">
                  {visibleMunis.map((mun, i) => (
                    <MunicipioCard key={mun.id} municipio={mun} index={i} />
                  ))}
                </div>
                {hasMoreMunis && (
                  <button
                    type="button"
                    className="dest-detail__muni-more"
                    onClick={() => setShowAllMunis((v) => !v)}
                  >
                    {showAllMunis
                      ? 'Ver menos'
                      : `Mostrar ${municipios.length - MUNI_PREVIEW} más`}
                  </button>
                )}
              </>
            ) : (
              <div className="dest-detail__muni-empty">
                Aún no hay municipios apuntados en esta ficha.
              </div>
            )}
          </section>
        </ScrollReveal>

        <ScrollReveal><NearbyPlaces places={destino.places ?? []} center={destino.latitud != null && destino.longitud != null ? [destino.latitud, destino.longitud] : undefined} /></ScrollReveal>

        <div className="dest-detail__divider-section">
          <ReviewSection destinoId={destino.id} />
        </div>

        <div className="dest-detail__divider-section">
          <RelatedDestinations destinoId={destino.id} />
        </div>
      </div>

      <Footer />
    </div>
  );
}
