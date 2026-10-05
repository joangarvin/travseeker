import { t } from '../../../i18n';
import { Archive, CheckCircle2, CircleDashed, Clock3 } from 'lucide-react';
import type { EditorialStatus } from '../../../types';

const STATUS = {
  draft: { label: t('Borrador'), Icon: CircleDashed },
  pending: { label: t('Pendiente'), Icon: Clock3 },
  published: { label: t('Publicado'), Icon: CheckCircle2 },
  archived: { label: t('Archivado'), Icon: Archive },
} satisfies Record<EditorialStatus, { label: string; Icon: typeof Archive }>;

export function EditorialStatusBadge({ status }: { status: EditorialStatus }) {
  const { label, Icon } = STATUS[status];
  return (
    <span className={`editorial-status editorial-status--${status}`}>
      <Icon aria-hidden="true" />
      {t(label)}
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
      <span>{t('Estado editorial')}</span>
      <select value={value} onChange={(event) => onChange(event.target.value as typeof value)}>
        <option value="all">{t('Todos')}</option>
        <option value="draft">{t('Borrador')}</option>
        <option value="pending">{t('Pendiente')}</option>
        <option value="published">{t('Publicado')}</option>
        <option value="archived">{t('Archivado')}</option>
      </select>
    </label>
  );
}
