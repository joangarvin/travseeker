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
    <div className="admin-season">
      <div className="admin-season__head">
        <div>
          <p className="admin-season__label">{label}</p>
          <p className="admin-season__months">{months}</p>
        </div>
        <span className="admin-season__value">{value}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="admin-season__range"
      />
      <div className="admin-season__scale">
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
      <div className="admin-season-grid">
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
