import { useMemo } from 'react';
import { getBestSeason } from '../../utils/scales';

interface Props {
  presupuesto: string;
  masificacion: string;
  tipoTurismo: string;
  ubicacion: string;
  julioAgosto: number;
  mayJunSeptOct: number;
  novAbril: number;
  municipioCount: number;
}

export default function DestinationQuickFacts({
  presupuesto,
  masificacion,
  tipoTurismo,
  ubicacion,
  julioAgosto,
  mayJunSeptOct,
  novAbril,
  municipioCount,
}: Props) {
  const best = useMemo(
    () => getBestSeason({ mesesJulioAgosto: julioAgosto, mesesMayJunSeptOct: mayJunSeptOct, mesesNovAbril: novAbril }),
    [julioAgosto, mayJunSeptOct, novAbril],
  );

  const bullets = [
    `${ubicacion} · turismo ${tipoTurismo.toLowerCase()}`,
    `Presupuesto ${presupuesto.toLowerCase()}, masificación ${masificacion.toLowerCase()}`,
    `Mejor ventana: ${best.label.toLowerCase()} (${best.value}% afluencia)`,
    municipioCount > 0
      ? `${municipioCount} municipio${municipioCount === 1 ? '' : 's'} con tip de alojamiento`
      : 'Ficha revisada a mano, sin patrocinio',
  ];

  return (
    <aside className="dest-quick" id="resumen" aria-label="Resumen en 10 segundos">
      <span className="dest-quick__eyebrow field-label">En 10 segundos</span>
      <h2 className="dest-quick__title">Lo esencial</h2>
      <ul className="dest-quick__list">
        {bullets.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <dl className="dest-quick__grid">
        <div>
          <dt className="field-label">Presupuesto</dt>
          <dd>{presupuesto}</dd>
        </div>
        <div>
          <dt className="field-label">Masificación</dt>
          <dd>{masificacion}</dd>
        </div>
        <div>
          <dt className="field-label">Mejor mes</dt>
          <dd>{best.months.split(',')[0] || best.label}</dd>
        </div>
        <div>
          <dt className="field-label">Zona</dt>
          <dd>{ubicacion}</dd>
        </div>
      </dl>
    </aside>
  );
}
