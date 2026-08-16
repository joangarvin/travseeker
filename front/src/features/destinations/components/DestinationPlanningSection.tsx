import { BedDouble, Check, ExternalLink, MapPin } from 'lucide-react';
import { BudgetEstimator } from '../../../components/BudgetEstimator';
import { FormattedContent } from '../../../components/FormattedContent';
import { Button } from '../../../components/ui';
import type { Destino } from '../../../types';
import { excerptAtWord, openStreetMapUrl, plain, validCoordinates } from '../../../utils';

interface DestinationPlanningSectionProps {
  destination: Destino;
  selectedMunicipioId?: string;
  alternativesExpanded: boolean;
  onSelectMunicipio: (municipioId: string) => void;
  onToggleAlternatives: () => void;
}

export function DestinationPlanningSection({
  destination,
  selectedMunicipioId,
  alternativesExpanded,
  onSelectMunicipio,
  onToggleAlternatives,
}: DestinationPlanningSectionProps) {
  const municipios = destination.municipios || [];
  if (!municipios.length) return null;

  const selectedBase =
    municipios.find((municipio) => municipio.id === selectedMunicipioId) || municipios[0];
  const alternatives = municipios.filter((municipio) => municipio.id !== selectedBase.id);
  const visibleAlternatives = alternativesExpanded ? alternatives : alternatives.slice(0, 3);
  const coordinates = validCoordinates(selectedBase.latitud, selectedBase.longitud);

  return (
    <section id="bases" className="municipalities" aria-labelledby="bases-title">
      <div className="destination-section-heading">
        <p className="kicker">Dónde hacer base</p>
        <h2 id="bases-title">Elige una base práctica</h2>
        <p>
          Compara el coste orientativo y las conexiones. La base elegida se aplica al cálculo de
          presupuesto.
        </p>
      </div>
      <div className="planning-workbench">
        <div className="municipalities__chooser">
          <label htmlFor="destination-base-selector">Base del viaje</label>
          <select
            id="destination-base-selector"
            value={selectedBase.id}
            onChange={(event) => onSelectMunicipio(event.target.value)}
          >
            {municipios.map((municipio) => (
              <option key={municipio.id} value={municipio.id}>
                {municipio.nombre}
              </option>
            ))}
          </select>
        </div>

        <article className="municipalities__selected-base">
          <div className="municipalities__selected-heading">
            <div>
              <p>
                <Check aria-hidden="true" /> Base seleccionada
              </p>
              <h3>{selectedBase.nombre}</h3>
            </div>
            {coordinates && (
              <a href={openStreetMapUrl(coordinates, 14)} target="_blank" rel="noreferrer">
                Ver en el mapa <ExternalLink aria-hidden="true" />
              </a>
            )}
          </div>
          <dl>
            <div>
              <dt>
                <BedDouble aria-hidden="true" /> Precio orientativo/noche
              </dt>
              <dd>
                {plain(selectedBase.precios) ? (
                  <FormattedContent content={selectedBase.precios} asPlaintext />
                ) : (
                  'Sin precio publicado'
                )}
              </dd>
            </div>
            <div>
              <dt>
                <MapPin aria-hidden="true" /> Conexiones
              </dt>
              <dd>
                {plain(selectedBase.conexiones) ? (
                  <FormattedContent content={selectedBase.conexiones} asPlaintext />
                ) : (
                  'Sin detalle de conexiones'
                )}
              </dd>
            </div>
          </dl>
        </article>

        {!!visibleAlternatives.length && (
          <div className="municipalities__alternatives">
            <p>Otras bases</p>
            <ul>
              {visibleAlternatives.map((municipio) => (
                <li key={municipio.id}>
                  <button type="button" onClick={() => onSelectMunicipio(municipio.id)}>
                    <span>{municipio.nombre}</span>
                    <small>
                      {excerptAtWord(plain(municipio.precios), 62) || 'Precio por confirmar'}
                    </small>
                    <span aria-hidden="true">Elegir</span>
                  </button>
                </li>
              ))}
            </ul>
            {alternatives.length > 3 && (
              <Button variant="secondary" onClick={onToggleAlternatives}>
                {alternativesExpanded
                  ? 'Ver menos bases'
                  : `Ver las ${alternatives.length} alternativas`}
              </Button>
            )}
          </div>
        )}

        <BudgetEstimator
          municipios={municipios}
          defaultMunicipioId={selectedMunicipioId}
          showMunicipioControl={false}
        />
      </div>
    </section>
  );
}
