import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

const OVERLAY_SELECTOR = '[role="dialog"], .mobile-menu';

function getVisibleFocusableElements(container: HTMLElement) {
  return [...container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)].filter(
    (element) => !element.hidden && element.offsetParent !== null,
  );
}

export function AccessibilityEffects() {
  const location = useLocation();

  useEffect(() => {
    const main = document.getElementById('main');
    main?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname]);

  useEffect(() => {
    let activeOverlay: HTMLElement | null = null;
    let returnFocus: HTMLElement | null = null;

    const inspectOverlays = () => {
      const overlays = document.querySelectorAll<HTMLElement>(OVERLAY_SELECTOR);
      const nextOverlay = overlays[overlays.length - 1] || null;

      if (nextOverlay && nextOverlay !== activeOverlay) {
        returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        activeOverlay = nextOverlay;
        queueMicrotask(() => {
          const requestedFocus = nextOverlay.querySelector<HTMLElement>('[data-autofocus]');
          (requestedFocus || getVisibleFocusableElements(nextOverlay)[0])?.focus();
        });
        return;
      }

      if (!nextOverlay && activeOverlay) {
        activeOverlay = null;
        returnFocus?.focus();
        returnFocus = null;
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!activeOverlay) return;

      if (event.key === 'Escape') {
        const closeButton = activeOverlay.querySelector<HTMLButtonElement>('.modal__close');
        if (closeButton) {
          event.preventDefault();
          closeButton.click();
        }
        return;
      }

      if (event.key !== 'Tab') return;

      const focusableElements = getVisibleFocusableElements(activeOverlay);
      if (!focusableElements.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    const observer = new MutationObserver(inspectOverlays);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      observer.disconnect();
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return null;
}
