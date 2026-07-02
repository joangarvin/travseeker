import { CalendarCheck, Leaf, Snowflake, Sun, TrendingUp } from 'lucide-react';
import { getBestSeason, getWorstSeason, type SeasonalData } from '../../utils/scales';
import { getMasificationColor, getMasificationLabel } from '../../utils/masification';

const SEASON_ICONS: Record<string, typeof Sun> = {
  verano: Sun,
  media: Leaf,
  invierno: Snowflake,
};

export default function BestSeasonCard({ data }: { data: SeasonalData }) {
  const best = getBestSeason(data);
  const worst = getWorstSeason(data);
  const BestIcon = SEASON_ICONS[best.key] ?? Sun;
  const bestColor = getMasificationColor(best.value);

  return (
    <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-strong)] shadow-sm overflow-hidden">
      <div className="p-6 md:p-8 flex flex-col sm:flex-row sm:items-center gap-6">
        <div
          className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0 border border-[var(--color-border-strong)]"
          style={{ backgroundColor: `${bestColor}1f`, color: bestColor }}
        >
          <BestIcon className="w-8 h-8" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-brand-dark)] mb-1.5">
            <CalendarCheck className="w-3.5 h-3.5" />
            Mejor época para viajar
          </div>
          <h3 className="text-2xl font-semibold text-[var(--color-primary)] tracking-tight">{best.label}</h3>
          <p className="text-[var(--color-muted)]">{best.months}</p>
        </div>
        <div className="sm:text-right">
          <span
            className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full"
            style={{ backgroundColor: `${bestColor}1f`, color: bestColor }}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: bestColor }} />
            {getMasificationLabel(best.value)}
          </span>
          <p className="text-xs text-[var(--color-muted)] mt-2">{best.value}% de afluencia</p>
        </div>
      </div>
      <div className="px-6 md:px-8 py-3.5 border-t border-[var(--color-border)] flex items-center gap-2 text-sm text-[var(--color-muted)]">
        <TrendingUp className="w-4 h-4 text-[var(--color-danger)]" />
        Más concurrido en <span className="font-medium text-[var(--color-primary)]">{worst.label}</span>
        <span className="text-[var(--color-muted)]">({worst.months}) · {worst.value}%</span>
      </div>
    </div>
  );
}
