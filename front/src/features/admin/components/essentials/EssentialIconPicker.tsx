import { t } from '../../../../i18n';
import { useMemo, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { EssentialIconGlyph, essentialIconChoices } from '../../../essentials/essentialIcons';

type EssentialIconPickerProps = {
  id: string;
  label: string;
  value?: string | null;
  inheritedIcon?: string;
  allowInherit?: boolean;
  onChange: (icon: string | null) => void;
};

export function EssentialIconPicker({
  id,
  label,
  value,
  inheritedIcon = 'Compass',
  allowInherit = false,
  onChange,
}: EssentialIconPickerProps) {
  const [query, setQuery] = useState('');
  const choices = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('es');
    if (!normalized) return essentialIconChoices;
    return essentialIconChoices.filter(
      ([name, iconLabel]) =>
        name.toLocaleLowerCase('es').includes(normalized) ||
        t(iconLabel).toLocaleLowerCase('es').includes(normalized),
    );
  }, [query]);

  return (
    <details className="essential-icon-disclosure">
      <summary>
        <EssentialIconGlyph name={value || inheritedIcon} />
        <span>{t(label)}</span>
        <ChevronDown aria-hidden />
      </summary>
      <fieldset className="essential-icon-picker">
        <legend>{t(label)}</legend>
        <label className="essential-icon-picker__search" htmlFor={`${id}-search`}>
          <Search aria-hidden />
          <span className="sr-only">{t('Buscar icono')}</span>
          <input
            id={`${id}-search`}
            type="search"
            value={query}
            placeholder={t('Buscar símbolo')}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="essential-icon-picker__choices">
          {allowInherit && !query && (
            <label className={!value ? 'is-selected' : ''}>
              <input
                className="sr-only"
                type="radio"
                name={id}
                checked={!value}
                onChange={() => onChange(null)}
              />
              <span className="essential-icon-picker__mark" aria-hidden>
                <EssentialIconGlyph name={inheritedIcon} />
              </span>
              <span>{t('Usar el del tema')}</span>
              {!value && <Check aria-hidden />}
            </label>
          )}
          {choices.map(([name, iconLabel]) => {
            const selected = value === name;
            return (
              <label className={selected ? 'is-selected' : ''} key={name}>
                <input
                  className="sr-only"
                  type="radio"
                  name={id}
                  value={name}
                  checked={selected}
                  onChange={() => onChange(name)}
                />
                <span className="essential-icon-picker__mark" aria-hidden>
                  <EssentialIconGlyph name={name} />
                </span>
                <span>{t(iconLabel)}</span>
                {selected && <Check aria-hidden />}
              </label>
            );
          })}
        </div>
        {!choices.length && (
          <p className="essential-icon-picker__empty">{t('No hay iconos coincidentes.')}</p>
        )}
      </fieldset>
    </details>
  );
}
