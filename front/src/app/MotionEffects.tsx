import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

const REVEAL_SELECTOR = '[data-reveal]';

export function MotionEffects() {
  const location = useLocation();

  useLayoutEffect(() => {
    document.documentElement.classList.add('motion-ready');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const observed = new WeakSet<Element>();

    const reveal = (element: Element) => {
      if (!(element instanceof HTMLElement) || observed.has(element)) return;
      observed.add(element);

      if (reduceMotion) {
        element.dataset.revealState = 'visible';
        return;
      }

      element.dataset.revealState = 'pending';
      intersectionObserver.observe(element);
    };

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const element = entry.target as HTMLElement;
          element.dataset.revealState = 'visible';
          intersectionObserver.unobserve(element);
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.12 },
    );

    const register = (root: ParentNode) => {
      if (root instanceof Element && root.matches(REVEAL_SELECTOR)) reveal(root);
      root.querySelectorAll(REVEAL_SELECTOR).forEach(reveal);
    };

    register(document);
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element) register(node);
        });
      });
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      mutationObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, [location.pathname]);

  return null;
}
