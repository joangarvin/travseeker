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
import type { Driver } from 'driver.js';
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
type Step = 'welcome' | 'interactive';

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
  const navigateRef = useRef(navigate);
  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);
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
  const driverRef = useRef<Driver | null>(null);
  const activeIndex = useRef(0);
  const closeRef = useRef(close);
  useEffect(() => {
    closeRef.current = close;
  });
  useEffect(() => {
    if (step !== 'interactive' || privacyOpen || !consent) return;
    let cancelled = false;
    void import('./interactiveTour')
      .then(({ createInteractiveTour }) => {
        if (cancelled) return;
        const instance = createInteractiveTour({
          navigate: (path) => navigateRef.current(path),
          finish: (completed) => closeRef.current(completed ? 'completed' : 'dismissed'),
          rememberStep: (index) => {
            activeIndex.current = index;
          },
          maps,
        });
        driverRef.current = instance;
        instance.drive(activeIndex.current);
      })
      .catch(() => {
        if (!cancelled) setStep('welcome');
      });
    return () => {
      cancelled = true;
      driverRef.current?.destroy();
      driverRef.current = null;
    };
  }, [step, privacyOpen, consent, maps]);
  const start = () => {
    activeIndex.current = 0;
    navigate('/');
    setStep('interactive');
  };
  const restart = () => {
    offered.current = true;
    markTourOffered();
    focusNext.current = true;
    setStep('welcome');
    if (!safePage) navigate('/');
  };
  return (
    <TourContext.Provider value={{ restart }}>
      {children}
      {step === 'welcome' && safePage && !privacyOpen && consent && (
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
              {say('Te guiamos, clic a clic', 'Let us guide you, click by click')}
            </h2>
            <p>
              {say(
                'Resaltaremos los controles y moveremos la página por ti. Haz clic donde te indicamos para descubrir un destino y aprender a comparar. Puedes salir cuando quieras.',
                'We will highlight the controls and scroll the page for you. Click where we point to discover a destination and learn to compare. Leave whenever you like.',
              )}
            </p>
          </div>
          <div className="guided-tour__actions">
            <button className="button button--primary" onClick={start}>
              {say('Empezar recorrido', 'Start tour')}
            </button>
            <button className="button button--quiet" onClick={() => close('dismissed')}>
              {say('Ahora no', 'Not now')}
            </button>
          </div>
        </aside>
      )}
    </TourContext.Provider>
  );
}
