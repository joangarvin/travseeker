import { t, intlLocale } from '../../i18n';
import { SlidersHorizontal } from 'lucide-react';
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
  locationLabels?: Record<string, string>;
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
  locationLabels = {},
  activities,
  onToggle,
  onUpdate,
  onClear,
  onApply,
  loading = false,
}: HomeFilterPanelProps) {
  return (
    <div className="home-filter-control">
      <div className="home-filter-chips" role="group" aria-label={t('Atajos de filtro')}>
        <button
          id="home-filter-trigger"
          className={`home-filter-chip ${isOpen ? 'is-open' : ''} ${activeCount > 0 ? 'is-active' : ''}`}
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls="home-filter-panel"
        >
          <SlidersHorizontal aria-hidden />
          {t('Filtros')}
          {activeCount > 0 && <b>{activeCount}</b>}
        </button>
        <button
          className="home-filter-chip"
          type="button"
          onClick={() => {
            if (!isOpen) onToggle();
            window.setTimeout(() => document.getElementById('home-budget')?.focus(), 80);
          }}
        >
          {t('Presupuesto')}
        </button>
        <button
          className="home-filter-chip"
          type="button"
          onClick={() => {
            if (!isOpen) onToggle();
            window.setTimeout(() => document.getElementById('home-crowd')?.focus(), 80);
          }}
        >
          {t('Afluencia')}
        </button>
        <button
          className="home-filter-chip"
          type="button"
          onClick={() => {
            if (!isOpen) onToggle();
            window.setTimeout(() => document.getElementById('home-month')?.focus(), 80);
          }}
        >
          {t('Temporada')}
        </button>
      </div>

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
            <span>{t('Preferencias de viaje')}</span>
            <p>{t('Ajusta solo lo que condiciona tu decisión.')}</p>
          </div>

          <div className="home-filter-panel__grid">
            <fieldset className="travel-filter-group">
              <legend>{t('Dónde quieres ir')}</legend>
              <label>
                {t('Ubicación')}
                <select
                  value={filters.ubicacion || ''}
                  onChange={(event) => onUpdate('ubicacion', event.target.value)}
                >
                  <option value="">{t('Cualquiera')}</option>
                  {locations.map((location) => (
                    <option key={location} value={location}>
                      {locationLabels[location] || t(location)}
                    </option>
                  ))}
                </select>
              </label>{' '}
            </fieldset>
            <fieldset className="travel-filter-group">
              <legend>{t('Cuándo quieres viajar')}</legend>
              <label>
                {t('Mes')}
                <select
                  id="home-month"
                  value={filters.month || ''}
                  onChange={(event) => onUpdate('month', event.target.value)}
                >
                  <option value="">{t('Cualquier momento')}</option>
                  {months.map((month) => (
                    <option key={month} value={month}>
                      {new Date(2026, Number(month) - 1).toLocaleString(intlLocale, {
                        month: 'long',
                      })}
                    </option>
                  ))}
                </select>
              </label>{' '}
              <label>
                {t('Masificación')}
                <select
                  id="home-crowd"
                  value={filters.masificacion || ''}
                  onChange={(event) => onUpdate('masificacion', event.target.value)}
                >
                  <option value="">{t('Cualquiera')}</option>
                  {crowdOptions.map((option) => (
                    <option key={option} value={option}>
                      {t(option)}
                    </option>
                  ))}
                </select>
              </label>{' '}
            </fieldset>
            <fieldset className="travel-filter-group travel-filter-group--wide">
              <legend>{t('Cómo quieres viajar')}</legend>
              <label>
                {t('Presupuesto')}
                <select
                  id="home-budget"
                  value={filters.presupuesto || ''}
                  onChange={(event) => onUpdate('presupuesto', event.target.value)}
                >
                  <option value="">{t('Cualquiera')}</option>
                  {budgetOptions.map((option) => (
                    <option key={option} value={option}>
                      {t(option)}
                    </option>
                  ))}
                </select>
              </label>{' '}
              <div className="home-filter-panel__tourism">
                <TourismMultiSelect
                  id="home-tourism-types"
                  label={t('Tipos de viaje')}
                  value={tourismValues(filters.tipoTurismo)}
                  hint={t(
                    'Puedes combinar varias opciones. Mostraremos destinos que coincidan con cualquiera.',
                  )}
                  compact
                  onChange={(values) => onUpdate('tipoTurismo', tourismQueryValue(values))}
                />
              </div>
              <div className="home-filter-panel__activities">
                <ActivityMultiSelect
                  id="home-activities"
                  label={t('Actividades')}
                  value={activityValues(filters.actividades)}
                  suggestions={activities}
                  hint={t(
                    'Elige qué quieres hacer. Los resultados pueden coincidir con cualquiera de las seleccionadas.',
                  )}
                  compact
                  onChange={(values) => onUpdate('actividades', activityQueryValue(values))}
                />
              </div>
            </fieldset>
          </div>

          <div className="home-filter-panel__actions">
            <label className="check">
              <input
                type="checkbox"
                checked={filters.avoidCrowds === 'true'}
                onChange={(event) => onUpdate('avoidCrowds', event.target.checked ? 'true' : '')}
              />
              {t('Evitar aglomeraciones')}
            </label>
            <div>
              <button className="button button--quiet" type="button" onClick={onClear}>
                {t('Limpiar')}
              </button>
              <button
                className="button button--primary"
                type="submit"
                disabled={loading}
                aria-busy={loading || undefined}
              >
                {t('Ver resultados')}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
