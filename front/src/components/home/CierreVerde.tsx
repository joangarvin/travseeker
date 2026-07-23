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
    <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pb-16 sm:pb-24 pt-2">
      <ScrollReveal>
        <p className="field-label text-[var(--color-muted)] mb-5 sm:mb-7 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>{total} destinos revisados a mano</span>
          <span aria-hidden>·</span>
          <span>{reviews} reseñas de viajeros</span>
          <span aria-hidden>·</span>
          <span>0 puestos patrocinados</span>
        </p>
      </ScrollReveal>

      <ScrollReveal delay={1}>
        {/* Siempre verde botella + crema: no hereda el mint del tema oscuro */}
        <div className="grain relative overflow-hidden rounded-lg bg-[var(--color-brand-deep)] px-6 py-12 sm:px-12 sm:py-16">
          <div
            aria-hidden
            className="absolute bottom-0 right-0 w-14 h-14"
            style={{ background: 'var(--color-secondary)', clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }}
          />
          <div
            aria-hidden
            className="absolute bottom-0 right-0 w-14 h-14"
            style={{
              background: 'color-mix(in srgb, var(--color-brand-deep) 70%, black)',
              clipPath: 'polygon(0 0, 100% 0, 0 100%)',
            }}
          />

          <div className="relative z-10 max-w-2xl">
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium text-[var(--color-on-deep)] tracking-tight leading-[1.08] mb-4">
              Los sitios buenos se estropean cuando salen en todas partes.
            </h2>
            <p className="text-[var(--color-on-deep)]/80 text-base sm:text-lg mb-8 leading-relaxed">
              Por eso los contamos bajito. Crea tu cuenta y guárdatelos antes de que se llenen.
            </p>
            <div className="flex flex-wrap gap-3">
              {user ? (
                <Link
                  to="/favoritos"
                  className="px-5 py-3 rounded-lg bg-[var(--color-mostaza)] text-[#23281f] font-semibold text-sm hover:brightness-105 transition-all duration-150"
                >
                  Ir a tus sitios
                </Link>
              ) : (
                <Link
                  to="/auth"
                  className="px-5 py-3 rounded-lg bg-[var(--color-mostaza)] text-[#23281f] font-semibold text-sm hover:brightness-105 transition-all duration-150"
                >
                  Crear cuenta gratis
                </Link>
              )}
              <a
                href="#destinos"
                className="px-5 py-3 rounded-lg border border-[var(--color-on-deep)]/35 text-[var(--color-on-deep)] font-medium text-sm hover:bg-[var(--color-on-deep)]/10 transition-colors duration-150"
              >
                Seguir mirando
              </a>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
