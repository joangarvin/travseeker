import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { Check, ChevronDown, MapPin, Search, X } from 'lucide-react';
import type { Municipio } from '../../types';
import { plain } from '../../utils';
import { filterMunicipalities } from '../../utils/searchUtils';

type MunicipioComboboxProps = {
  allMunicipios: Municipio[];
  selectedIds: string[];
  onChange: (newSelectedIds: string[]) => void | Promise<void>;
  disabled?: boolean;
  limit?: number;
};

export function MunicipioCombobox({
  allMunicipios,
  selectedIds,
  onChange,
  disabled = false,
  limit = 20,
}: MunicipioComboboxProps) {
  const generatedId = useId().replace(/:/g, '');
  const listboxId = `municipio-options-${generatedId}`;
  const inputId = `municipio-search-${generatedId}`;
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isChanging, setIsChanging] = useState(false);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedMunicipios = useMemo(
    () => allMunicipios.filter((municipio) => selectedSet.has(municipio.id)),
    [allMunicipios, selectedSet],
  );
  const visibleOptions = useMemo(
    () => filterMunicipalities(allMunicipios, searchQuery, limit),
    [allMunicipios, limit, searchQuery],
  );
  const busy = disabled || isChanging;

  useEffect(() => {
    setActiveIndex((current) => Math.min(current, Math.max(visibleOptions.length - 1, 0)));
  }, [visibleOptions.length]);

  useEffect(() => {
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsidePointer);
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer);
  }, []);

  const commit = async (nextIds: string[]) => {
    if (busy) return;
    setIsChanging(true);
    try {
      await onChange(nextIds);
    } finally {
      setIsChanging(false);
      inputRef.current?.focus();
    }
  };

  const toggle = (municipio: Municipio) => {
    const nextIds = selectedSet.has(municipio.id)
      ? selectedIds.filter((id) => id !== municipio.id)
      : [...selectedIds, municipio.id];
    void commit(nextIds);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) =>
        Math.max(0, Math.min(current + (isOpen ? 1 : 0), visibleOptions.length - 1)),
      );
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) => Math.max(0, current - 1));
      return;
    }
    if (event.key === 'Enter' && isOpen && visibleOptions[activeIndex]) {
      event.preventDefault();
      toggle(visibleOptions[activeIndex]);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      setIsOpen(false);
      return;
    }
    if (event.key === 'Backspace' && !searchQuery && selectedIds.length) {
      event.preventDefault();
      void commit(selectedIds.slice(0, -1));
    }
  };

  return (
    <div
      className={`municipio-combobox${busy ? ' is-busy' : ''}`}
      ref={rootRef}
      aria-busy={isChanging || undefined}
    >
      <div className="municipio-combobox__selected" aria-label="Municipios seleccionados">
        <div>
          <strong>Bases seleccionadas</strong>
          <span>{selectedIds.length}</span>
        </div>
        {selectedMunicipios.length ? (
          <ul>
            {selectedMunicipios.map((municipio) => (
              <li key={municipio.id}>
                <MapPin aria-hidden="true" />
                <span>{municipio.nombre}</span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => toggle(municipio)}
                  aria-label={`Retirar ${municipio.nombre}`}
                >
                  <X aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>Busca y añade el primer municipio base.</p>
        )}
      </div>

      <div className="municipio-combobox__search">
        <label htmlFor={inputId}>Buscar en el catálogo</label>
        <div>
          <Search aria-hidden="true" />
          <input
            ref={inputRef}
            id={inputId}
            type="search"
            role="combobox"
            autoComplete="off"
            spellCheck="false"
            disabled={disabled}
            aria-expanded={isOpen}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={
              isOpen && visibleOptions[activeIndex]
                ? `${listboxId}-${visibleOptions[activeIndex].id}`
                : undefined
            }
            placeholder={`Buscar entre ${allMunicipios.length} municipios`}
            value={searchQuery}
            onFocus={() => setIsOpen(true)}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setActiveIndex(0);
              setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
          />
          <button
            type="button"
            disabled={disabled}
            aria-label={isOpen ? 'Cerrar opciones' : 'Abrir opciones'}
            aria-expanded={isOpen}
            onClick={() => {
              setIsOpen((current) => !current);
              inputRef.current?.focus();
            }}
          >
            <ChevronDown aria-hidden="true" />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="municipio-combobox__popover">
          <ul id={listboxId} role="listbox" aria-multiselectable="true">
            {visibleOptions.map((municipio, index) => {
              const selected = selectedSet.has(municipio.id);
              return (
                <li
                  id={`${listboxId}-${municipio.id}`}
                  key={municipio.id}
                  role="option"
                  aria-selected={selected}
                  className={index === activeIndex ? 'is-active' : ''}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => toggle(municipio)}
                >
                  <span>
                    <strong>{municipio.nombre}</strong>
                    <small>{plain(municipio.tipoTurismo) || 'Sin categoría'}</small>
                  </span>
                  <span className="municipio-combobox__status">
                    {selected ? <><Check aria-hidden="true" /> Seleccionado</> : 'Añadir'}
                  </span>
                </li>
              );
            })}
          </ul>
          {!visibleOptions.length ? (
            <p role="status">No hay municipios que coincidan con “{searchQuery.trim()}”.</p>
          ) : (
            <p role="status">
              {visibleOptions.length === limit
                ? `Mostrando los primeros ${limit} resultados · Sigue escribiendo para afinar`
                : `${visibleOptions.length} ${visibleOptions.length === 1 ? 'resultado' : 'resultados'}`}
            </p>
          )}
        </div>
      )}
      <span className="sr-only" aria-live="polite">
        {isChanging ? 'Actualizando municipios' : `${selectedIds.length} municipios seleccionados`}
      </span>
    </div>
  );
}
