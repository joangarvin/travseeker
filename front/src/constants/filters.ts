export const SEARCH_FILTERS = [
  {
    key: 'month',
    label: 'Mes de viaje',
    options: [
      { value: '', label: 'Cualquier mes' },
      { value: '1', label: 'Enero' }, { value: '2', label: 'Febrero' },
      { value: '3', label: 'Marzo' }, { value: '4', label: 'Abril' },
      { value: '5', label: 'Mayo' }, { value: '6', label: 'Junio' },
      { value: '7', label: 'Julio' }, { value: '8', label: 'Agosto' },
      { value: '9', label: 'Septiembre' }, { value: '10', label: 'Octubre' },
      { value: '11', label: 'Noviembre' }, { value: '12', label: 'Diciembre' },
    ],
  },
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
  month: '',
  presupuesto: '',
  masificacion: '',
  ubicacion: '',
  tipoTurismo: '',
  actividades: '',
  avoidCrowds: '',
};

export const SELECT_CLASS =
  'w-full border border-[var(--color-border-strong)] px-4 py-3 rounded-lg bg-[var(--color-surface)] text-[var(--color-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/40 cursor-pointer appearance-none h-[46px]';
