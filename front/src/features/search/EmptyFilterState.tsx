import { ArrowRight, SearchX, Sparkles, X } from 'lucide-react';
import type {
  ActiveFilterChip,
  FallbackResult,
  SearchFilterKey,
} from '../../utils/filterFallbackEngine';
import { DestinationCard } from '../destinations/components/DestinationCard';

type EmptyFilterStateProps = {
  activeChips: ActiveFilterChip[];
  fallbackResult: FallbackResult | null;
  fallbackLoading: boolean;
  onRemoveFilter: (key: SearchFilterKey, value?: string) => void;
  onResetAll: () => void;
  onApplySuggestion: (result: FallbackResult) => void;
};

export function EmptyFilterState({
  activeChips,
  fallbackResult,
  fallbackLoading,
  onRemoveFilter,
  onResetAll,
  onApplySuggestion,
}: EmptyFilterStateProps) {
  const hasFilters = activeChips.length > 0;

  return (
    <div className="smart-empty" aria-labelledby="smart-empty-title">
      <div className="smart-empty__intro">
        <span className="smart-empty__icon" aria-hidden>
          <SearchX />
        </span>
        <div>
          <p className="kicker">Ajustemos la ruta</p>
          <h3 id="smart-empty-title">Ningún lugar reúne todo lo que has pedido</h3>
          <p>
            Quita una condición concreta o empieza de nuevo. Mantendremos el resto de tus
            preferencias intactas.
          </p>
        </div>
        {hasFilters && (
          <button
            className="button button--primary smart-empty__reset"
            type="button"
            onClick={onResetAll}
          >
            Limpiar todos los filtros
          </button>
        )}
      </div>

      {hasFilters && (
        <div className="smart-empty__filters" aria-label="Filtros activos">
          <p>Tus condiciones</p>
          <div>
            {activeChips.map((chip) => (
              <button
                key={chip.id}
                className="smart-empty__chip"
                type="button"
                onClick={() => onRemoveFilter(chip.key, chip.value)}
                aria-label={`Quitar ${chip.label}`}
              >
                <span>{chip.label}</span>
                <X aria-hidden />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="sr-only" role="status" aria-live="polite">
        {fallbackLoading
          ? 'Buscando destinos cercanos a tus preferencias.'
          : fallbackResult
            ? `${fallbackResult.total} destinos disponibles al quitar ${fallbackResult.relaxedFilterLabel}.`
            : ''}
      </div>

      {fallbackLoading && hasFilters && (
        <div className="smart-empty__searching" aria-hidden="true">
          <Sparkles />
          <span>Buscando la alternativa más cercana…</span>
        </div>
      )}

      {fallbackResult && (
        <section className="smart-empty__suggestion" aria-labelledby="fallback-title">
          <header>
            <span aria-hidden>
              <Sparkles />
            </span>
            <div>
              <p className="kicker">Una coincidencia cercana</p>
              <h3 id="fallback-title">
                {fallbackResult.total === 1
                  ? 'Hay 1 destino si flexibilizas una condición'
                  : `Hay ${fallbackResult.total} destinos si flexibilizas una condición`}
              </h3>
              <p>
                Conservamos el resto de la búsqueda y quitamos únicamente{' '}
                <strong>{fallbackResult.relaxedFilterLabel}</strong>.
              </p>
            </div>
            <button
              className="button button--secondary"
              type="button"
              onClick={() => onApplySuggestion(fallbackResult)}
            >
              Ver estos destinos <ArrowRight aria-hidden />
            </button>
          </header>

          <div className="destination-list smart-empty__destinations">
            {fallbackResult.suggestedDestinations.map((destination, index) => (
              <DestinationCard key={destination.id} destino={destination} index={index} />
            ))}
          </div>
        </section>
      )}

      {!hasFilters && (
        <p className="smart-empty__no-filters">
          No hay destinos disponibles en este momento. Vuelve a intentarlo en unos minutos.
        </p>
      )}
    </div>
  );
}
