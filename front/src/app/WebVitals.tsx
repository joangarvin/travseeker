import { useEffect, useRef } from 'react';
import { API_BASE_URL } from '../services/api';

type VitalName = 'FCP' | 'LCP' | 'CLS';

function reportVital(name: VitalName, value: number) {
  if (!Number.isFinite(value) || value <= 0) return;
  const payload = JSON.stringify({ name, value, path: window.location.pathname });
  const body = new Blob([payload], { type: 'application/json' });
  if (navigator.sendBeacon?.(`${API_BASE_URL}/metrics`, body)) return;
  void fetch(`${API_BASE_URL}/metrics`, {
    method: 'POST',
    body: payload,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    keepalive: true,
  }).catch(() => undefined);
}

export function WebVitals() {
  const reported = useRef(new Set<VitalName>());

  useEffect(() => {
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
      paintObserver.observe({ type: 'paint', buffered: true });
      observers.push(paintObserver);
    } catch {
      // Older browsers can omit the paint entry type.
    }

    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entry = list.getEntries().at(-1);
        if (entry) lcp = entry.startTime;
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
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
      clsObserver.observe({ type: 'layout-shift', buffered: true });
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
  }, []);

  return null;
}
