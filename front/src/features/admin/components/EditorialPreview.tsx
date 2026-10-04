import { useEffect, useState } from 'react';
import { AdminModal } from '../../../components/admin/AdminModal';
import { Button, Notice } from '../../../components/ui';
import { useAuth } from '../../../contexts';
import { languages, t, type Locale, type Translations } from '../../../i18n';
import { api } from '../../../services/api';
import type { EssentialGroup } from '../../../types';
import { sanitizeRichHtml } from '../../../utils/sanitizeContent';
import { imageUrl, responsiveImageUrl } from '../../../utils/media';
import type { EditorialItem } from './EditorialReviewPanel';

type PreviewRecord = Record<string, unknown> & {
  translations?: Translations;
  essentialGroups?: EssentialGroup[];
};
const fields: Array<[string, string]> = [
  ['nombre', 'Nombre'],
  ['name', 'Nombre'],
  ['ubicacion', 'Ubicación'],
  ['descripcion', 'Descripción'],
  ['description', 'Descripción'],
  ['categoria', 'Categoría'],
  ['precios', 'Nivel de precios'],
  ['conexiones', 'Conexiones y transporte'],
  ['tipoTurismo', 'Tipo de turismo'],
  ['tipoTurismoPrincipal', 'Tipos de viaje'],
  ['tipoTurismoSecundario', 'Actividades'],
  ['presupuesto', 'Presupuesto'],
  ['masificacion', 'Afluencia'],
  ['mesesJulioAgosto', 'Julio y agosto'],
  ['mesesMayJunSeptOct', 'Mayo, junio, septiembre y octubre'],
  ['mesesNovAbril', 'Noviembre a abril'],
  ['website', 'Web oficial'],
  ['address', 'Dirección'],
  ['latitud', 'Latitud'],
  ['longitud', 'Longitud'],
  ['icon', 'Icono'],
];
function text(value: unknown) {
  if (typeof value !== 'string' && typeof value !== 'number') return '';
  if (typeof value === 'string' && value.startsWith('[')) {
    try {
      const values: unknown = JSON.parse(value);
      if (Array.isArray(values)) return values.map(String).join(', ');
    } catch {
      /* preserve prose */
    }
  }
  return String(value);
}
export function EditorialPreview({
  item,
  onClose,
  onEdit,
}: {
  item: EditorialItem;
  onClose: () => void;
  onEdit: () => void;
}) {
  const { token } = useAuth();
  const [record, setRecord] = useState<PreviewRecord | null>(null);
  const [language, setLanguage] = useState<Locale>('es');
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setError('');
    setRecord(null);
    const path =
      item.resource === 'destinos'
        ? `/admin/destinos/${item.id}`
        : `/admin/editorial/${item.resource}/${item.id}`;
    api<PreviewRecord>(path, { signal: controller.signal }, token)
      .then((value) => {
        if (!controller.signal.aborted) setRecord(value);
      })
      .catch((cause) => {
        if (!controller.signal.aborted)
          setError(cause instanceof Error ? cause.message : t('No se pudo cargar el contenido'));
      });
    return () => controller.abort();
  }, [item.id, item.resource, token, retry]);
  const localized = (value: { translations?: Translations }, field: string, original: unknown) =>
    text(value.translations?.[language]?.[field] || original);
  const cover = imageUrl(text(record?.imagen || record?.imageUrl));
  return (
    <AdminModal title={t('Vista previa editorial')} subtitle={item.title} onClose={onClose}>
      <div className="editorial-preview">
        <label>
          {t('Idioma de la vista previa')}
          <select value={language} onChange={(event) => setLanguage(event.target.value as Locale)}>
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </label>
        <p className="editorial-preview__hint">
          {t('Los campos sin traducción se muestran en español.')}
        </p>
        {error && (
          <Notice tone="error">
            {error}
            <Button onClick={() => setRetry((value) => value + 1)}>{t('Reintentar')}</Button>
          </Notice>
        )}
        {!record && !error && <p role="status">{t('Cargando…')}</p>}
        {record && (
          <div lang={language}>
            {cover && (
              <img
                className="editorial-preview__cover"
                src={responsiveImageUrl(cover, 960)}
                alt=""
                loading="lazy"
              />
            )}
            {fields.map(([key, label]) => {
              const value = localized(record, key, record[key]);
              return value ? (
                <section key={key}>
                  <h3>{t(label)}</h3>
                  <div dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(value) }} />
                </section>
              ) : null;
            })}
            {record.essentialGroups?.length ? (
              record.essentialGroups.map((group) => (
                <section key={group.id}>
                  <h3>{localized(group, 'title', group.title)}</h3>
                  <ol>
                    {group.items.map((entry) => (
                      <li key={entry.id}>
                        <strong>{localized(entry, 'title', entry.title)}</strong>
                        <p>{localized(entry, 'description', entry.description)}</p>
                        <p>
                          {[
                            localized(entry, 'duration', entry.duration),
                            localized(entry, 'bestTime', entry.bestTime),
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                        {entry.reservationRequired && <p>{t('Reserva necesaria')}</p>}
                        {entry.officialUrl && <p>{entry.officialUrl}</p>}
                      </li>
                    ))}
                  </ol>
                </section>
              ))
            ) : record.imprescindibles ? (
              <section>
                <h3>{t('Imprescindibles')}</h3>
                <div
                  dangerouslySetInnerHTML={{
                    __html: sanitizeRichHtml(
                      localized(record, 'imprescindibles', record.imprescindibles),
                    ),
                  }}
                />
              </section>
            ) : null}
          </div>
        )}
        <footer className="modal-actions">
          <Button variant="quiet" onClick={onClose}>
            {t('Cerrar')}
          </Button>
          <Button disabled={!record} onClick={onEdit}>
            {t('Revisar y editar')}
          </Button>
        </footer>
      </div>
    </AdminModal>
  );
}
