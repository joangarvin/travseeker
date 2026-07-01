import AdminField from './AdminField';

interface Props {
  verano: number;
  media: number;
  baja: number;
  onChange: (key: 'mesesJulioAgosto' | 'mesesMayJunSeptOct' | 'mesesNovAbril', value: number) => void;
}

function SeasonSlider({
  label,
  months,
  value,
  onChange,
}: {
  label: string;
  months: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--color-primary)]">{label}</p>
          <p className="text-xs text-[var(--color-muted)]">{months}</p>
        </div>
        <span className="text-lg font-bold tabular-nums text-[var(--color-brand-dark)] min-w-[3ch] text-right">
          {value}%
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--color-brand)]"
      />
      <div className="flex justify-between text-[10px] text-[var(--color-muted)]">
        <span>Poco masificado</span>
        <span>Muy masificado</span>
      </div>
    </div>
  );
}

export default function SeasonPicker({ verano, media, baja, onChange }: Props) {
  return (
    <AdminField
      label="Masificación por temporada"
      hint="Desliza cada barra según lo lleno que suele estar el destino en esas fechas. No hace falta ser exacto: una estimación visual vale."
    >
      <div className="grid gap-3 sm:grid-cols-1">
        <SeasonSlider
          label="Verano"
          months="Julio y agosto"
          value={verano}
          onChange={(v) => onChange('mesesJulioAgosto', v)}
        />
        <SeasonSlider
          label="Primavera y otoño"
          months="Mayo, junio, septiembre y octubre"
          value={media}
          onChange={(v) => onChange('mesesMayJunSeptOct', v)}
        />
        <SeasonSlider
          label="Temporada baja"
          months="Noviembre a abril"
          value={baja}
          onChange={(v) => onChange('mesesNovAbril', v)}
        />
      </div>
    </AdminField>
  );
}
