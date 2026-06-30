export const SEARCH_FILTERS = [
  {
    key: 'presupuesto',
    label: 'Presupuesto',
    options: [
      { value: '', label: 'Cualquiera' },
      { value: 'Bajo', label: 'Bajo' },
      { value: 'Medio', label: 'Medio' },
      { value: 'Alto', label: 'Alto' },
    ],
  },
  {
    key: 'masificacion',
    label: 'Masificación',
    options: [
      { value: '', label: 'Cualquiera' },
      { value: 'Nulo', label: 'Nula' },
      { value: 'Leve', label: 'Leve' },
      { value: 'Medio', label: 'Media' },
      { value: 'Alto', label: 'Alta' },
    ],
  },
  {
    key: 'ubicacion',
    label: 'Ubicación',
    options: [
      { value: '', label: 'Cualquiera' },
      { value: 'Costa', label: 'Costa' },
      { value: 'Interior', label: 'Interior' },
      { value: 'Montaña', label: 'Montaña' },
      { value: 'Isla', label: 'Isla' },
    ],
  },
  {
    key: 'tipoTurismo',
    label: 'Tipo de turismo',
    options: [
      { value: '', label: 'Cualquiera' },
      { value: 'Cultural', label: 'Cultural' },
      { value: 'Naturaleza', label: 'Naturaleza' },
      { value: 'Sol y playa', label: 'Sol y playa' },
      { value: 'Rural', label: 'Rural' },
      { value: 'Montaña', label: 'Montaña' },
      { value: 'Patrimonial', label: 'Patrimonial' },
    ],
  },
  {
    key: 'actividades',
    label: 'Actividades',
    options: [
      { value: '', label: 'Cualquiera' },
      { value: 'Gastronómico', label: 'Gastronómico' },
      { value: 'Senderismo', label: 'Senderismo' },
      { value: 'Ocio', label: 'Ocio' },
      { value: 'Relax', label: 'Relax' },
      { value: 'Aventura', label: 'Aventura' },
    ],
  },
] as const;

export const EMPTY_FILTERS: Record<string, string> = {
  presupuesto: '',
  masificacion: '',
  ubicacion: '',
  tipoTurismo: '',
  actividades: '',
};

export const SELECT_CLASS =
  'w-full border border-[var(--color-border)] px-4 py-3 rounded-xl bg-[var(--color-surface)] text-[var(--color-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/40 cursor-pointer appearance-none h-[46px]';
