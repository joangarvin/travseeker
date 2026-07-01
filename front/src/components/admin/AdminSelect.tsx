import { useMemo } from 'react';
import { adminSelectClass } from './AdminField';

interface Props {
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

/** Select que admite valores legacy aunque no estén en la lista predefinida. */
export default function AdminSelect({
  value,
  options,
  onChange,
  placeholder = 'Selecciona una opción',
  required,
}: Props) {
  const mergedOptions = useMemo(() => {
    if (!value || options.includes(value)) return options;
    return [value, ...options];
  }, [value, options]);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={adminSelectClass}
      required={required}
    >
      <option value="">{placeholder}</option>
      {mergedOptions.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}
