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
  placeholder = 'Busca un lugar, una costa o una forma de viajar',
}: SearchBoxProps) {
  return (
    <form
      className="search-box"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <Search aria-hidden />
      <label className="sr-only" htmlFor="main-search">
        Buscar destino
      </label>
      <input
        id="main-search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
      <button type="submit">
        Buscar <ArrowRight />
      </button>
    </form>
  );
}
