import { ChevronDown, ChevronLeft, ChevronRight, Heart, Share2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { t } from '../../i18n';
import { TourismMarks } from '../../features/tourism/tourism';
import { MediaImage } from '../../components/ui';
import { useAuth, useCompare } from '../../contexts';
import { api } from '../../services/api';
import { imageUrl, plain } from '../../utils';
import type { Destino } from '../../types';

export function MapDestinationDetails({
  destination,
  onClose,
  motionSource,
  onNotice,
  onStep,
  index,
  total,
}: {
  destination: Destino;
  onClose: () => void;
  motionSource: 'pointer' | 'keyboard';
  onNotice: (text: string) => void;
  onStep: (step: number) => void;
  index: number;
  total: number;
}) {
  const { token } = useAuth(),
    compare = useCompare();
  const [expanded, setExpanded] = useState(false),
    [favorite, setFavorite] = useState(false),
    [checkFailed, setCheckFailed] = useState(false),
    [checking, setChecking] = useState(true),
    [pending, setPending] = useState(false),
    [shareLink, setShareLink] = useState('');
  const busy = useRef(false);
  const detailRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (motionSource === 'keyboard') detailRef.current?.focus({ preventScroll: true });
  }, [motionSource]);
  useEffect(() => {
    const ctrl = new AbortController();
    setFavorite(false);
    setCheckFailed(false);
    setChecking(!!token);
    if (token)
      api<{ isFavorite: boolean }>(
        `/favoritos/check/${destination.id}`,
        { signal: ctrl.signal },
        token,
      )
        .then((d) => {
          if (!ctrl.signal.aborted) setFavorite(d.isFavorite);
        })
        .catch(() => {
          if (!ctrl.signal.aborted) setCheckFailed(true);
        })
        .finally(() => {
          if (!ctrl.signal.aborted) setChecking(false);
        });
    return () => ctrl.abort();
  }, [destination.id, token]);
  async function save() {
    if (!token) {
      onNotice(t('Inicia sesión para guardar destinos'));
      return;
    }
    if (checkFailed) {
      onNotice(t('No se pudo comprobar el guardado. Vuelve a abrir el destino.'));
      return;
    }
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    try {
      await api(`/favoritos/${destination.id}`, { method: favorite ? 'DELETE' : 'POST' }, token);
      setFavorite(!favorite);
      onNotice(t(favorite ? 'Destino eliminado de guardados' : 'Destino guardado'));
    } catch (e) {
      onNotice(e instanceof Error ? e.message : t('No se pudo guardar el destino'));
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  async function share() {
    try {
      await navigator.clipboard.writeText(location.href);
      onNotice(t('Enlace copiado con el destino y los filtros actuales'));
    } catch {
      setShareLink(location.href);
      setExpanded(true);
      onNotice(t('Copia el enlace para compartir esta vista'));
    }
  }
  return (
    <section
      ref={detailRef}
      tabIndex={-1}
      id={`map-detail-${destination.id}`}
      className={`atlas-map__detail ${expanded ? 'is-expanded' : ''}`}
      aria-label={t('Destino seleccionado: {0}', { 0: destination.nombre.trim() })}
      data-motion-trigger={motionSource}
    >
      <div className="atlas-map__detail-photo">
        <MediaImage src={imageUrl(destination.imagen)} alt="" />
        <button
          className={`atlas-map__save ${favorite ? 'is-saved' : ''}`}
          type="button"
          aria-label={t(favorite ? 'Guardado' : 'Guardar')}
          aria-pressed={favorite}
          disabled={pending || checking}
          aria-busy={pending || undefined}
          onClick={() => void save()}
        >
          <Heart aria-hidden="true" />
        </button>
      </div>
      <div className="atlas-map__detail-content">
        <header>
          <TourismMarks value={destination.tipoTurismoPrincipal} compact />
          <button
            type="button"
            className="atlas-map__icon"
            aria-label={t('Cerrar ficha')}
            onClick={onClose}
          >
            <X aria-hidden="true" />
          </button>
        </header>
        <h2>{destination.nombre.trim()}</h2>
        <p className="atlas-map__location">
          {[
            destination.country?.name && t(destination.country.name),
            destination.region || plain(destination.ubicacion),
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
        {expanded && (
          <div className="atlas-map__expanded">
            <dl>
              <div>
                <dt>{t('Presupuesto')}</dt>
                <dd>{t(plain(destination.presupuesto)) || '—'}</dd>
              </div>
              <div>
                <dt>{t('Afluencia')}</dt>
                <dd>{t(plain(destination.masificacion)) || '—'}</dd>
              </div>
            </dl>
            <div className="atlas-map__detail-tools">
              <button
                type="button"
                className="button button--quiet"
                aria-pressed={compare.ids.includes(destination.id)}
                onClick={() => {
                  const had = compare.ids.includes(destination.id);
                  onNotice(
                    t(
                      compare.toggle(destination.id)
                        ? had
                          ? 'Destino eliminado de la comparación'
                          : 'Destino añadido a la comparación'
                        : 'Puedes comparar un máximo de 4 destinos',
                    ),
                  );
                }}
              >
                {t(
                  compare.ids.includes(destination.id)
                    ? 'Quitar de comparación'
                    : 'Comparar destino',
                )}
              </button>
              <button type="button" className="button button--quiet" onClick={() => void share()}>
                <Share2 aria-hidden="true" />
                {t('Compartir')}
              </button>
              {!token && <Link to="/auth">{t('Inicia sesión para guardar destinos')}</Link>}
            </div>
            {shareLink && (
              <label>
                {t('Enlace')}
                <input readOnly value={shareLink} onFocus={(e) => e.currentTarget.select()} />
              </label>
            )}
          </div>
        )}
        <div className="atlas-map__detail-actions">
          <Link className="button button--sun" to={`/destino/${destination.id}`}>
            {t('Ver destino')} ↗
          </Link>
          <button
            type="button"
            className="button button--quiet"
            aria-expanded={expanded}
            onClick={() => setExpanded(!expanded)}
          >
            {t(expanded ? 'Leer menos' : 'Más información')}
            <ChevronDown aria-hidden="true" />
          </button>
        </div>
        <div className="atlas-map__stepper">
          <button
            type="button"
            className="atlas-map__icon"
            disabled={index <= 0}
            onClick={() => onStep(-1)}
            aria-label={t('Destino anterior')}
          >
            <ChevronLeft aria-hidden="true" />
          </button>
          <span>
            {index + 1} / {total}
          </span>
          <button
            type="button"
            className="atlas-map__icon"
            disabled={index >= total - 1}
            onClick={() => onStep(1)}
            aria-label={t('Destino siguiente')}
          >
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
