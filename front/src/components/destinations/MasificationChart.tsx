import { getMasificationColor, getMasificationLabel } from '../../utils/masification';
import { getBestSeason } from '../../utils/scales';

interface BarProps {
  label: string;
  value: number;
  delay?: number;
  highlight?: boolean;
}

function Bar({ label, value, delay = 0, highlight = false }: BarProps) {
  const color = getMasificationColor(value);

  return (
    <div className={`masif-bar ${highlight ? 'is-highlight' : ''}`}>
      <div className="masif-bar__head">
        <span className="masif-bar__label">
          {label}
          {highlight && (
            <span className="masif-bar__label-hint">
              · Mejor época
            </span>
          )}
        </span>
        <div className="masif-bar__values">
          <span className="masif-bar__pct">{value}%</span>
          <span className="masif-bar__tag">{getMasificationLabel(value)}</span>
        </div>
      </div>
      <div className="masif-bar__track">
        <div
          className="masif-bar__fill"
          style={{ width: `${value}%`, backgroundColor: color, transitionDelay: `${delay}ms` }}
        />
      </div>
    </div>
  );
}

interface Props {
  julioAgosto: number;
  mayJunSeptOct: number;
  novAbril: number;
}

export default function MasificationChart({ julioAgosto, mayJunSeptOct, novAbril }: Props) {
  const best = getBestSeason({ mesesJulioAgosto: julioAgosto, mesesMayJunSeptOct: mayJunSeptOct, mesesNovAbril: novAbril });

  return (
    <div className="ui-card masif-chart">
      <div>
        <h2 className="masif-chart__title">Cuándo ir (y cuándo no)</h2>
        <p className="masif-chart__lead">Cuánta gente te vas a encontrar según la época.</p>
      </div>
      <div className="masif-chart__bars">
        <Bar label="Julio y Agosto" value={julioAgosto} delay={100} highlight={best.key === 'verano'} />
        <Bar label="Mayo, Junio, Septiembre y Octubre" value={mayJunSeptOct} delay={200} highlight={best.key === 'media'} />
        <Bar label="Noviembre — Abril" value={novAbril} delay={300} highlight={best.key === 'invierno'} />
      </div>
    </div>
  );
}
