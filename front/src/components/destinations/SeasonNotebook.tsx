import { getMasificationColor, getMasificationLabel } from '../../utils/masification';
import { getBestSeason, getWorstSeason } from '../../utils/scales';

interface Props {
  julioAgosto: number;
  mayJunSeptOct: number;
  novAbril: number;
}

const ROWS = [
  { key: 'verano' as const, label: 'Jul — Ago', full: 'Julio y agosto' },
  { key: 'media' as const, label: 'May — Jun · Sep — Oct', full: 'Mayo, junio, septiembre y octubre' },
  { key: 'invierno' as const, label: 'Nov — Abr', full: 'Noviembre a abril' },
];

export default function SeasonNotebook({ julioAgosto, mayJunSeptOct, novAbril }: Props) {
  const data = {
    mesesJulioAgosto: julioAgosto,
    mesesMayJunSeptOct: mayJunSeptOct,
    mesesNovAbril: novAbril,
  };
  const best = getBestSeason(data);
  const worst = getWorstSeason(data);
  const values = { verano: julioAgosto, media: mayJunSeptOct, invierno: novAbril };

  return (
    <section className="ui-card" style={{ overflow: 'hidden' }}>
      <div className="season-card__head">
        <span className="season-card__eyebrow field-label">Temporada</span>
        <h2 className="season-card__title">
          Cuándo ir (y cuándo no)
        </h2>
        <p className="season-card__summary">
          Mejor ventana: <span className="is-highlight">{best.label}</span>
          {' '}({best.months}) · {getMasificationLabel(best.value)} al {best.value}%.
          Evita {worst.label.toLowerCase()} si puedes ({worst.value}%).
        </p>
      </div>

      <div className="season-card__body">
        {ROWS.map(({ key, label, full }, i) => {
          const value = values[key];
          const color = getMasificationColor(value);
          const isBest = best.key === key;
          return (
            <div key={key}>
              <div className="season-row__head">
                <div className={`season-row__label ${isBest ? 'is-best' : ''}`}>
                  <span className="field-label">
                    {label}
                    {isBest && ' · mejor'}
                  </span>
                  <p className="season-row__full">{full}</p>
                </div>
                <div className="season-row__stats">
                  <span className="season-row__pct">{value}%</span>
                  <span className="season-row__tag field-label">
                    {getMasificationLabel(value)}
                  </span>
                </div>
              </div>
              <div className="season-row__bar">
                <div
                  className="season-row__fill"
                  style={{
                    width: `${value}%`,
                    backgroundColor: color,
                    transitionDelay: `${i * 80}ms`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
