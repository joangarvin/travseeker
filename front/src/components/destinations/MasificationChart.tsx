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
    <div
      className={`space-y-3 rounded-xl transition-colors ${
        highlight ? 'p-4 -mx-1 bg-[var(--color-brand)]/8 border border-[var(--color-brand)]/25' : ''
      }`}
    >
      <div className="flex justify-between items-end gap-3">
        <span className="text-xs font-semibold tracking-widest text-[var(--color-primary)] uppercase">
          {label}
          {highlight && (
            <span className="ml-2 normal-case tracking-normal text-[var(--color-brand-dark)] font-bold">
              · Mejor época
            </span>
          )}
        </span>
        <div className="text-right shrink-0">
          <span className="text-sm font-semibold text-[var(--color-primary)]">{value}%</span>
          <span className="text-xs text-[var(--color-muted)] ml-2">{getMasificationLabel(value)}</span>
        </div>
      </div>
      <div className="w-full h-2.5 bg-[var(--color-primary)]/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
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
    <div className="space-y-8 p-6 md:p-8 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-strong)] shadow-sm">
      <div>
        <h2 className="text-xl font-semibold text-[var(--color-primary)] tracking-tight mb-1">Masificación</h2>
        <p className="text-sm text-[var(--color-muted)]">Nivel de afluencia turística según la época del año</p>
      </div>
      <div className="space-y-7">
        <Bar label="Julio y Agosto" value={julioAgosto} delay={100} highlight={best.key === 'verano'} />
        <Bar label="Mayo, Junio, Septiembre y Octubre" value={mayJunSeptOct} delay={200} highlight={best.key === 'media'} />
        <Bar label="Noviembre — Abril" value={novAbril} delay={300} highlight={best.key === 'invierno'} />
      </div>
    </div>
  );
}
