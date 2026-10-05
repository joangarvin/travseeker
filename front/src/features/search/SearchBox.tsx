import { t } from '../../i18n';
import { ArrowRight, Search } from 'lucide-react';

type SearchBoxProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  loading?: boolean;
};

export function SearchBox({
  value,
  onChange,
  onSubmit,
  placeholder = t('Destino, municipio, actividad o plan'),
  loading = false,
}: SearchBoxProps) {
  return (
    <div className="search-box-group">
      <form
        className="search-box"
        data-tour="search"
        role="search"
        aria-label={t('Buscar destinos')}
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <Search aria-hidden />
        <label className="sr-only" htmlFor="main-search">
          {t('Buscar destino, municipio, actividad o tipo de viaje')}
        </label>
        <input
          id="main-search"
          type="search"
          autoComplete="off"
          aria-describedby="main-search-help"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
        <button type="submit" disabled={loading} aria-busy={loading || undefined}>
          {t('Buscar')} <ArrowRight />
        </button>
      </form>
      <p id="main-search-help" className="search-box__help">
        {t('También encuentra actividades, tipos de viaje, imprescindibles y pequeñas erratas.')}
      </p>
    </div>
  );
}
