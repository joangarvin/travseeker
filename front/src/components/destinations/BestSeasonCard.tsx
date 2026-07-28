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
    <div className="ui-card best-season-card">
      <div className="best-season-card__body">
        <div className="best-season-card__main">
          <div
            className="best-season-card__icon-wrap"
            style={{ backgroundColor: `${bestColor}22`, color: bestColor }}
          >
            <BestIcon className="best-season-card__icon" />
          </div>
          <div className="best-season-card__content">
            <div className="best-season-card__eyebrow field-label">
              <CalendarCheck className="icon-sm" />
              Cuándo ir
            </div>
            <h3 className="best-season-card__season">{best.label}</h3>
            <p className="best-season-card__months">{best.months}</p>
          </div>
        </div>
        <div className="best-season-card__stats">
          <span
            className="best-season-card__badge"
            style={{ backgroundColor: `${bestColor}22`, color: bestColor }}
          >
            <span className="best-season-card__badge-dot" style={{ backgroundColor: bestColor }} />
            {getMasificationLabel(best.value)}
          </span>
          <span className="best-season-card__aforo field-label">{best.value}% aforo</span>
        </div>
      </div>
      <div className="best-season-card__footer">
        <TrendingUp className="best-season-card__footer-icon" />
        Más concurrido en <span className="best-season-card__footer-strong">{worst.label}</span>
        <span>({worst.months}) · {worst.value}%</span>
      </div>
    </div>
  );
}
