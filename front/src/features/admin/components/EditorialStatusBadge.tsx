import { Archive, CheckCircle2, CircleDashed, Clock3 } from 'lucide-react';
import type { EditorialStatus } from '../../../types';

const STATUS = {
  draft: { label: 'Borrador', Icon: CircleDashed },
  pending: { label: 'Pendiente', Icon: Clock3 },
  published: { label: 'Publicado', Icon: CheckCircle2 },
  archived: { label: 'Archivado', Icon: Archive },
} satisfies Record<EditorialStatus, { label: string; Icon: typeof Archive }>;

export function EditorialStatusBadge({ status }: { status: EditorialStatus }) {
  const { label, Icon } = STATUS[status];
  return (
    <span className={`editorial-status editorial-status--${status}`}>
      <Icon aria-hidden="true" />
      {label}
    </span>
  );
}

export function EditorialStatusFilter({
  value,
  onChange,
}: {
  value: EditorialStatus | 'all';
  onChange: (status: EditorialStatus | 'all') => void;
}) {
  return (
    <label className="editorial-inline-filter">
      <span>Estado editorial</span>
      <select value={value} onChange={(event) => onChange(event.target.value as typeof value)}>
        <option value="all">Todos</option>
        <option value="draft">Borrador</option>
        <option value="pending">Pendiente</option>
        <option value="published">Publicado</option>
        <option value="archived">Archivado</option>
      </select>
    </label>
  );
}
