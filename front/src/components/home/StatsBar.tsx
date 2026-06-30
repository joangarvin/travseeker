import { useEffect, useState } from 'react';
import { MapPinned, Users, Leaf, Star } from 'lucide-react';
import { destinosApi } from '../../api/destinos';
import ScrollReveal from '../ui/ScrollReveal';

export default function StatsBar() {
  const [data, setData] = useState<{ total: number; totalReviews: number; avgRating: number | null } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    destinosApi.getStats(controller.signal)
      .then((d) => setData(d))
      .catch(() => setData(null));
    return () => controller.abort();
  }, []);

  const ratingValue = data?.avgRating != null ? `${data.avgRating}/5` : 'Nuevo';

  const stats = [
    { icon: MapPinned, value: data ? `${data.total}+` : '—', label: 'Destinos curados' },
    { icon: Leaf, value: '100%', label: 'Sin turismo masivo' },
    { icon: Star, value: ratingValue, label: data?.totalReviews ? `${data.totalReviews} reseñas` : 'Valoración media' },
    { icon: Users, value: '17', label: 'Comunidades' },
  ];

  return (
    <section className="max-w-7xl mx-auto px-6 md:px-8 -mt-12 relative z-20">
      <ScrollReveal>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl p-6 md:p-8">
          {stats.map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex flex-col items-center text-center gap-2">
              <span className="w-11 h-11 rounded-xl bg-[var(--color-secondary)] flex items-center justify-center text-[var(--color-brand-dark)]">
                <Icon className="w-5 h-5" />
              </span>
              <span className="text-2xl md:text-3xl font-semibold text-[var(--color-primary)] tracking-tight">{value}</span>
              <span className="text-xs md:text-sm text-[var(--color-muted)] font-medium">{label}</span>
            </div>
          ))}
        </div>
      </ScrollReveal>
    </section>
  );
}
