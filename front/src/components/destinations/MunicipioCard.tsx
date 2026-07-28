import type { Municipio } from '../../types';

interface Props {
  municipio: Municipio;
  index?: number;
}

export default function MunicipioCard({ municipio, index = 0 }: Props) {
  const num = String(index + 1).padStart(2, '0');

  return (
    <article className="ui-card muni-card">
      <span className="muni-card__num">{num}</span>
      <div className="muni-card__body">
        <div className="muni-card__head">
          <h3 className="muni-card__name">
            {municipio.nombre}
          </h3>
          {municipio.precios && (
            <span className="muni-card__price field-label">
              {municipio.precios.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}
            </span>
          )}
        </div>

        {municipio.tipoTurismo && (
          <div className="muni-card__field">
            <span className="muni-card__field-label field-label">Plan</span>
            <span
              className="muni-card__field-text"
              dangerouslySetInnerHTML={{ __html: municipio.tipoTurismo }}
            />
          </div>
        )}

        {municipio.conexiones && (
          <div>
            <span className="muni-card__field-label field-label">Cómo llegar</span>
            <span
              className="muni-card__field-text"
              dangerouslySetInnerHTML={{ __html: municipio.conexiones }}
            />
          </div>
        )}
      </div>
    </article>
  );
}
