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

/**
 * Una sola ficha de temporada: mejor época + aforo por franja.
 * Sustituye el dúo BestSeasonCard + MasificationChart.
 */
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
    <section className="ui-card overflow-hidden">
      <div className="p-5 sm:p-7 border-b border-[var(--color-border)] bg-[var(--color-surface-2)]/50">
        <span className="field-label text-[var(--color-teja)] mb-2 block">Temporada</span>
        <h2 className="font-serif text-2xl sm:text-3xl font-medium text-[var(--color-primary)] tracking-tight mb-2">
          Cuándo ir (y cuándo no)
        </h2>
        <p className="text-[var(--color-muted)] text-sm sm:text-base leading-relaxed max-w-xl">
          Mejor ventana: <span className="text-[var(--color-primary)] font-medium">{best.label}</span>
          {' '}({best.months}) · {getMasificationLabel(best.value)} al {best.value}%.
          Evita {worst.label.toLowerCase()} si puedes ({worst.value}%).
        </p>
      </div>

      <div className="p-5 sm:p-7 space-y-5">
        {ROWS.map(({ key, label, full }, i) => {
          const value = values[key];
          const color = getMasificationColor(value);
          const isBest = best.key === key;
          return (
            <div key={key} className="space-y-2">
              <div className="flex justify-between items-baseline gap-3">
                <div className="min-w-0">
                  <span className={`field-label ${isBest ? 'text-[var(--color-brand-dark)]' : 'text-[var(--color-muted)]'}`}>
                    {label}
                    {isBest && ' · mejor'}
                  </span>
                  <p className="text-xs text-[var(--color-muted)]/70 mt-0.5 hidden sm:block">{full}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono text-sm font-medium text-[var(--color-primary)]">{value}%</span>
                  <span className="field-label text-[var(--color-muted)] ml-2" style={{ fontSize: '0.6rem' }}>
                    {getMasificationLabel(value)}
                  </span>
                </div>
              </div>
              <div className="h-2 rounded-sm bg-[var(--color-surface-2)] overflow-hidden">
                <div
                  className="h-full rounded-sm transition-all duration-700 ease-out"
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
