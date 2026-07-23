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
    <div className="ui-card overflow-hidden">
      <div className="p-5 sm:p-6 flex flex-col gap-5">
        <div className="flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-lg flex items-center justify-center shrink-0 border border-[var(--color-border-strong)]"
            style={{ backgroundColor: `${bestColor}22`, color: bestColor }}
          >
            <BestIcon className="w-7 h-7" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="field-label text-[var(--color-teja)] mb-1.5 flex items-center gap-1.5">
              <CalendarCheck className="w-3.5 h-3.5" />
              Cuándo ir
            </div>
            <h3 className="font-serif text-xl sm:text-2xl font-medium text-[var(--color-primary)] tracking-tight">{best.label}</h3>
            <p className="text-sm text-[var(--color-muted)]">{best.months}</p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span
            className="inline-flex items-center gap-1.5 text-sm font-semibold px-2.5 py-1 rounded-md"
            style={{ backgroundColor: `${bestColor}22`, color: bestColor }}
          >
            <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: bestColor }} />
            {getMasificationLabel(best.value)}
          </span>
          <span className="field-label text-[var(--color-muted)]">{best.value}% aforo</span>
        </div>
      </div>
      <div className="px-5 sm:px-6 py-3 border-t border-[var(--color-border)] flex items-center gap-2 text-sm text-[var(--color-muted)]">
        <TrendingUp className="w-4 h-4 text-[var(--color-teja)] shrink-0" />
        Más concurrido en <span className="font-medium text-[var(--color-primary)]">{worst.label}</span>
        <span>({worst.months}) · {worst.value}%</span>
      </div>
    </div>
  );
}
