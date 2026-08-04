import { ArrowRight, Search } from 'lucide-react';

type SearchBoxProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
};

export function SearchBox({
  value,
  onChange,
  onSubmit,
  placeholder = 'Destino, municipio, actividad o plan',
}: SearchBoxProps) {
  return (
    <div className="search-box-group">
      <form
        className="search-box"
        role="search"
        aria-label="Buscar destinos"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <Search aria-hidden />
        <label className="sr-only" htmlFor="main-search">
          Buscar destino, municipio, actividad o tipo de viaje
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
        <button type="submit">
          Buscar <ArrowRight />
        </button>
      </form>
      <p id="main-search-help" className="search-box__help">
        También encuentra actividades, tipos de viaje, imprescindibles y pequeñas erratas.
      </p>
    </div>
  );
}
