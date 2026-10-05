import { locale, languages } from '../../i18n';
import { useEffect } from 'react';

type PageMetaProps = { title: string; description: string; canonical?: string };

function ensureMeta(name: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.name = name;
    document.head.appendChild(element);
  }
  element.content = content;
}

function ensureProperty(property: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute('property', property);
    document.head.appendChild(element);
  }
  element.content = content;
}

export function PageMeta({ title, description, canonical }: PageMetaProps) {
  useEffect(() => {
    document.title = title;
    ensureMeta('description', description);
    ensureProperty('og:title', title);
    ensureProperty('og:description', description);
    const canonicalUrl = canonical ?? `${window.location.origin}${window.location.pathname}`;
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    const localizedUrl = new URL(canonicalUrl);
    localizedUrl.searchParams.set('lang', locale);
    link.href = localizedUrl.toString();
    ensureProperty('og:locale', locale === 'en' ? 'en_GB' : 'es_ES');
    for (const language of languages) {
      let alternate = document.head.querySelector<HTMLLinkElement>(
        `link[rel="alternate"][hreflang="${language.code}"]`,
      );
      if (!alternate) {
        alternate = document.createElement('link');
        alternate.rel = 'alternate';
        alternate.hreflang = language.code;
        document.head.appendChild(alternate);
      }
      localizedUrl.searchParams.set('lang', language.code);
      alternate.href = localizedUrl.toString();
    }
  }, [canonical, description, title]);
  return null;
}
