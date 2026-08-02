import { Check } from 'lucide-react';
import { tourismTypes, tourismValues } from './tourism';

type TourismMultiSelectProps = {
  id: string;
  label: string;
  value?: string | string[] | null;
  excludedValues?: string[];
  hint?: string;
  required?: boolean;
  compact?: boolean;
  onChange: (values: string[]) => void;
};

export function TourismMultiSelect({
  id,
  label,
  value,
  excludedValues = [],
  hint,
  required = false,
  compact = false,
  onChange,
}: TourismMultiSelectProps) {
  const selectedValues = tourismValues(value);
  const hintId = hint ? `${id}-hint` : undefined;

  const toggle = (option: string) => {
    const nextValues = selectedValues.includes(option)
      ? selectedValues.filter((current) => current !== option)
      : [...selectedValues, option];
    onChange(nextValues);
  };

  return (
    <fieldset
      className={`tourism-multi-select ${compact ? 'tourism-multi-select--compact' : ''}`}
      aria-describedby={hintId}
    >
      <legend>
        {label}
        {required && <span aria-hidden> *</span>}
      </legend>
      {hint && <p id={hintId}>{hint}</p>}
      <div className="tourism-multi-select__options">
        {tourismTypes.map((tourismType) => {
          const isSelected = selectedValues.includes(tourismType.label);
          const isExcluded = !isSelected && excludedValues.includes(tourismType.label);
          return (
            <label
              className={`tourism-multi-select__option tourism--${tourismType.key} ${isSelected ? 'is-selected' : ''}`}
              key={tourismType.key}
            >
              <input
                className="sr-only"
                type="checkbox"
                name={id}
                value={tourismType.label}
                checked={isSelected}
                disabled={isExcluded}
                onChange={() => toggle(tourismType.label)}
              />
              <span className="tourism-multi-select__symbol" aria-hidden>
                <tourismType.Icon />
              </span>
              <span>{tourismType.label}</span>
              {isSelected && <Check className="tourism-multi-select__check" aria-hidden />}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
