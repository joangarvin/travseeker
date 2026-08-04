import { useState } from 'react';
import { Check, Plus, Search } from 'lucide-react';
import { useActivities } from '../../contexts';
import { activityDefinition, activityTypes, activityValues } from './activities';

type ActivityMultiSelectProps = {
  id: string;
  label: string;
  value?: string | string[] | null;
  suggestions?: string[];
  hint?: string;
  compact?: boolean;
  onChange: (values: string[]) => void;
  onRequestCreate?: (name: string) => void;
};

export function ActivityMultiSelect({
  id,
  label,
  value,
  suggestions = [],
  hint,
  compact = false,
  onChange,
  onRequestCreate,
}: ActivityMultiSelectProps) {
  const { activities } = useActivities();
  const [query, setQuery] = useState('');
  const selectedValues = activityValues(value);
  const hintId = hint ? `${id}-hint` : undefined;
  const normalizedQuery = query.trim().toLocaleLowerCase('es');

  const options = activityValues([
    ...activities.filter((activity) => activity.isActive).map((activity) => activity.name),
    ...(activities.length ? [] : activityTypes.map((activity) => activity.label)),
    ...suggestions,
    ...selectedValues,
  ]);
  const visibleOptions = normalizedQuery
    ? options.filter((option) => option.toLocaleLowerCase('es').includes(normalizedQuery))
    : options;
  const canRequestCreate =
    Boolean(onRequestCreate) &&
    Boolean(query.trim()) &&
    !options.some(
      (option) => option.toLocaleLowerCase('es') === query.trim().toLocaleLowerCase('es'),
    );

  const toggle = (option: string) => {
    const nextValues = selectedValues.includes(option)
      ? selectedValues.filter((current) => current !== option)
      : [...selectedValues, option];
    onChange(nextValues);
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
        />
      </label>
      <div className="activity-multi-select__options">
        {visibleOptions.map((option) => {
          const activity = activityDefinition(option, activities);
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
        {canRequestCreate && (
          <button
            className="activity-multi-select__add"
            type="button"
            onClick={() => onRequestCreate?.(query.trim())}
          >
            <Plus aria-hidden /> Crear “{query.trim()}” con icono
          </button>
        )}
        {!visibleOptions.length && !canRequestCreate && (
          <p className="activity-multi-select__empty">No hay actividades con ese nombre.</p>
        )}
      </div>
    </fieldset>
  );
}
