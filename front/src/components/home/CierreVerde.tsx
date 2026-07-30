import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { destinosApi } from '../../api/destinos';
import { useAuth } from '../../context/AuthContext';
import ScrollReveal from '../ui/ScrollReveal';

export default function CierreVerde() {
  const { user } = useAuth();
  const [data, setData] = useState<{ total: number; totalReviews: number } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    destinosApi.getStats(controller.signal)
      .then((d) => setData(d))
      .catch(() => setData(null));
    return () => controller.abort();
  }, []);

  const total = data?.total ?? 77;
  const reviews = data?.totalReviews ?? 0;

  return (
    <section className="cierre-verde-wrap">
      <ScrollReveal>
        <p className="cierre-verde__stats field-label">
          <span>{total} destinos revisados a mano</span>
          <span aria-hidden>·</span>
          <span>
            {reviews > 0
              ? `${reviews} reseñas de viajeros`
              : 'Fichas editoriales, sin algoritmo de reseñas'}
          </span>
          <span aria-hidden>·</span>
          <span>0 puestos patrocinados</span>
        </p>
      </ScrollReveal>

      <ScrollReveal delay={1}>
        <div className="cierre-verde__banner">
          <div aria-hidden className="cierre-verde__fold cierre-verde__fold--light" />
          <div aria-hidden className="cierre-verde__fold cierre-verde__fold--dark" />

          <div className="cierre-verde__inner">
            <h2 className="cierre-verde__title">
              Los sitios buenos se estropean cuando salen en todas partes.
            </h2>
            <p className="cierre-verde__text">
              Por eso los contamos bajito. Crea tu cuenta y guárdatelos antes de que se llenen.
            </p>
            <div className="cierre-verde__actions">
              {user ? (
                <Link to="/favoritos" className="btn-mustard">
                  Ir a tus sitios
                </Link>
              ) : (
                <Link to="/auth" className="btn-mustard">
                  Crear cuenta gratis
                </Link>
              )}
              <a href="#destinos" className="btn-outline-on-deep">
                Seguir mirando
              </a>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
