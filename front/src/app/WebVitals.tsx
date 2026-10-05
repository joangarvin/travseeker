import { useConsent } from '../features/privacy/CookieConsent';
import { hasConsent } from '../features/privacy/consent';
import { useEffect, useRef } from 'react';
import { API_BASE_URL } from '../services/api';

type VitalName = 'FCP' | 'LCP' | 'CLS';

function reportVital(name: VitalName, value: number) {
  if (!hasConsent('analytics')) return;
  if (!Number.isFinite(value) || value <= 0) return;
  const section = window.location.pathname.split('/')[1];
  const path = [
    '',
    'destino',
    'mapa',
    'comparar',
    'favoritos',
    'colecciones',
    'viaje',
    'perfil',
    'admin',
    'auth',
    'sobre-nosotros',
  ].includes(section)
    ? `/${section}`
    : '/other';
  const payload = JSON.stringify({ name, value, path });
  void fetch(`${API_BASE_URL}/metrics`, {
    method: 'POST',
    body: payload,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'omit',
    keepalive: true,
  }).catch(() => undefined);
}

export function WebVitals() {
  const { analytics } = useConsent();
  const reported = useRef(new Set<VitalName>());

  useEffect(() => {
    if (!analytics) return;
    if (typeof PerformanceObserver === 'undefined') return undefined;
    let cls = 0;
    let lcp = 0;
    const observers: PerformanceObserver[] = [];
    const reportOnce = (name: VitalName, value: number) => {
      if (reported.current.has(name)) return;
      reported.current.add(name);
      reportVital(name, value);
    };

    try {
      const paintObserver = new PerformanceObserver((list) => {
        const fcp = list.getEntriesByName('first-contentful-paint')[0];
        if (fcp) reportOnce('FCP', fcp.startTime);
      });
      paintObserver.observe({ type: 'paint', buffered: false });
      observers.push(paintObserver);
    } catch {
      // Older browsers can omit the paint entry type.
    }

    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entry = list.getEntries().at(-1);
        if (entry) lcp = entry.startTime;
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: false });
      observers.push(lcpObserver);
    } catch {
      // LCP is progressively enhanced where the browser exposes it.
    }

    try {
      const clsObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (!(entry as PerformanceEntry & { hadRecentInput?: boolean }).hadRecentInput) {
            cls += (entry as PerformanceEntry & { value?: number }).value || 0;
          }
        });
      });
      clsObserver.observe({ type: 'layout-shift', buffered: false });
      observers.push(clsObserver);
    } catch {
      // CLS is progressively enhanced where the browser exposes it.
    }

    const reportFinalMetrics = () => {
      if (document.visibilityState !== 'hidden') return;
      if (lcp) reportOnce('LCP', lcp);
      if (cls) reportOnce('CLS', cls);
    };
    document.addEventListener('visibilitychange', reportFinalMetrics);
    return () => {
      observers.forEach((observer) => observer.disconnect());
      document.removeEventListener('visibilitychange', reportFinalMetrics);
      if (lcp) reportOnce('LCP', lcp);
      if (cls) reportOnce('CLS', cls);
    };
  }, [analytics]);

  return null;
}
