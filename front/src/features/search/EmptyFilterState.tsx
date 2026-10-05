import { t } from '../../i18n';
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
        <div className="smart-empty__intro-copy">
          <p className="kicker">{t('Ajustemos la ruta')}</p>
          <h3 id="smart-empty-title">{t('No hay una coincidencia exacta')}</h3>
          <p>{t('Prueba quitando una condición. Conservaremos el resto de tus preferencias.')}</p>
        </div>
        {hasFilters && (
          <button
            className="button button--secondary smart-empty__reset"
            type="button"
            onClick={onResetAll}
          >
            {t('Limpiar todos los filtros')}
          </button>
        )}
      </div>

      {hasFilters && (
        <div className="smart-empty__filters" aria-label={t('Filtros activos')}>
          <p className="smart-empty__filters-label">
            <span>{t('Filtros activos')}</span>
            <strong>{activeChips.length}</strong>
          </p>
          <div className="smart-empty__chips">
            {activeChips.map((chip) => (
              <button
                key={chip.id}
                className="smart-empty__chip"
                type="button"
                onClick={() => onRemoveFilter(chip.key, chip.value)}
                aria-label={t('Quitar {0}', { 0: chip.label })}
              >
                <span>{t(chip.label)}</span>
                <X aria-hidden />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="sr-only" role="status" aria-live="polite">
        {fallbackLoading
          ? t('Buscando destinos cercanos a tus preferencias.')
          : fallbackResult
            ? t('{0} destinos disponibles al quitar {1}.', {
                0: fallbackResult.total,
                1: fallbackResult.relaxedFilterLabel,
              })
            : ''}
      </div>

      {fallbackLoading && hasFilters && (
        <div className="smart-empty__searching" aria-hidden="true">
          <Sparkles />
          <span>{t('Buscando la alternativa más cercana…')}</span>
        </div>
      )}

      {fallbackResult && (
        <section className="smart-empty__suggestion" aria-labelledby="fallback-title">
          <header>
            <div className="smart-empty__suggestion-copy">
              <p className="kicker">
                <Sparkles aria-hidden />
                {t('Ruta alternativa')}
              </p>
              <h3 id="fallback-title">
                {fallbackResult.total === 1
                  ? t('1 destino encaja si quitamos {0}', { 0: fallbackResult.relaxedFilterLabel })
                  : t('{0} destinos encajan si quitamos {1}', {
                      0: fallbackResult.total,
                      1: fallbackResult.relaxedFilterLabel,
                    })}
              </h3>
              <p>{t('El resto de tu búsqueda se mantiene intacto.')}</p>
            </div>
            <button
              className="button button--primary"
              type="button"
              onClick={() => onApplySuggestion(fallbackResult)}
            >
              {fallbackResult.total === 1
                ? t('Ver 1 destino')
                : t('Ver {0} destinos', { 0: fallbackResult.total })}{' '}
              <ArrowRight aria-hidden />
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
          {t('No hay destinos disponibles en este momento. Vuelve a intentarlo en unos minutos.')}
        </p>
      )}
    </div>
  );
}
