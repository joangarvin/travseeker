import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import type { SearchFilters } from '../../types';
import { TourismMultiSelect } from '../tourism/TourismMultiSelect';
import { tourismQueryValue, tourismValues } from '../tourism/tourism';
import { ActivityMultiSelect } from '../activities/ActivityMultiSelect';
import { activityQueryValue, activityValues } from '../activities/activities';

type HomeFilterPanelProps = {
  filters: SearchFilters;
  isOpen: boolean;
  activeCount: number;
  locations: string[];
  activities: string[];
  onToggle: () => void;
  onUpdate: (key: keyof SearchFilters, value: string) => void;
  onClear: () => void;
  onApply: () => void;
  loading?: boolean;
};

const months = Array.from({ length: 12 }, (_, index) => String(index + 1));
const budgetOptions = ['Bajo', 'Medio-Bajo', 'Medio', 'Medio-Alto', 'Alto'];
const crowdOptions = ['Bajo', 'Medio-Bajo', 'Medio', 'Medio-Alto', 'Alto'];

export function HomeFilterPanel({
  filters,
  isOpen,
  activeCount,
  locations,
  activities,
  onToggle,
  onUpdate,
  onClear,
  onApply,
  loading = false,
}: HomeFilterPanelProps) {
  return (
    <div className="home-filter-control">
      <button
        id="home-filter-trigger"
        className={`filter-trigger ${isOpen ? 'is-open' : ''}`}
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls="home-filter-panel"
      >
        <span className="filter-trigger__icon" aria-hidden>
          <SlidersHorizontal />
        </span>
        <span>Afinar búsqueda</span>
        {activeCount > 0 && (
          <b aria-label={`${activeCount} filtros activos`}>
            {activeCount} {activeCount === 1 ? 'filtro' : 'filtros'}
          </b>
        )}
        <ChevronDown className="filter-trigger__chevron" aria-hidden />
      </button>

      {isOpen && (
        <form
          id="home-filter-panel"
          className="home-filter-panel"
          aria-labelledby="home-filter-trigger"
          onSubmit={(event) => {
            event.preventDefault();
            onApply();
          }}
        >
          <div className="home-filter-panel__heading">
            <span>Preferencias de viaje</span>
            <p>Ajusta solo lo que condiciona tu decisión.</p>
          </div>

          <div className="home-filter-panel__grid">
            <label>
              Mes
              <select
                value={filters.month || ''}
                onChange={(event) => onUpdate('month', event.target.value)}
              >
                <option value="">Cualquier momento</option>
                {months.map((month) => (
                  <option key={month} value={month}>
                    {new Date(2026, Number(month) - 1).toLocaleString('es', { month: 'long' })}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Presupuesto
              <select
                value={filters.presupuesto || ''}
                onChange={(event) => onUpdate('presupuesto', event.target.value)}
              >
                <option value="">Cualquiera</option>
                {budgetOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>

            <label>
              Masificación
              <select
                value={filters.masificacion || ''}
                onChange={(event) => onUpdate('masificacion', event.target.value)}
              >
                <option value="">Cualquiera</option>
                {crowdOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>

            <label>
              Ubicación
              <select
                value={filters.ubicacion || ''}
                onChange={(event) => onUpdate('ubicacion', event.target.value)}
              >
                <option value="">Cualquiera</option>
                {locations.map((location) => (
                  <option key={location}>{location}</option>
                ))}
              </select>
            </label>

            <div className="home-filter-panel__tourism">
              <TourismMultiSelect
                id="home-tourism-types"
                label="Tipos de viaje"
                value={tourismValues(filters.tipoTurismo)}
                hint="Puedes combinar varias opciones. Mostraremos destinos que coincidan con cualquiera."
                compact
                onChange={(values) => onUpdate('tipoTurismo', tourismQueryValue(values))}
              />
            </div>

            <div className="home-filter-panel__activities">
              <ActivityMultiSelect
                id="home-activities"
                label="Actividades"
                value={activityValues(filters.actividades)}
                suggestions={activities}
                hint="Elige qué quieres hacer. Los resultados pueden coincidir con cualquiera de las seleccionadas."
                compact
                onChange={(values) => onUpdate('actividades', activityQueryValue(values))}
              />
            </div>
          </div>

          <div className="home-filter-panel__actions">
            <label className="check">
              <input
                type="checkbox"
                checked={filters.avoidCrowds === 'true'}
                onChange={(event) => onUpdate('avoidCrowds', event.target.checked ? 'true' : '')}
              />
              Evitar aglomeraciones
            </label>
            <div>
              <button className="button button--quiet" type="button" onClick={onClear}>
                Limpiar
              </button>
              <button
                className="button button--primary"
                type="submit"
                disabled={loading}
                aria-busy={loading || undefined}
              >
                Ver resultados
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
