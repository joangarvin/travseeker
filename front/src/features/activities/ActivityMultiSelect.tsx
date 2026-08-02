import { useState, type KeyboardEvent } from 'react';
import { Check, Plus, Search } from 'lucide-react';
import { activityDefinition, activityTypes, activityValues, normalizeActivity } from './activities';

type ActivityMultiSelectProps = {
  id: string;
  label: string;
  value?: string | string[] | null;
  suggestions?: string[];
  hint?: string;
  allowCustom?: boolean;
  compact?: boolean;
  onChange: (values: string[]) => void;
};

export function ActivityMultiSelect({
  id,
  label,
  value,
  suggestions = [],
  hint,
  allowCustom = false,
  compact = false,
  onChange,
}: ActivityMultiSelectProps) {
  const [query, setQuery] = useState('');
  const selectedValues = activityValues(value);
  const hintId = hint ? `${id}-hint` : undefined;
  const normalizedQuery = query.trim().toLocaleLowerCase('es');

  const options = activityValues([
    ...activityTypes.map((activity) => activity.label),
    ...suggestions,
    ...selectedValues,
  ]);
  const visibleOptions = normalizedQuery
    ? options.filter((option) => option.toLocaleLowerCase('es').includes(normalizedQuery))
    : options;
  const customValue = normalizeActivity(query);
  const canAddCustom =
    allowCustom &&
    Boolean(customValue) &&
    !options.some(
      (option) => option.toLocaleLowerCase('es') === customValue.toLocaleLowerCase('es'),
    );

  const toggle = (option: string) => {
    const nextValues = selectedValues.includes(option)
      ? selectedValues.filter((current) => current !== option)
      : [...selectedValues, option];
    onChange(nextValues);
  };

  const addCustom = () => {
    if (!canAddCustom) return;
    onChange([...selectedValues, customValue]);
    setQuery('');
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && canAddCustom) {
      event.preventDefault();
      addCustom();
    }
  };

  return (
    <fieldset
      className={`activity-multi-select ${compact ? 'activity-multi-select--compact' : ''}`}
      aria-describedby={hintId}
    >
      <legend>{label}</legend>
      {hint && <p id={hintId}>{hint}</p>}
      <label className="activity-multi-select__search">
        <Search aria-hidden />
        <span className="sr-only">Buscar {label.toLocaleLowerCase('es')}</span>
        <input
          type="search"
          value={query}
          placeholder="Buscar una actividad"
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleSearchKeyDown}
        />
      </label>
      <div className="activity-multi-select__options">
        {visibleOptions.map((option) => {
          const activity = activityDefinition(option);
          const isSelected = selectedValues.includes(option);
          return (
            <label
              className={`activity-multi-select__option ${isSelected ? 'is-selected' : ''}`}
              key={option}
            >
              <input
                className="sr-only"
                type="checkbox"
                name={id}
                value={option}
                checked={isSelected}
                onChange={() => toggle(option)}
              />
              <activity.Icon aria-hidden />
              <span>{activity.label}</span>
              {isSelected && <Check aria-hidden />}
            </label>
          );
        })}
        {canAddCustom && (
          <button className="activity-multi-select__add" type="button" onClick={addCustom}>
            <Plus aria-hidden /> Añadir “{customValue}”
          </button>
        )}
        {!visibleOptions.length && !canAddCustom && (
          <p className="activity-multi-select__empty">No hay actividades con ese nombre.</p>
        )}
      </div>
    </fieldset>
  );
}
