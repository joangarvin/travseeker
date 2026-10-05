import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { locale } from '../../i18n';
import { getConsent, subscribeConsent } from '../privacy/consent';
import { useConsent, usePrivacySettings } from '../privacy/CookieConsent';
import {
  markTourOffered,
  readTourResult,
  saveTourResult,
  tourWasOffered,
  type TourResult,
} from './tourStorage';

const say = (es: string, en: string) => (locale === 'en' ? en : es);
const TourContext = createContext({ restart: () => {} });
export const useGuidedTour = () => useContext(TourContext);
type Step = 'welcome' | 'discover' | 'destination' | 'map' | 'compare';
const paths: Partial<Record<Step, string>> = { discover: '/', map: '/mapa', compare: '/comparar' };

export function GuidedTourProvider({ children }: { children: ReactNode }) {
  const consent = useSyncExternalStore(subscribeConsent, getConsent, () => null);
  const { analytics, maps } = useConsent();
  const persistent = analytics || maps;
  const { isOpen: privacyOpen } = usePrivacySettings();
  const [step, setStep] = useState<Step | null>(null);
  const [result, setResult] = useState<TourResult | null>(() => readTourResult(persistent));
  const offered = useRef(tourWasOffered());
  const location = useLocation();
  const navigate = useNavigate();
  const title = useRef<HTMLHeadingElement>(null);
  const focusNext = useRef(false);
  const safePage =
    ['/', '/mapa', '/comparar', '/sobre-nosotros'].includes(location.pathname) ||
    location.pathname.startsWith('/destino/');

  useEffect(() => {
    if (result) saveTourResult(result, persistent);
  }, [result, persistent]);
  useEffect(() => {
    if (!consent || privacyOpen || !safePage || offered.current || result) return;
    offered.current = true;
    markTourOffered();
    setStep('welcome');
  }, [consent, privacyOpen, safePage, result]);
  useEffect(() => {
    if (!step || step === 'welcome') return;
    if (location.pathname.startsWith('/destino/')) setStep('destination');
    else if (location.pathname === '/mapa') setStep('map');
    else if (location.pathname === '/comparar') setStep('compare');
    else if (location.pathname === '/') setStep('discover');
  }, [location.pathname, step]);
  useEffect(() => {
    if (focusNext.current && step && !privacyOpen) {
      title.current?.focus({ preventScroll: true });
      focusNext.current = false;
    }
  }, [step, privacyOpen]);
  const close = (value: TourResult) => {
    setResult(value);
    saveTourResult(value, persistent);
    setStep(null);
  };
  const go = (next: Step) => {
    focusNext.current = true;
    setStep(next);
    if (paths[next]) navigate(paths[next]!);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  const restart = () => {
    offered.current = true;
    markTourOffered();
    focusNext.current = true;
    setStep('welcome');
    if (!safePage) navigate('/');
  };
  const headings = {
    welcome: say('¿Descubrimos tu próximo destino?', 'Shall we find your next destination?'),
    discover: say('Encuentra un lugar que te apetezca', 'Find somewhere you would love to visit'),
    destination: say('Conoce el destino antes de decidir', 'Get to know the destination'),
    map: say('Explora lo que tienes cerca', 'Explore places nearby'),
    compare: say('Elige entre tus opciones', 'Choose between your options'),
  };
  const descriptions = {
    welcome: say(
      'Te acompañamos en cuatro pasos cortos. Podrás usar la web mientras lees y salir cuando quieras.',
      'We will guide you through four short steps. Use the website as you go and leave whenever you like.',
    ),
    discover: say(
      'Prueba el buscador o los filtros. Después, abre la ficha de un destino que te guste: el tutorial seguirá allí. Si prefieres, puedes pasar directamente al mapa.',
      'Try the search or filters. Then open a destination you like: the guide will continue there. You can also skip ahead to the map.',
    ),
    destination: say(
      'Baja por la ficha para ver cuándo ir, qué hacer y los imprescindibles. Añade el destino a la comparación si quieres contrastarlo con otro.',
      'Scroll through the page to see when to visit, things to do and the essentials. Add the destination to your comparison if you want to weigh it against another.',
    ),
    map: maps
      ? say(
          'Mueve el mapa y pulsa un marcador para descubrir un destino. La lista también te permite abrir sus fichas.',
          'Move the map and select a marker to discover a destination. You can also open destinations from the list.',
        )
      : say(
          'Puedes explorar la lista sin activar mapas externos. Si quieres ver el mapa, usa «Configurar mapas» y elige ese permiso. No es necesario para continuar.',
          'You can explore the list without enabling external maps. To see the map, use “Configure maps” and choose that permission. It is not required to continue.',
        ),
    compare: say(
      'Añade al menos dos destinos desde sus tarjetas o fichas para comparar presupuesto, temporada y afluencia. Para guardar favoritos y organizar viajes, inicia sesión. Puedes repetir este recorrido desde «Repetir tutorial» al pie de cualquier página.',
      'Add at least two destinations from their cards or pages to compare budget, season and crowds. Sign in to save favourites and organize trips. Replay this guide using “Repeat tutorial” in the page footer.',
    ),
  };
  const number = step ? ['discover', 'destination', 'map', 'compare'].indexOf(step) + 1 : 0;
  return (
    <TourContext.Provider value={{ restart }}>
      {children}
      {step && safePage && !privacyOpen && consent && (
        <aside
          className="guided-tour"
          aria-label={say('Tutorial de TravSeeker', 'TravSeeker tutorial')}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.stopPropagation();
              close('dismissed');
            }
          }}
        >
          <button
            type="button"
            className="guided-tour__close icon-button"
            onClick={() => close('dismissed')}
            aria-label={say('Cerrar tutorial', 'Close tutorial')}
          >
            <X aria-hidden="true" />
          </button>
          <div aria-live="polite" aria-atomic="true">
            <h2 ref={title} tabIndex={-1}>
              {headings[step]}
            </h2>
            {number > 0 && (
              <p className="guided-tour__progress">
                {say(`Paso ${number} de 4`, `Step ${number} of 4`)}
              </p>
            )}
            <p>{descriptions[step]}</p>
          </div>
          <div className="guided-tour__actions">
            {step === 'welcome' ? (
              <>
                <button className="button button--primary" onClick={() => go('discover')}>
                  {say('Empezar recorrido', 'Start tour')}
                </button>
                <button className="button button--quiet" onClick={() => close('dismissed')}>
                  {say('Ahora no', 'Not now')}
                </button>
              </>
            ) : (
              <>
                <button
                  className="button button--quiet"
                  onClick={() => go(step === 'compare' ? 'map' : 'discover')}
                >
                  {say(
                    step === 'discover' ? 'Volver al inicio' : 'Atrás',
                    step === 'discover' ? 'Back to discovery' : 'Back',
                  )}
                </button>
                <button
                  className="button button--primary"
                  onClick={() =>
                    step === 'compare' ? close('completed') : go(step === 'map' ? 'compare' : 'map')
                  }
                >
                  {step === 'compare'
                    ? say('Terminar tutorial', 'Finish tour')
                    : step === 'map'
                      ? say('Ir a comparar', 'Go to comparison')
                      : say('Ir al mapa', 'Go to the map')}
                </button>
              </>
            )}
          </div>
        </aside>
      )}
    </TourContext.Provider>
  );
}
