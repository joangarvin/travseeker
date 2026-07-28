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
        <div className="dest-detail__layout">
          <div className="dest-detail__main">
            <ScrollReveal>
              <article>
                <span className="dest-detail__section-eyebrow field-label">Notas de campo</span>
                <div
                  className="dest-detail__prose prose-premium"
                  dangerouslySetInnerHTML={{ __html: destino.descripcion }}
                />
              </article>
            </ScrollReveal>

            <ScrollReveal delay={1}>
              <section>
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
            <ScrollReveal delay={1}>
              <SeasonNotebook
                julioAgosto={destino.mesesJulioAgosto}
                mayJunSeptOct={destino.mesesMayJunSeptOct}
                novAbril={destino.mesesNovAbril}
              />
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
          <section className="dest-detail__divider-section">
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
              <div className="dest-detail__muni-grid">
                {municipios.map((mun, i) => (
                  <MunicipioCard key={mun.id} municipio={mun} index={i} />
                ))}
              </div>
            ) : (
              <div className="dest-detail__muni-empty">
                Aún no hay municipios apuntados en esta ficha.
              </div>
            )}
          </section>
        </ScrollReveal>

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
