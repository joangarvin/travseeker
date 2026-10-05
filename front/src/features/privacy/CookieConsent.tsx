import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { Link } from 'react-router-dom';
import legal from '../../../../shared/legal.json';
import { Dialog } from '../../components/ui/Dialog';
import { t } from '../../i18n';
import {
  getConsent,
  hasConsent,
  refreshConsent,
  saveConsent,
  subscribeConsent,
  type Choices,
} from './consent';

const PrivacyContext = createContext<{ openSettings: () => void; isOpen: boolean }>({
  openSettings: () => undefined,
  isOpen: false,
});
export const usePrivacySettings = () => useContext(PrivacyContext);
export function useConsent() {
  useSyncExternalStore(subscribeConsent, getConsent, () => null);
  return { analytics: hasConsent('analytics'), maps: hasConsent('maps') };
}
export function PrivacyProvider({ children }: { children: ReactNode }) {
  const consent = useSyncExternalStore(subscribeConsent, getConsent, () => null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Choices>({ analytics: false, maps: false });
  const [notice, setNotice] = useState('');
  const openSettings = () => {
    setDraft({ analytics: hasConsent('analytics'), maps: hasConsent('maps') });
    setOpen(true);
  };
  useEffect(() => {
    const timer = window.setInterval(refreshConsent, 60_000);
    document.addEventListener('visibilitychange', refreshConsent);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refreshConsent);
    };
  }, []);
  const choose = (choices: Choices) => {
    const persisted = saveConsent(choices);
    setOpen(false);
    setNotice(
      persisted
        ? t('Preferencias de privacidad guardadas.')
        : t(
            'Preferencias aplicadas en esta pestaña. Tu navegador no permite guardarlas para futuras visitas.',
          ),
    );
  };
  const actions = (
    <div className="privacy-actions">
      <button type="button" onClick={() => choose({ analytics: false, maps: false })}>
        {t('Rechazar opcionales')}
      </button>
      <button type="button" onClick={() => choose({ analytics: true, maps: true })}>
        {t('Aceptar opcionales')}
      </button>
      {!open && (
        <button type="button" onClick={openSettings}>
          {t('Personalizar')}
        </button>
      )}
    </div>
  );
  return (
    <PrivacyContext.Provider value={{ openSettings, isOpen: open }}>
      {children}
      {!consent && !open && (
        <section className="privacy-banner" role="region" aria-labelledby="privacy-title">
          <div>
            <h2 id="privacy-title">{t('Tú decides sobre tu privacidad')}</h2>
            <p>TravSeeker · {legal.operators.join(' / ')}</p>
            <p>
              {t(
                'Usamos almacenamiento necesario para iniciar sesión y recordar las funciones que eliges. Solo con tu permiso medimos el rendimiento o conectamos con mapas y rutas externos. No usamos cookies publicitarias.',
              )}
            </p>
            <p>
              <Link to="/cookies">{t('Política de cookies')}</Link> ·{' '}
              <Link to="/privacidad">{t('Privacidad')}</Link> ·{' '}
              <Link to="/aviso-legal">{t('Titulares y aviso legal')}</Link>
            </p>
          </div>
          {actions}
        </section>
      )}
      {consent && !open && (
        <button className="privacy-reopen" type="button" onClick={openSettings}>
          {t('Privacidad y cookies')}
        </button>
      )}
      <span className="sr-only" role="status">
        {notice}
      </span>
      {open && (
        <Dialog
          title={t('Personalizar privacidad')}
          description={t(
            'Las opciones no necesarias están desactivadas hasta que las elijas. Puedes cambiar o retirar tu permiso aquí en cualquier momento.',
          )}
          onClose={() => setOpen(false)}
          className="privacy-dialog"
        >
          <div className="privacy-category">
            <h3>{t('Necesarias y funciones solicitadas')}</h3>
            <p>
              {t(
                'Sesión segura, elección de privacidad, idioma, apariencia, comparaciones, guardados y borradores que solicitas. No se utilizan para publicidad ni perfiles comerciales.',
              )}
            </p>
            <strong>{t('Siempre disponibles')}</strong>
          </div>
          <label className="privacy-category">
            <span>
              <strong>{t('Medición de rendimiento')}</strong>
              <span>
                {t(
                  'Envía a TravSeeker tiempos de carga y estabilidad visual de la página. Sin identificador publicitario ni cookies de analítica. Opcional.',
                )}
              </span>
            </span>
            <input
              type="checkbox"
              checked={draft.analytics}
              onChange={(e) => setDraft({ ...draft, analytics: e.target.checked })}
            />
          </label>
          <label className="privacy-category">
            <span>
              <strong>{t('Mapas y rutas externos')}</strong>
              <span>
                {t(
                  'Permite conexiones con OpenStreetMap, CARTO y OSRM. Reciben tu dirección IP y las coordenadas del mapa o de la ruta solicitada. Sin permiso puedes seguir consultando las listas de destinos.',
                )}
              </span>
            </span>
            <input
              type="checkbox"
              checked={draft.maps}
              onChange={(e) => setDraft({ ...draft, maps: e.target.checked })}
            />
          </label>
          <p>
            <Link to="/cookies" onClick={() => setOpen(false)}>
              {t('Consultar proveedores, duración y almacenamiento')}
            </Link>
          </p>
          {actions}
          <button className="privacy-save" type="button" onClick={() => choose(draft)}>
            {t('Guardar selección')}
          </button>
        </Dialog>
      )}
    </PrivacyContext.Provider>
  );
}
export function ExternalMapGate({ children }: { children: ReactNode }) {
  const { maps } = useConsent();
  const { openSettings } = usePrivacySettings();
  return maps ? (
    children
  ) : (
    <div className="external-map-placeholder">
      <h3>{t('Mapas externos desactivados')}</h3>
      <p>
        {t(
          'Para cargar el mapa, permite Mapas y rutas externos. El proveedor recibirá tu IP y la zona consultada. Puedes usar la lista o introducir coordenadas sin activar el mapa.',
        )}
      </p>
      <button className="button button--quiet" onClick={openSettings} type="button">
        {t('Configurar mapas')}
      </button>
    </div>
  );
}
